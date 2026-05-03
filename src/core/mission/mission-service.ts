import { GitAdapter } from "../../adapters/git/git.js";
import { FileStore } from "../../adapters/file-store/file-store.js";
import { AppError } from "../../shared/errors.js";
import { createMissionId } from "../../shared/ids.js";
import { nowIso } from "../../shared/time.js";
import type { SovrynConfig } from "../config.js";
import { configExists, initConfig, loadConfig } from "../config.js";
import { createRunner } from "../runner/registry.js";
import type { Store } from "../storage/types.js";
import { runVerify } from "../verify/verifier.js";
import { WorkspaceManager } from "../workspace/workspace-manager.js";
import { createReview } from "../review/review.js";
import { evaluatePolicy } from "../policy/policy.js";
import type { MissionState } from "./types.js";

export class MissionService {
  readonly store: Store;
  readonly git: GitAdapter;

  constructor(readonly root: string) {
    this.store = new FileStore(root);
    this.git = new GitAdapter(root);
  }

  async init(): Promise<{ config: SovrynConfig }> {
    await this.git.ensureRepo();
    const config = await initConfig(this.root);
    await this.store.init();
    return { config };
  }

  async config(): Promise<SovrynConfig> {
    if (!(await configExists(this.root))) {
      throw new AppError("CONFIG_MISSING", "Run sovryn init first.");
    }
    return loadConfig(this.root);
  }

  async spawn(goal: string, runnerName?: string): Promise<{ mission: MissionState; artifactRefs: string[] }> {
    const config = await this.config();
    await this.store.init();
    if (!(await this.git.hasRef(config.git.baseBranch))) {
      throw new AppError("BASE_BRANCH_MISSING", `Base branch not found: ${config.git.baseBranch}`);
    }
    const id = createMissionId();
    const workspace = await new WorkspaceManager(this.root, config, this.git).create(id);
    const now = nowIso();
    const mission: MissionState = {
      id,
      goal,
      status: "created",
      runner: runnerName ?? config.runner.default,
      branch: workspace.branch,
      baseBranch: config.git.baseBranch,
      worktreePath: workspace.worktreePath,
      createdAt: now,
      updatedAt: now,
      attempts: [],
      approvals: [],
      risk: null,
      lastVerifyPassed: null,
      finalizedCommit: null
    };
    await this.store.writeMission(mission);
    await this.store.writeGoal(id, goal);
    await this.store.appendJournal(id, `- ${now} created mission in ${workspace.worktreePath}`);
    const updated = await this.runAttempt(mission, runnerName);
    return {
      mission: updated,
      artifactRefs: [`.sovryn/missions/${id}/state.json`, `.sovryn/missions/${id}/journal.md`]
    };
  }

  async continue(id: string): Promise<{ mission: MissionState; artifactRefs: string[] }> {
    const mission = await this.store.readMission(id);
    if (mission.status === "finalized" || mission.status === "rejected") {
      throw new AppError("MISSION_CLOSED", `Mission is ${mission.status}.`, { id, status: mission.status });
    }
    const updated = await this.runAttempt(mission, mission.runner);
    return {
      mission: updated,
      artifactRefs: [`.sovryn/missions/${id}/state.json`, `.sovryn/missions/${id}/journal.md`]
    };
  }

  async verify(id: string): Promise<{ mission: MissionState; verify: unknown; artifactRefs: string[] }> {
    const config = await this.config();
    const mission = await this.store.readMission(id);
    const verify = await runVerify(mission.worktreePath, config);
    const attempt = Math.max(1, mission.attempts.length);
    await this.store.writeAttemptFile(id, attempt, "verify.json", JSON.stringify(verify, null, 2));
    mission.lastVerifyPassed = verify.passed;
    mission.status = verify.passed ? "passed" : "failed";
    mission.updatedAt = nowIso();
    await this.store.writeMission(mission);
    return { mission, verify, artifactRefs: [`.sovryn/missions/${id}/attempts/${String(attempt).padStart(3, "0")}/verify.json`] };
  }

  async review(id: string): Promise<{ mission: MissionState; review: unknown; artifactRefs: string[] }> {
    const config = await this.config();
    const mission = await this.store.readMission(id);
    const review = await createReview({ root: this.root, mission, config, store: this.store, git: this.git });
    mission.risk = review.risk;
    mission.updatedAt = nowIso();
    await this.store.writeMission(mission);
    return { mission, review, artifactRefs: review.artifactRefs };
  }

  async approve(id: string, note: string | null = null): Promise<{ mission: MissionState }> {
    const mission = await this.store.readMission(id);
    const by = await gitIdentity(this.root);
    mission.approvals.push({ by, at: nowIso(), note });
    mission.updatedAt = nowIso();
    await this.store.writeMission(mission);
    await this.store.writeMissionFile(id, "approval.json", JSON.stringify(mission.approvals.at(-1), null, 2));
    await this.store.appendJournal(id, `- ${mission.updatedAt} approved by ${by}`);
    return { mission };
  }

  async finalize(id: string): Promise<{ mission: MissionState; commit: string | null }> {
    const config = await this.config();
    const mission = await this.store.readMission(id);
    if (mission.status !== "passed") {
      throw new AppError("MISSION_NOT_PASSED", "Finalize requires a passed mission.", { id, status: mission.status });
    }
    const diff = await this.git.diffSummary(mission.worktreePath, mission.baseBranch);
    const patch = await this.git.diffPatch(mission.worktreePath, mission.baseBranch);
    const policy = await evaluatePolicy({ root: this.root, mission, config, diff, patch });
    mission.risk = policy.risk;
    if (!policy.allowed) {
      await this.store.writeMission(mission);
      throw new AppError("POLICY_BLOCKED", "Finalize blocked by policy.", { checks: policy.checks });
    }
    const commit = await this.git.commitWorktree(mission.worktreePath, `sovryn: finalize ${mission.id}`);
    if (commit) await this.git.fastForward(mission.baseBranch, mission.branch);
    mission.status = "finalized";
    mission.finalizedCommit = commit;
    mission.updatedAt = nowIso();
    await this.store.writeMission(mission);
    await this.store.appendJournal(id, `- ${mission.updatedAt} finalized ${commit ?? "without changes"}`);
    try {
      await new WorkspaceManager(this.root, config, this.git).remove(mission.worktreePath);
    } catch {
      // Worktree cleanup failures are non-fatal after a successful merge.
    }
    return { mission, commit };
  }

  async reject(id: string): Promise<{ mission: MissionState }> {
    const config = await this.config();
    const mission = await this.store.readMission(id);
    if (mission.status !== "finalized") {
      await new WorkspaceManager(this.root, config, this.git).remove(mission.worktreePath);
    }
    mission.status = "rejected";
    mission.updatedAt = nowIso();
    await this.store.writeMission(mission);
    await this.store.appendJournal(id, `- ${mission.updatedAt} rejected`);
    return { mission };
  }

  private async runAttempt(mission: MissionState, runnerName?: string): Promise<MissionState> {
    const config = await this.config();
    const runner = createRunner(runnerName ?? mission.runner, config);
    const attemptNumber = mission.attempts.length + 1;
    const startedAt = nowIso();
    mission.status = "running";
    mission.updatedAt = startedAt;
    await this.store.writeMission(mission);
    await this.store.writeAttemptFile(mission.id, attemptNumber, "prompt.md", `# Goal\n\n${mission.goal}\n`);
    await this.store.appendJournal(mission.id, `- ${startedAt} attempt ${attemptNumber} started with ${runner.name}`);

    const result = await runner.run({
      missionId: mission.id,
      goal: mission.goal,
      worktreePath: mission.worktreePath,
      attempt: attemptNumber
    });
    await this.store.writeAttemptFile(mission.id, attemptNumber, "stdout.txt", result.stdout);
    await this.store.writeAttemptFile(mission.id, attemptNumber, "stderr.txt", result.stderr);
    await this.store.writeAttemptFile(mission.id, attemptNumber, "result.json", JSON.stringify(result, null, 2));

    const verify = await runVerify(mission.worktreePath, config);
    await this.store.writeAttemptFile(mission.id, attemptNumber, "verify.json", JSON.stringify(verify, null, 2));
    const finishedAt = nowIso();
    const passed = result.exitCode === 0 && verify.passed;
    mission.attempts.push({
      number: attemptNumber,
      runner: runner.name,
      exitCode: result.exitCode,
      startedAt,
      finishedAt,
      verifyPassed: verify.passed
    });
    mission.status = passed ? "passed" : "failed";
    mission.lastVerifyPassed = verify.passed;
    mission.updatedAt = finishedAt;
    await this.store.writeMission(mission);
    await this.store.appendJournal(mission.id, `- ${finishedAt} attempt ${attemptNumber} ${passed ? "passed" : "failed"}`);
    return mission;
  }
}

async function gitIdentity(root: string): Promise<string> {
  const { runCommand } = await import("../../adapters/shell/command.js");
  const name = (await runCommand("git config user.name", root)).stdout.trim() || "unknown";
  const email = (await runCommand("git config user.email", root)).stdout.trim();
  return email ? `${name} <${email}>` : name;
}
