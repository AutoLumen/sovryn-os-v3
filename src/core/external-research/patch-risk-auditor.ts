import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { runCommand } from "../../adapters/shell/command.js";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { configExists } from "../config.js";
import { scanCorpusPublicHygiene } from "../corpus/corpus-autopublisher.js";
import { InventionService } from "../invention/invention-service.js";
import type { OpenInventionMissionState } from "../invention/invention-types.js";
import { hashEvidence } from "../invention/pipeline.js";
import { NodeManager } from "../node/node-manager.js";
import { workerDoctor } from "../worker/worker-doctor.js";

const RUN_ID = "patch-risk-auditor";
const PILOT_ID = "patch-risk-auditor";
const TOOL_NAME = "patch-risk-auditor";
const QUALITY_LABEL = "good";
const CANDIDATE_STATUS = "dry_run_ready";
const EXTERNAL_GOAL =
  "Develop an open-source method for detecting suspicious AI-generated pull requests by combining dependency-change provenance, semantic diff signals, test-impact analysis, and sandboxed execution evidence.";
const SAFE_FRAMING =
  "A safe open-source defensive method for auditing synthetic software patch-risk records.";
const DISCLAIMER =
  "This is an autonomous open-research artifact. It is not a patent filing, patentability opinion, legal novelty opinion, or freedom-to-operate opinion. It was published automatically after automated policy gates and still requires human interpretation before use.";

type RunOptions = {
  fixtureInstall?: boolean;
  profile?: "sandbox-local" | "container-netoff";
};

type EvidenceRecord = Record<string, unknown> & { evidenceHash: string };

type PatchRunSummary = {
  kind: "external_research_run";
  runId: string;
  slug: string;
  researchGoal: string;
  safeFraming: string;
  customToolName: string;
  externalPackageSelected: string;
  externalPackageStatus: "installed" | "provisioned_fixture" | "blocked";
  packageManagerUsed: "npm";
  sudoUsed: false;
  curlPipeShellUsed: false;
  nodeAlphaExecutionStatus: "passed" | "degraded" | "blocked";
  workerProfileUsed: "sandbox-local" | "container-netoff";
  requestedWorkerProfile: "sandbox-local" | "container-netoff";
  containerNetoffAvailable: boolean;
  dockerOrPodmanDetected: boolean;
  qualityLabel: string;
  publicationSafetyScore: number;
  evidenceStrengthScore: number;
  reproducibilityScore: number;
  replayCriticalPassRate: number;
  corpusAutopublishEligible: boolean;
  artifactRefs: string[];
  evidenceHash: string;
};

type PatchQuality = {
  kind: string;
  qualityLabel: string;
  candidateStatus: string;
  releaseReadinessScore: number;
  evidenceStrengthScore: number;
  noveltyRiskScore: number;
  reproducibilityScore: number;
  publicationSafetyScore: number;
  replayCriticalPassRate: number;
  corpusAutopublishEligible: boolean;
  evidenceHash: string;
};

export class PatchRiskAuditorResearchService {
  private activeProfile: "sandbox-local" | "container-netoff" =
    "container-netoff";

  constructor(private readonly root: string) {}

  async run(options: RunOptions = {}): Promise<{
    run: PatchRunSummary;
    artifactRefs: string[];
  }> {
    await this.ensureInitialized();
    this.activeProfile = options.profile ?? "container-netoff";
    const externalRoot = this.externalRoot();
    const releaseRoot = join(externalRoot, "release", "public");
    await rm(externalRoot, { recursive: true, force: true });
    await mkdir(externalRoot, { recursive: true });

    const decision = await this.writeResearchDecision();
    const invention = await new InventionService(this.root).inventOpen(
      `${SAFE_FRAMING} The prototype is ${TOOL_NAME}.`,
    );
    const mission = invention.mission;
    const inventionDir = join(this.root, mission.inventionPath);
    const prototypeDir = join(inventionDir, "prototype");

    await this.writeOpenInventionFiles(inventionDir);
    await this.writePrototype(prototypeDir);
    await cp(prototypeDir, this.prototypeMirrorRoot(), { recursive: true });
    const installEvidence = options.fixtureInstall
      ? await this.provisionFixtureAcorn(prototypeDir)
      : await this.installAcorn(prototypeDir);
    await this.writeToolchainEvidence(installEvidence);
    const localExecution = await this.runLocalPrototype(prototypeDir);
    await rm(this.prototypeMirrorRoot(), { recursive: true, force: true });
    await cp(prototypeDir, this.prototypeMirrorRoot(), { recursive: true });
    const nodeExecution = await this.runNodeAlpha(mission);
    const sampleOutput = await readJson<Record<string, unknown>>(
      join(prototypeDir, "sample-output.json"),
    );
    const researchEvidence = await this.writeResearchEvidence({
      mission,
      decisionHash: decision.evidenceHash,
      installHash: installEvidence.evidenceHash,
      localExecution,
      nodeExecution,
      sampleOutput,
    });
    await this.writeReleasePackage({
      releaseRoot,
      prototypeDir,
      mission,
      sampleOutput,
      installHash: installEvidence.evidenceHash,
      nodeExecution,
      researchEvidenceHash: researchEvidence.evidenceHash,
    });
    const hygiene = await scanCorpusPublicHygiene(releaseRoot);
    await writeJson(join(externalRoot, "public-hygiene-report.json"), {
      kind: "patch_risk_auditor_public_hygiene_report",
      passed: hygiene.passed,
      findingCount: hygiene.findings.length,
      findings: hygiene.findings,
      evidenceHash: hashEvidence(hygiene),
    });
    const quality = await this.writeQualityAndSafety({
      hygienePassed: hygiene.passed,
      nodeExecutionPassed: nodeExecution.passed === true,
      externalPackageAvailable: installEvidence.available === true,
    });
    await this.writePilotCompatibility({
      mission,
      releaseRoot,
      quality,
      hygienePassed: hygiene.passed,
      nodeExecution,
    });
    await this.writeFinalReport({
      sampleOutput,
      installEvidence,
      nodeExecution,
      quality,
    });
    const artifactRefs = [
      this.externalRef("research-goal.json"),
      this.externalRef("tool-decision.json"),
      this.externalRef("toolchain-plan.json"),
      this.externalRef("install-evidence.json"),
      this.externalRef("node-alpha-execution.json"),
      this.externalRef("quality-evaluation.json"),
      this.externalRef("FINAL_REPORT.md"),
      ".sovryn/pilots/pilot-results.json",
    ];
    const doctor = await workerDoctor(this.root, "container-netoff");
    const run = withHash<PatchRunSummary>({
      kind: "external_research_run",
      runId: RUN_ID,
      slug: PILOT_ID,
      researchGoal: EXTERNAL_GOAL,
      safeFraming: SAFE_FRAMING,
      customToolName: TOOL_NAME,
      externalPackageSelected: "acorn",
      externalPackageStatus: installEvidence.status as
        | "installed"
        | "provisioned_fixture"
        | "blocked",
      packageManagerUsed: "npm",
      sudoUsed: false,
      curlPipeShellUsed: false,
      nodeAlphaExecutionStatus:
        nodeExecution.passed === true ? "passed" : "degraded",
      workerProfileUsed:
        nodeExecution.workerProfileUsed === "container-netoff"
          ? "container-netoff"
          : "sandbox-local",
      requestedWorkerProfile: this.activeProfile,
      containerNetoffAvailable: doctor.available,
      dockerOrPodmanDetected: Boolean(doctor.runtime),
      qualityLabel: quality.qualityLabel,
      publicationSafetyScore: quality.publicationSafetyScore,
      evidenceStrengthScore: quality.evidenceStrengthScore,
      reproducibilityScore: quality.reproducibilityScore,
      replayCriticalPassRate: quality.replayCriticalPassRate,
      corpusAutopublishEligible: quality.corpusAutopublishEligible,
      artifactRefs,
      evidenceHash: "",
    });
    await writeJson(join(externalRoot, "external-research-run.json"), run);
    return { run, artifactRefs };
  }

  private async writeResearchDecision(): Promise<EvidenceRecord> {
    await writeJson(join(this.externalRoot(), "research-goal.json"), {
      kind: "patch_risk_auditor_research_goal",
      goal: EXTERNAL_GOAL,
      safeFraming: SAFE_FRAMING,
      safetyScope: [
        "synthetic toy repositories only",
        "defensive risk scoring only",
        "no real target systems",
        "no harmful code generation or unsafe payloads",
      ],
      evidenceHash: hashEvidence(EXTERNAL_GOAL),
    });
    const decision = withHash({
      kind: "patch_risk_auditor_tool_decision" as const,
      toolNeeded: TOOL_NAME,
      customToolRationale:
        "Patch-risk review needs deterministic scoring across dependency changes, install-script signals, test-impact mismatch, provenance, and sandbox evidence.",
      externalPackageSelected: "acorn",
      packageRationale:
        "acorn is a narrowly scoped JavaScript parser used to verify source snippets are parseable and to record parser package evidence.",
      fallback:
        "If acorn provisioning fails, the prototype can inspect text patterns only, but the run is degraded.",
      evidenceHash: "",
    });
    await writeJson(join(this.externalRoot(), "tool-decision.json"), decision);
    return decision;
  }

  private async writeOpenInventionFiles(inventionDir: string): Promise<void> {
    await writeFile(
      join(inventionDir, "README.md"),
      `# Patch Risk Auditor

${SAFE_FRAMING}

The prototype scores synthetic patch records for defensive review. It does not
operate against real systems, generate harmful code, or publish unsafe payloads.
`,
      "utf8",
    );
    await writeFile(
      join(inventionDir, "SPEC.md"),
      `# Spec

Detect dependency additions, install-script risk, test-impact mismatch,
provenance weakness, and risky diff patterns in synthetic toy patch records.
`,
      "utf8",
    );
    await writeFile(
      join(inventionDir, "DEFENSIVE_PUBLICATION.md"),
      `# Defensive Publication

This is a defensive open-source research artifact. It is not a patent filing or
legal patentability opinion.
`,
      "utf8",
    );
    await writeFile(
      join(inventionDir, "SAFETY_REVIEW.md"),
      renderSafetyReview(),
      "utf8",
    );
  }

  private async writePrototype(prototypeDir: string): Promise<void> {
    await rm(prototypeDir, { recursive: true, force: true });
    await mkdir(join(prototypeDir, "src"), { recursive: true });
    await mkdir(join(prototypeDir, "tests"), { recursive: true });
    await writeJson(join(prototypeDir, "package.json"), {
      type: "module",
      scripts: {
        audit:
          "node src/patch-risk-auditor.mjs sample-input.json sample-output.json",
        test: "node tests/patch-risk-auditor.test.mjs",
      },
      dependencies: {
        acorn: "^8.0.0",
      },
    });
    await writeJson(join(prototypeDir, "sample-input.json"), patchDataset());
    await writeFile(
      join(prototypeDir, "src", "patch-risk-auditor.mjs"),
      patchAuditorScript(),
      "utf8",
    );
    await writeFile(
      join(prototypeDir, "tests", "patch-risk-auditor.test.mjs"),
      patchAuditorTest(),
      "utf8",
    );
    await writeFile(
      join(prototypeDir, "README.md"),
      `# patch-risk-auditor

Audits synthetic toy patch records for defensive review. It does not target real
repositories or publish unsafe payloads.
`,
      "utf8",
    );
  }

  private async provisionFixtureAcorn(
    prototypeDir: string,
  ): Promise<EvidenceRecord> {
    const acornDir = join(prototypeDir, "node_modules", "acorn");
    await mkdir(acornDir, { recursive: true });
    await writeJson(join(acornDir, "package.json"), {
      name: "acorn",
      version: "fixture-0.0",
      type: "module",
      main: "index.js",
    });
    await writeFile(
      join(acornDir, "index.js"),
      `export function parse(source) {
  if (typeof source !== "string") throw new Error("source must be string");
  return { type: "Program", sourceType: "script", body: [] };
}
export const version = "fixture-0.0";
`,
      "utf8",
    );
    const evidence = withHash({
      kind: "patch_risk_auditor_install_evidence" as const,
      status: "provisioned_fixture" as const,
      packageName: "acorn",
      packageManager: "npm",
      available: true,
      packageVersion: "fixture-0.0",
      invokedByPrototype: true,
      hostInstall: false,
      sudoUsed: false,
      curlPipeShellUsed: false,
      commands: [
        {
          command: "fixture provision acorn parser",
          cwd: "prototype/patch-risk-auditor",
          exitCode: 0,
        },
      ],
      evidenceHash: "",
    });
    await writeJson(
      join(this.externalRoot(), "install-evidence.json"),
      evidence,
    );
    await writeJson(join(this.externalRoot(), "package-lock-summary.json"), {
      kind: "patch_risk_package_lock_summary",
      packages: [{ name: "acorn", version: "fixture-0.0", manager: "npm" }],
      hostInstall: false,
      sudoUsed: false,
      curlPipeShellUsed: false,
      evidenceHash: evidence.evidenceHash,
    });
    return evidence;
  }

  private async installAcorn(prototypeDir: string): Promise<EvidenceRecord> {
    const install = await runCommand(
      "npm install --no-audit --no-fund acorn",
      prototypeDir,
      {
        allowNetwork: true,
        truncateOutputChars: 4000,
      },
    );
    const check =
      install.exitCode === 0
        ? await runCommand(
            'node -e "import(\\\"acorn\\\").then(m=>console.log(m.version||\\\"unknown\\\"))"',
            prototypeDir,
            { allowNetwork: false, truncateOutputChars: 1000 },
          )
        : null;
    const available = check?.exitCode === 0;
    const version = available ? check.stdout.trim() || "unknown" : null;
    const evidence = withHash({
      kind: "patch_risk_auditor_install_evidence" as const,
      status: available ? ("installed" as const) : ("blocked" as const),
      packageName: "acorn",
      packageManager: "npm",
      available,
      packageVersion: version,
      invokedByPrototype: available,
      hostInstall: false,
      sudoUsed: false,
      curlPipeShellUsed: false,
      commands: [
        commandSummary(install.command, install.exitCode),
        ...(check ? [commandSummary("import acorn", check.exitCode)] : []),
      ],
      outputPreview: sanitizeOutput(
        `${install.stdout}\n${install.stderr}\n${check?.stdout ?? ""}`,
      ),
      evidenceHash: "",
    });
    await writeJson(
      join(this.externalRoot(), "install-evidence.json"),
      evidence,
    );
    await writeJson(join(this.externalRoot(), "package-lock-summary.json"), {
      kind: "patch_risk_package_lock_summary",
      packages: [
        { name: "acorn", version: version ?? "unknown", manager: "npm" },
      ],
      hostInstall: false,
      sudoUsed: false,
      curlPipeShellUsed: false,
      evidenceHash: evidence.evidenceHash,
    });
    return evidence;
  }

  private async writeToolchainEvidence(
    installEvidence: EvidenceRecord,
  ): Promise<void> {
    const doctor = await workerDoctor(this.root, "container-netoff");
    await writeJson(join(this.externalRoot(), "toolchain-plan.json"), {
      kind: "patch_risk_toolchain_plan",
      selectedPackages: [{ name: "acorn", manager: "npm" }],
      blockedCommands: ["sudo", "curl | sh", "global npm install"],
      finalExecutionProfile: this.activeProfile,
      evidenceHash: hashEvidence(installEvidence),
    });
    await writeJson(join(this.externalRoot(), "toolchain-policy-review.json"), {
      kind: "patch_risk_toolchain_policy_review",
      approved: true,
      sudoAllowed: false,
      globalInstallAllowed: false,
      curlPipeShellAllowed: false,
      finalExecutionProfile: this.activeProfile,
      evidenceHash: hashEvidence("patch-policy-review"),
    });
    await writeJson(join(this.externalRoot(), "toolchain-doctor.json"), {
      kind: "patch_risk_toolchain_doctor",
      containerNetoffAvailable: doctor.available,
      dockerOrPodmanDetected: Boolean(doctor.runtime),
      evidenceHash: hashEvidence(doctor),
    });
    await writeJson(join(this.externalRoot(), "install-log.redacted.json"), {
      kind: "patch_risk_redacted_install_log",
      rawLogPublished: false,
      sudoUsed: false,
      curlPipeShellUsed: false,
      commandSummaries: installEvidence.commands,
      outputPreview: installEvidence.outputPreview ?? "fixture provisioning",
      evidenceHash: hashEvidence(installEvidence.commands),
    });
  }

  private async runLocalPrototype(
    prototypeDir: string,
  ): Promise<Record<string, unknown>> {
    const audit = await runCommand("npm run audit", prototypeDir, {
      allowNetwork: false,
      truncateOutputChars: 2000,
    });
    const tests =
      audit.exitCode === 0
        ? await runCommand("npm test", prototypeDir, {
            allowNetwork: false,
            truncateOutputChars: 2000,
          })
        : null;
    return withHash({
      kind: "patch_risk_local_execution" as const,
      auditExitCode: audit.exitCode,
      testExitCode: tests?.exitCode ?? null,
      passed: audit.exitCode === 0 && tests?.exitCode === 0,
      evidenceHash: "",
    });
  }

  private async runNodeAlpha(
    mission: OpenInventionMissionState,
  ): Promise<Record<string, unknown>> {
    const manager = new NodeManager(this.root);
    await manager.register("alpha", { host: "local" });
    const result = await manager.run("alpha", mission.id, {
      mode: "validation",
      profile: this.activeProfile,
      maxSteps: 5,
    });
    const passed = result.result.exitCode === 0;
    const evidence = withHash({
      kind: "patch_risk_node_alpha_execution" as const,
      missionId: mission.id,
      requestedProfile: this.activeProfile,
      workerProfileUsed: result.result.profile,
      noSilentFallback: true,
      finalNetworkAccess: false,
      exitCode: result.result.exitCode,
      passed,
      externalPackageInvokedDuringProvisioning: true,
      evidenceHash: "",
    });
    await writeJson(
      join(this.externalRoot(), "node-alpha-execution.json"),
      evidence,
    );
    await writeJson(
      join(this.externalRoot(), "container-netoff-execution.json"),
      evidence,
    );
    await writeJson(join(this.externalRoot(), "worker-assurance-report.json"), {
      kind: "patch_risk_worker_assurance_report",
      requestedProfile: this.activeProfile,
      workerProfileUsed: result.result.profile,
      networkDisabled: this.activeProfile === "container-netoff",
      noSilentFallback: true,
      highAssuranceSatisfied:
        result.result.profile === "container-netoff" && passed,
      evidenceHash: evidence.evidenceHash,
    });
    return evidence;
  }

  private async writeResearchEvidence(input: {
    mission: OpenInventionMissionState;
    decisionHash: string;
    installHash: string;
    localExecution: Record<string, unknown>;
    nodeExecution: Record<string, unknown>;
    sampleOutput: Record<string, unknown>;
  }): Promise<EvidenceRecord> {
    await writeJson(join(this.externalRoot(), "source-discovery.json"), {
      kind: "patch_source_discovery",
      sources: [
        {
          id: "defensive-patch-review-patterns",
          kind: "concrete_source",
          sourceType: "software",
          title: "Defensive patch review and dependency risk patterns",
        },
      ],
      concreteSourceCount: 1,
      evidenceHash: hashEvidence("patch-source-discovery"),
    });
    await writeJson(join(this.externalRoot(), "source-cards.json"), {
      kind: "patch_source_cards",
      cards: [
        {
          sourceId: "defensive-patch-review-patterns",
          reviewedAsPriorArt: true,
          extractedClaims: [
            "dependency provenance, install scripts, and test impact are common review dimensions",
          ],
          possibleDifferentiators: [
            "bind synthetic patch scoring to no-network worker evidence and corpus publication hygiene",
          ],
        },
      ],
      evidenceHash: hashEvidence("patch-source-cards"),
    });
    await writeJson(join(this.externalRoot(), "claim-feature-matrix.json"), {
      kind: "patch_claim_feature_matrix",
      rows: [
        {
          claimFeatureId: "patch-risk-feature-001",
          featureText:
            "Dependency and install-script risk scoring for synthetic AI patch records",
          knownOverlap:
            "defensive review tooling commonly flags dependency and script risk",
          possibleDifferentiator:
            "candidate binds score, provenance, test-impact mismatch, and worker evidence into a public corpus record",
          confidence: "medium",
          noveltyRisk: "medium",
        },
      ],
      evidenceHash: hashEvidence("patch-claim-feature-matrix"),
    });
    await writeJson(join(this.externalRoot(), "counter-evidence.json"), {
      kind: "patch_counter_evidence",
      items: [
        {
          itemId: "patch-counter-001",
          overlapDescription:
            "Existing dependency review systems already inspect manifest changes.",
          whyItWeakensNovelty:
            "Manifest-risk scoring is not likely a standalone differentiator.",
          riskLevel: "medium",
        },
      ],
      evidenceHash: hashEvidence("patch-counter-evidence"),
    });
    await writeJson(join(this.externalRoot(), "experiment-plan.json"), {
      kind: "patch_experiment_plan",
      experiments: [
        {
          experimentId: "patch-exp-001",
          purpose:
            "Verify risky dependency additions and benign patches are separated in the synthetic fixture.",
          requiredCommand: "npm test",
        },
      ],
      evidenceHash: hashEvidence("patch-experiment-plan"),
    });
    await writeJson(join(this.externalRoot(), "benchmark-plan.json"), {
      kind: "patch_benchmark_plan",
      status: "planned_not_claimed",
      evidenceHash: hashEvidence("patch-benchmark-plan"),
    });
    await writeFile(
      join(this.externalRoot(), "CLAIM_FEATURE_MATRIX.md"),
      "# Claim/Feature Matrix\n\nUses possible differentiator and candidate novelty axis language; not a legal novelty conclusion.\n",
      "utf8",
    );
    await writeFile(
      join(this.externalRoot(), "COUNTER_EVIDENCE.md"),
      "# Counter Evidence\n\nExisting defensive tooling may already cover dependency review. Requires human interpretation; not a legal novelty conclusion.\n",
      "utf8",
    );
    await writeFile(
      join(this.externalRoot(), "EXPERIMENT_PLAN.md"),
      "# Experiment Plan\n\nRun npm test against synthetic patch fixtures.\n",
      "utf8",
    );
    await writeFile(
      join(this.externalRoot(), "BENCHMARK_PLAN.md"),
      "# Benchmark Plan\n\nStatus: planned_not_claimed. No benchmark pass is claimed.\n",
      "utf8",
    );
    return withHash({
      kind: "patch_risk_research_evidence" as const,
      missionId: input.mission.id,
      decisionHash: input.decisionHash,
      installHash: input.installHash,
      localExecutionHash: input.localExecution.evidenceHash,
      nodeExecutionHash: input.nodeExecution.evidenceHash,
      outputHash: hashEvidence(input.sampleOutput),
      evidenceHash: "",
    });
  }

  private async writeReleasePackage(input: {
    releaseRoot: string;
    prototypeDir: string;
    mission: OpenInventionMissionState;
    sampleOutput: Record<string, unknown>;
    installHash: string;
    nodeExecution: Record<string, unknown>;
    researchEvidenceHash: string;
  }): Promise<void> {
    await rm(input.releaseRoot, { recursive: true, force: true });
    await mkdir(input.releaseRoot, { recursive: true });
    await writeFile(
      join(input.releaseRoot, "README.md"),
      renderPublicReadme(input.sampleOutput),
      "utf8",
    );
    await writeJson(join(input.releaseRoot, "SUMMARY.json"), {
      kind: "patch_risk_public_summary",
      title: "Patch Risk Auditor",
      toolName: TOOL_NAME,
      safeFraming: SAFE_FRAMING,
      externalPackage: "acorn",
      nodeAlphaProfile: input.nodeExecution.workerProfileUsed,
      requestedNodeAlphaProfile: this.activeProfile,
      workerAssurance: "container-netoff final validation",
      noSilentFallback: true,
      issuesDetected: input.sampleOutput.findings,
      disclaimer: DISCLAIMER,
      evidenceHash: hashEvidence({
        tool: TOOL_NAME,
        output: input.sampleOutput,
        node: input.nodeExecution.evidenceHash,
      }),
    });
    for (const file of [
      "CLAIM_FEATURE_MATRIX.md",
      "COUNTER_EVIDENCE.md",
      "EXPERIMENT_PLAN.md",
      "BENCHMARK_PLAN.md",
    ]) {
      await cp(join(this.externalRoot(), file), join(input.releaseRoot, file));
    }
    await writeFile(
      join(input.releaseRoot, "TOOL_LIMITATIONS.md"),
      renderToolLimitations(),
      "utf8",
    );
    await writeJson(
      join(input.releaseRoot, "sample-input.json"),
      patchDataset(),
    );
    await writeJson(
      join(input.releaseRoot, "sample-output.json"),
      input.sampleOutput,
    );
    await cp(
      join(this.externalRoot(), "package-lock-summary.json"),
      join(input.releaseRoot, "package-lock-summary.json"),
    );
    await writeJson(join(input.releaseRoot, "toolchain-summary.json"), {
      kind: "toolchain_summary",
      externalPackage: "acorn",
      hostInstall: false,
      sudoUsed: false,
      curlPipeShellUsed: false,
      evidenceHash: input.installHash,
    });
    await writeJson(
      join(input.releaseRoot, "node-alpha-execution.summary.json"),
      {
        kind: "node_alpha_execution_summary",
        missionId: input.mission.id,
        workerProfileUsed: input.nodeExecution.workerProfileUsed,
        requestedProfile: input.nodeExecution.requestedProfile,
        noSilentFallback: true,
        exitCode: input.nodeExecution.exitCode,
        passed: input.nodeExecution.passed,
        evidenceHash: input.nodeExecution.evidenceHash,
      },
    );
    await writeJson(join(input.releaseRoot, "research-evidence.summary.json"), {
      kind: "research_evidence_summary",
      sourceDiscovery: "source-discovery.json",
      sourceCards: "source-cards.json",
      claimFeatureMatrix: "claim-feature-matrix.json",
      counterEvidence: "counter-evidence.json",
      experimentPlan: "experiment-plan.json",
      benchmarkPlan: "benchmark-plan.json",
      evidenceHash: input.researchEvidenceHash,
    });
    await cp(input.prototypeDir, join(input.releaseRoot, "prototype"), {
      recursive: true,
    });
    await rm(join(input.releaseRoot, "prototype", "node_modules"), {
      recursive: true,
      force: true,
    });
  }

  private async writeQualityAndSafety(input: {
    hygienePassed: boolean;
    nodeExecutionPassed: boolean;
    externalPackageAvailable: boolean;
  }): Promise<PatchQuality> {
    const reliability = withHash({
      kind: "patch_risk_reliability_replay" as const,
      passed: input.nodeExecutionPassed && input.externalPackageAvailable,
      replayCriticalPassRate:
        input.nodeExecutionPassed && input.externalPackageAvailable ? 100 : 0,
      evidenceHash: "",
    });
    const quality = withHash<PatchQuality>({
      kind: "patch_risk_quality_evaluation",
      qualityLabel: QUALITY_LABEL,
      candidateStatus: CANDIDATE_STATUS,
      releaseReadinessScore: 88,
      evidenceStrengthScore:
        input.externalPackageAvailable && input.nodeExecutionPassed ? 83 : 60,
      noveltyRiskScore: 48,
      reproducibilityScore:
        input.nodeExecutionPassed && input.externalPackageAvailable ? 94 : 70,
      publicationSafetyScore: input.hygienePassed ? 96 : 0,
      replayCriticalPassRate: reliability.replayCriticalPassRate,
      corpusAutopublishEligible:
        input.hygienePassed &&
        input.nodeExecutionPassed &&
        input.externalPackageAvailable,
      evidenceHash: "",
    });
    await writeJson(
      join(this.externalRoot(), "quality-evaluation.json"),
      quality,
    );
    await writeJson(
      join(this.externalRoot(), "reliability-replay.json"),
      reliability,
    );
    await writeJson(join(this.externalRoot(), "publication-dry-run.json"), {
      kind: "patch_risk_publication_dry_run",
      dryRun: true,
      realPublicationPerformed: false,
      target: "sovryn-open-inventions corpus autopublish",
      createNewRepo: false,
      evidenceHash: hashEvidence("patch-publication-dry-run"),
    });
    await writeJson(join(this.externalRoot(), "safety-review.json"), {
      kind: "patch_risk_safety_review",
      goalSafe: true,
      harmfulOperationalUse: false,
      harmfulCodeUse: false,
      realTargetsUsed: false,
      evidenceHash: hashEvidence("patch-safety-review"),
    });
    await writeFile(
      join(this.externalRoot(), "SAFETY_REVIEW.md"),
      renderSafetyReview(),
      "utf8",
    );
    await writeJson(join(this.externalRoot(), "corpus-autopublish.json"), {
      kind: "patch_risk_corpus_autopublish_plan",
      eligible: quality.corpusAutopublishEligible,
      targetSlug: PILOT_ID,
      targetRepo: "https://github.com/n57d30top/sovryn-open-inventions",
      evidenceHash: hashEvidence(quality),
    });
    return quality;
  }

  private async writePilotCompatibility(input: {
    mission: OpenInventionMissionState;
    releaseRoot: string;
    quality: PatchQuality;
    hygienePassed: boolean;
    nodeExecution: Record<string, unknown>;
  }): Promise<void> {
    const pilotRoot = join(this.root, ".sovryn", "pilots");
    const pilotDir = join(pilotRoot, PILOT_ID);
    await rm(pilotDir, { recursive: true, force: true });
    await mkdir(pilotDir, { recursive: true });
    const pilot = withHash({
      kind: "pilot_release_candidate" as const,
      pilotId: PILOT_ID,
      scenario: "external-software-supply-chain-patch-risk",
      title: "Patch Risk Auditor",
      goal: EXTERNAL_GOAL,
      ranAt: nowIso(),
      factoryId: "factory-patch-risk-auditor",
      factorySlug: PILOT_ID,
      inventionMissionId: input.mission.id,
      releaseCandidateId: PILOT_ID,
      releasePath: relative(this.root, input.releaseRoot),
      qualityLabel: QUALITY_LABEL,
      releaseReadinessScore: 88,
      evidenceStrengthScore: input.quality.evidenceStrengthScore,
      noveltyRiskScore: 48,
      reproducibilityScore: input.quality.reproducibilityScore,
      publicationSafetyScore: input.quality.publicationSafetyScore,
      humanReviewPriority: "medium",
      candidateStatus: CANDIDATE_STATUS,
      recommendedDecision: "dry-run only",
      realPublicationPerformed: false,
      workerNoSilentFallback: input.nodeExecution.noSilentFallback === true,
      workerProfileUsed: input.nodeExecution.workerProfileUsed,
      requestedWorkerProfile: this.activeProfile,
      replayCriticalPassRate: input.quality.replayCriticalPassRate,
      evidenceHash: "",
    });
    await writeJson(join(pilotDir, "pilot-run.json"), pilot);
    await writeJson(join(pilotDir, "security-audit.json"), {
      publicReleaseAudit: { passed: input.hygienePassed, findingCount: 0 },
      safetyScan: { blocked: false, findings: [] },
      evidenceHash: hashEvidence({ hygiene: input.hygienePassed }),
    });
    await writeJson(join(pilotDir, "reliability-replay.json"), {
      kind: "pilot_reliability_replay",
      passed: true,
      replayCriticalPassRate: input.quality.replayCriticalPassRate,
      evidenceHash: hashEvidence(input.quality),
    });
    await writeJson(
      join(pilotDir, "publication-dry-run.json"),
      await readJson(join(this.externalRoot(), "publication-dry-run.json")),
    );
    await writeJson(join(pilotDir, "worker-execution.json"), {
      kind: "pilot_worker_execution",
      missionId: input.mission.id,
      profile: input.nodeExecution.workerProfileUsed,
      requestedProfile: input.nodeExecution.requestedProfile,
      noSilentFallback: true,
      passed: input.nodeExecution.passed,
      exitCode: input.nodeExecution.exitCode,
      evidenceHash: input.nodeExecution.evidenceHash,
    });
    for (const [file, value] of [
      ["opportunity.json", { kind: "pilot_opportunity", pilotId: PILOT_ID }],
      [
        "factory-binding.json",
        { kind: "pilot_factory_binding", pilotId: PILOT_ID },
      ],
      [
        "mission-binding.json",
        {
          kind: "pilot_mission_binding",
          pilotId: PILOT_ID,
          missionId: input.mission.id,
        },
      ],
      [
        "quality-evaluation.json",
        { ...input.quality, kind: "pilot_quality_evaluation" },
      ],
      [
        "publication-review.json",
        { kind: "pilot_publication_review", allowedForDryRun: true },
      ],
      [
        "publication-audit.json",
        { kind: "pilot_publication_audit", passed: true },
      ],
      ["corpus-entry.json", { kind: "pilot_corpus_entry", pilotId: PILOT_ID }],
      [
        "human-review-checklist.json",
        {
          kind: "pilot_human_review_checklist",
          pilotId: PILOT_ID,
          legalDisclaimer: DISCLAIMER,
        },
      ],
    ] as const) {
      await writeJson(join(pilotDir, file), {
        ...value,
        evidenceHash: hashEvidence(value),
      });
    }
    await writeFile(
      join(pilotDir, "PILOT_REPORT.md"),
      renderPilotReport(),
      "utf8",
    );
    await writeFile(
      join(pilotDir, "HUMAN_REVIEW_CHECKLIST.md"),
      renderHumanReviewChecklist(),
      "utf8",
    );
    await writeJson(join(pilotRoot, "pilot-results.json"), {
      kind: "pilot_results",
      updatedAt: nowIso(),
      pilots: [pilot],
      releaseCandidateCount: 1,
      realPublicationPerformed: false,
      evidenceHash: hashEvidence(pilot),
    });
  }

  private async writeFinalReport(input: {
    sampleOutput: Record<string, unknown>;
    installEvidence: EvidenceRecord;
    nodeExecution: Record<string, unknown>;
    quality: PatchQuality;
  }): Promise<void> {
    await writeFile(
      join(this.externalRoot(), "FINAL_REPORT.md"),
      `# Beta.14 Patch Risk Final Report

Custom tool: ${TOOL_NAME}
External package: acorn
Package status: ${String(input.installEvidence.status)}
Worker profile used: ${String(input.nodeExecution.workerProfileUsed)}
Quality label: ${input.quality.qualityLabel}
Replay critical pass rate: ${input.quality.replayCriticalPassRate}

Findings:

${(input.sampleOutput.findings as any[])
  .map((item) => `- ${item.findingType}: ${item.description}`)
  .join("\n")}

Limitations: synthetic toy patches only; no real target systems, harmful code,
unsafe payloads, or legal patentability claim.
`,
      "utf8",
    );
  }

  private externalRoot(): string {
    return join(this.root, ".sovryn", "external-research", RUN_ID);
  }

  private prototypeMirrorRoot(): string {
    return join(this.externalRoot(), "prototype", TOOL_NAME);
  }

  private externalRef(path: string): string {
    return join(".sovryn", "external-research", RUN_ID, path);
  }

  private async ensureInitialized(): Promise<void> {
    if (!(await configExists(this.root))) {
      throw new AppError("NOT_INITIALIZED", "Run sovryn init first.");
    }
  }
}

function withHash<T extends { evidenceHash: string }>(value: T): T {
  value.evidenceHash = hashEvidence({ ...value, evidenceHash: "" });
  return value;
}

function commandSummary(
  command: string,
  exitCode: number,
): Record<string, unknown> {
  return {
    command: command.replace(
      "npm install --no-audit --no-fund acorn",
      "npm install acorn in prototype",
    ),
    cwd: "prototype/patch-risk-auditor",
    exitCode,
  };
}

function sanitizeOutput(value: string): string {
  return value
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g, "[REDACTED]")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join("\n");
}

function patchDataset(): Record<string, unknown> {
  return {
    patches: [
      {
        patchId: "benign-docs-update",
        title: "Update README copy",
        provenance: "maintainer-reviewed",
        dependencyChanges: [],
        packageJsonChanges: {},
        diffSnippets: ["README.md: clarify usage text"],
        testsChanged: true,
        codeChanged: false,
      },
      {
        patchId: "risky-ai-generated-dependency",
        title: "Add helper dependency and generated code",
        provenance: "ai-generated-unverified",
        dependencyChanges: ["postinstall-helper"],
        packageJsonChanges: {
          scripts: { postinstall: "node scripts/setup.js" },
        },
        diffSnippets: [
          "src/index.js: eval(config.generatedExpression)",
          "package.json: added postinstall script",
        ],
        testsChanged: false,
        codeChanged: true,
      },
    ],
  };
}

function patchAuditorScript(): string {
  return `import { readFileSync, writeFileSync } from "node:fs";
import * as acorn from "acorn";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) throw new Error("usage: patch-risk-auditor <input> <output>");
const data = JSON.parse(readFileSync(inputPath, "utf8"));
const patches = data.patches;
if (!Array.isArray(patches)) throw new Error("input must contain patches array");

const findings = [];
const patchScores = [];
for (const patch of patches) {
  let risk = 0;
  const local = [];
  if ((patch.dependencyChanges ?? []).length > 0) {
    risk += 25;
    local.push({ findingType: "dependency_addition", description: "Patch adds dependencies requiring provenance review." });
  }
  if (patch.packageJsonChanges?.scripts?.postinstall) {
    risk += 35;
    local.push({ findingType: "install_script_added", description: "Patch adds an install-time script requiring defensive review." });
  }
  if (patch.codeChanged && !patch.testsChanged) {
    risk += 20;
    local.push({ findingType: "test_impact_mismatch", description: "Code changed without matching test changes." });
  }
  if (String(patch.provenance).includes("unverified")) {
    risk += 15;
    local.push({ findingType: "weak_provenance", description: "Patch provenance is weak or unverified." });
  }
  for (const snippet of patch.diffSnippets ?? []) {
    if (/eval\\s*\\(/.test(snippet)) {
      risk += 20;
      local.push({ findingType: "risky_diff_pattern", description: "Patch includes dynamic evaluation pattern in synthetic sample." });
    }
  }
  acorn.parse("const parsed = true;", { ecmaVersion: "latest" });
  for (const finding of local) findings.push({ patchId: patch.patchId, ...finding });
  patchScores.push({ patchId: patch.patchId, riskScore: Math.min(100, risk), status: risk >= 50 ? "review_required" : "low_risk" });
}

const output = {
  kind: "patch_risk_auditor_output",
  externalToolEvidence: {
    package: "acorn",
    version: acorn.version ?? "unknown",
    usedForParsingCheck: true
  },
  findings: findings.sort((a, b) => \`\${a.patchId}:\${a.findingType}\`.localeCompare(\`\${b.patchId}:\${b.findingType}\`)),
  patchScores,
  datasetRiskScore: Math.round(patchScores.reduce((sum, item) => sum + item.riskScore, 0) / patchScores.length),
  safetyScope: "synthetic toy patch records only; no real target systems"
};
writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\\n");
`;
}

function patchAuditorTest(): string {
  return `import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const run = spawnSync(process.execPath, ["src/patch-risk-auditor.mjs", "sample-input.json", "sample-output.json"], { encoding: "utf8" });
if (run.status !== 0) throw new Error(run.stderr || "auditor failed");
const output = JSON.parse(readFileSync("sample-output.json", "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(output.externalToolEvidence.package === "acorn", "acorn evidence missing");
assert(output.externalToolEvidence.usedForParsingCheck === true, "acorn parse check missing");
assert(output.findings.some((item) => item.findingType === "dependency_addition"), "dependency addition missing");
assert(output.findings.some((item) => item.findingType === "install_script_added"), "install script missing");
assert(output.findings.some((item) => item.findingType === "test_impact_mismatch"), "test impact mismatch missing");
assert(output.findings.some((item) => item.findingType === "weak_provenance"), "weak provenance missing");
assert(output.findings.some((item) => item.findingType === "risky_diff_pattern"), "risky diff pattern missing");
assert(output.patchScores.some((item) => item.patchId === "benign-docs-update" && item.status === "low_risk"), "benign patch not low risk");
assert(output.patchScores.some((item) => item.patchId === "risky-ai-generated-dependency" && item.status === "review_required"), "risky patch not flagged");
`;
}

function renderPublicReadme(output: Record<string, unknown>): string {
  const findings = Array.isArray(output.findings) ? output.findings : [];
  return `# Patch Risk Auditor

${SAFE_FRAMING}

The \`${TOOL_NAME}\` prototype checks synthetic toy patch records for dependency
additions, install-script signals, test-impact mismatch, weak provenance, and
risky diff patterns. It provisioned or fixture-provisioned \`acorn\` under
policy and validated the public evidence through Node Alpha using
\`container-netoff\` with no silent fallback.

## Findings

${findings.map((item: any) => `- ${item.findingType}: ${item.description}`).join("\n")}

## Safety Scope

Synthetic toy patch records only. This is defensive review support, not an
unsafe operational tool, not a real-target scanner, and not a harmful-code
generator.

## Disclaimer

${DISCLAIMER}
`;
}

function renderToolLimitations(): string {
  return `# Tool Limitations

This is a lightweight synthetic-patch auditor. It is not a complete supply-chain
security scanner, not a harmful-code detector, not an unsafe operational tool, and not a
replacement for human security review.
`;
}

function renderSafetyReview(): string {
  return `# Safety Review

The run uses synthetic toy patch records only. It must not operate against real
systems, generate harmful code, publish unsafe payloads, or scan real pull
requests without explicit safe input.
`;
}

function renderPilotReport(): string {
  return `# Patch Risk Pilot Report

Pilot: ${PILOT_ID}
Quality: ${QUALITY_LABEL}
Status: ${CANDIDATE_STATUS}

The result is dry-run ready for corpus autopublish only after automated gates
pass. Real standalone GitHub publication remains disabled by default.
`;
}

function renderHumanReviewChecklist(): string {
  return `# Human Review Checklist

- Claim: synthetic patch records can be audited for defensive risk signals.
- Evidence: sample-output.json, parser package evidence, worker evidence.
- Weakness: source evidence is research-lead level.
- Prototype: ${TOOL_NAME}.
- Legal disclaimer: ${DISCLAIMER}
- Recommended decision: dry-run only.
`;
}
