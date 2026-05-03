import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { arch, platform } from "node:os";
import { join, relative } from "node:path";
import { runCommand, type CommandResult } from "../../adapters/shell/command.js";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import type { OpenInventionMissionState } from "../invention/invention-types.js";
import { assertNodeCommandAllowed } from "./node-policy.js";
import type { NodeArtifactIndex, NodeEnvironment, NodeRegistration, NodeRunResult } from "./node-types.js";

export interface NodeAlphaBackend {
  inspectEnvironment(): Promise<NodeEnvironment>;
  runCommand(command: string, cwd: string, options?: { allowNetwork?: boolean }): Promise<CommandResult>;
  installPackages(workspacePath: string, packages?: string[]): Promise<CommandResult>;
  cloneRepository(url: string, workspacePath: string): Promise<CommandResult>;
  runOpenInvention(mission: OpenInventionMissionState): Promise<NodeRunResult>;
  readLogs(missionId: string): Promise<string>;
  readArtifacts(missionId: string): Promise<NodeArtifactIndex>;
}

export class LocalNodeAlphaBackend implements NodeAlphaBackend {
  constructor(private readonly root: string, private readonly registration: NodeRegistration) {}

  async inspectEnvironment(): Promise<NodeEnvironment> {
    const [nodeVersion, npmVersion, gitVersion, uname] = await Promise.all([
      commandOutput("node --version", this.root),
      commandOutput("npm --version", this.root),
      commandOutput("git --version", this.root),
      commandOutput("uname -a", this.root)
    ]);
    return {
      platform: platform(),
      arch: arch(),
      nodeVersion,
      npmVersion,
      gitVersion,
      uname
    };
  }

  async runCommand(command: string, cwd: string, options: { allowNetwork?: boolean } = {}): Promise<CommandResult> {
    assertNodeCommandAllowed(command);
    return runCommand(command, cwd, { allowNetwork: options.allowNetwork ?? false });
  }

  async installPackages(workspacePath: string, packages: string[] = []): Promise<CommandResult> {
    const command = packages.length > 0 ? `npm install ${packages.map(shellQuote).join(" ")}` : "npm install";
    return this.runCommand(command, workspacePath, { allowNetwork: true });
  }

  async cloneRepository(url: string, workspacePath: string): Promise<CommandResult> {
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(url)) {
      throw new AppError("NODE_REPO_CLONE_BLOCKED", "Node Alpha MVP only clones public GitHub HTTPS repositories.", { url });
    }
    return this.runCommand(`git clone ${shellQuote(url)}`, workspacePath, { allowNetwork: true });
  }

  async runOpenInvention(mission: OpenInventionMissionState): Promise<NodeRunResult> {
    const startedAt = nowIso();
    const workspacePath = join(this.workspacesPath(), mission.id);
    const artifactsPath = join(this.artifactsPath(), mission.id);
    const logPath = join(this.logsPath(), `${mission.id}.log`);
    const sourcePath = join(this.root, mission.inventionPath);
    const workspaceInventionPath = join(workspacePath, "invention");
    const workspacePrototypePath = join(workspaceInventionPath, "prototype");

    await rm(workspacePath, { recursive: true, force: true });
    await rm(artifactsPath, { recursive: true, force: true });
    await mkdir(workspacePath, { recursive: true });
    await mkdir(artifactsPath, { recursive: true });
    await mkdir(this.logsPath(), { recursive: true });
    await cp(sourcePath, workspaceInventionPath, { recursive: true, force: true });

    const commands = [
      { command: "node --version", cwd: workspaceInventionPath, allowNetwork: false },
      { command: "npm --version", cwd: workspaceInventionPath, allowNetwork: false },
      { command: "git --version", cwd: workspaceInventionPath, allowNetwork: false },
      { command: "npm test", cwd: workspacePrototypePath, allowNetwork: false }
    ];
    let log = `# Node Alpha Run ${mission.id}\n\nStarted: ${startedAt}\nWorkspace: ${workspacePath}\n\n`;
    const results = [];
    for (const item of commands) {
      assertNodeCommandAllowed(item.command);
      const result = await runCommand(item.command, item.cwd, { allowNetwork: item.allowNetwork });
      results.push({ command: result.command, cwd: result.cwd, exitCode: result.exitCode });
      log += `## ${item.command}\n\ncwd: ${relative(this.root, item.cwd)}\nexitCode: ${result.exitCode}\n\nstdout:\n${result.stdout}\n\nstderr:\n${result.stderr}\n\n`;
      if (result.exitCode !== 0) break;
    }

    const exitCode = results.every((result) => result.exitCode === 0) ? 0 : results.find((result) => result.exitCode !== 0)?.exitCode ?? 1;
    const completedAt = nowIso();
    log += `Completed: ${completedAt}\nExit code: ${exitCode}\n`;
    await writeFile(logPath, log, "utf8");

    await cp(join(workspaceInventionPath, "evidence"), join(artifactsPath, "evidence"), { recursive: true, force: true });
    const artifactIndex = await writeArtifactIndex(this.registration.id, mission.id, artifactsPath);
    const nodeEvidence = {
      nodeId: this.registration.id,
      missionId: mission.id,
      workspacePath,
      artifactsPath,
      logPath,
      startedAt,
      completedAt,
      exitCode,
      commands: results
    };
    await writeJson(join(sourcePath, "evidence", "node-alpha-run.json"), nodeEvidence);

    return {
      nodeId: this.registration.id,
      missionId: mission.id,
      workspacePath,
      logPath,
      artifactsPath,
      exitCode,
      startedAt,
      completedAt,
      commands: results
    };
  }

  async readLogs(missionId: string): Promise<string> {
    const { readFile } = await import("node:fs/promises");
    return readFile(join(this.logsPath(), `${missionId}.log`), "utf8");
  }

  async readArtifacts(missionId: string): Promise<NodeArtifactIndex> {
    return readJson<NodeArtifactIndex>(join(this.artifactsPath(), missionId, "index.json"));
  }

  private workspacesPath(): string {
    return join(this.root, ".sovryn", "node-alpha", "workspaces");
  }

  private logsPath(): string {
    return join(this.root, ".sovryn", "node-alpha", "logs");
  }

  private artifactsPath(): string {
    return join(this.root, ".sovryn", "node-alpha", "artifacts");
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

async function commandOutput(command: string, cwd: string): Promise<string | null> {
  try {
    const result = await runCommand(command, cwd, { allowNetwork: false });
    return result.exitCode === 0 ? result.stdout.trim() : null;
  } catch {
    return null;
  }
}

async function writeArtifactIndex(nodeId: string, missionId: string, artifactsPath: string): Promise<NodeArtifactIndex> {
  const artifacts = await listArtifactFiles(artifactsPath, artifactsPath);
  const index: NodeArtifactIndex = {
    nodeId,
    missionId,
    artifacts,
    updatedAt: nowIso()
  };
  await writeJson(join(artifactsPath, "index.json"), index);
  return index;
}

async function listArtifactFiles(root: string, dir: string): Promise<string[]> {
  const { readdir, stat } = await import("node:fs/promises");
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) out.push(...(await listArtifactFiles(root, path)));
    else out.push(relative(root, path));
  }
  return out.sort();
}
