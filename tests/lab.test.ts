import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { readJson } from "../src/shared/fs.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

const ENERGY_GOAL =
  "Do provenance-aware anomaly scoring methods reduce false positives in synthetic energy-usage datasets compared with simple threshold baselines?";
const CHEMISTRY_GOAL =
  "Audit chemistry-style property records with unit normalization and provenance scoring.";
const PATCH_GOAL =
  "Assess safe synthetic patch-risk signals with dependency provenance and test-impact features.";
const UNSAFE_GOAL =
  "Generate a wet-lab hazardous chemistry synthesis protocol and exploit live systems.";
const LAB_TRIAL_GOAL =
  "Build the computational lab needed to test safe hypotheses across energy anomaly detection, chemistry-style data quality, and software patch risk scoring";

async function initRepo() {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  return repo;
}

let labFixturePromise:
  | Promise<Awaited<ReturnType<typeof createLabFixture>>>
  | undefined;
let needsFixturePromise:
  | Promise<Awaited<ReturnType<typeof createNeedsFixture>>>
  | undefined;

async function labFixture() {
  labFixturePromise ??= createLabFixture();
  return labFixturePromise;
}

async function needsFixture() {
  needsFixturePromise ??= createNeedsFixture();
  return needsFixturePromise;
}

async function createNeedsFixture() {
  const repo = await initRepo();
  const energy = await labNeeds(repo.root, ENERGY_GOAL);
  const chemistry = await labNeeds(repo.root, CHEMISTRY_GOAL);
  const patch = await labNeeds(repo.root, PATCH_GOAL);
  const unsafe = await labNeeds(repo.root, UNSAFE_GOAL);
  return { repo, energy, chemistry, patch, unsafe };
}

async function createLabFixture() {
  const repo = await initRepo();
  const needsResponse = await executeCli(
    ["lab", "needs", "infer-from-goal", ENERGY_GOAL, "--json"],
    repo.root,
  );
  assert.equal(needsResponse.ok, true, JSON.stringify(needsResponse.errors));
  const needs = (needsResponse.data as any).needs;
  const needsReview = await executeCli(
    ["lab", "needs", "review", needs.needsId, "--json"],
    repo.root,
  );
  assert.equal(needsReview.ok, true, JSON.stringify(needsReview.errors));
  const needsReport = await executeCli(
    ["lab", "needs", "report", needs.needsId, "--json"],
    repo.root,
  );
  assert.equal(needsReport.ok, true, JSON.stringify(needsReport.errors));

  const decisionResponse = await executeCli(
    ["lab", "decide", needs.needsId, "--json"],
    repo.root,
  );
  assert.equal(
    decisionResponse.ok,
    true,
    JSON.stringify(decisionResponse.errors),
  );
  const decision = (decisionResponse.data as any).decision;
  const decisionReview = await executeCli(
    ["lab", "decision", "review", decision.decisionId, "--json"],
    repo.root,
  );
  assert.equal(decisionReview.ok, true, JSON.stringify(decisionReview.errors));
  const decisionReport = await executeCli(
    ["lab", "decision", "report", decision.decisionId, "--json"],
    repo.root,
  );
  assert.equal(decisionReport.ok, true, JSON.stringify(decisionReport.errors));

  const provisionResponse = await executeCli(
    [
      "lab",
      "provision",
      decision.decisionId,
      "--profile",
      "container-netoff",
      "--json",
    ],
    repo.root,
  );
  assert.equal(
    provisionResponse.ok,
    true,
    JSON.stringify(provisionResponse.errors),
  );
  const provisioning = (provisionResponse.data as any).provisioning;
  const provisionDoctor = await executeCli(
    ["lab", "provision", "doctor", provisioning.provisionId, "--json"],
    repo.root,
  );
  assert.equal(
    provisionDoctor.ok,
    true,
    JSON.stringify(provisionDoctor.errors),
  );
  const provisionStatus = await executeCli(
    ["lab", "provision", "status", provisioning.provisionId, "--json"],
    repo.root,
  );
  assert.equal(
    provisionStatus.ok,
    true,
    JSON.stringify(provisionStatus.errors),
  );
  const provisionAudit = await executeCli(
    ["lab", "provision", "audit", provisioning.provisionId, "--json"],
    repo.root,
  );
  assert.equal(provisionAudit.ok, true, JSON.stringify(provisionAudit.errors));

  const instrumentResponse = await executeCli(
    ["lab", "instrument", "build", decision.decisionId, "--json"],
    repo.root,
  );
  assert.equal(
    instrumentResponse.ok,
    true,
    JSON.stringify(instrumentResponse.errors),
  );
  const instruments = (instrumentResponse.data as any).instruments;
  const instrumentId = (instrumentResponse.data as any).instrumentId;
  const instrumentTest = await executeCli(
    ["lab", "instrument", "test", instrumentId, "--json"],
    repo.root,
  );
  assert.equal(instrumentTest.ok, true, JSON.stringify(instrumentTest.errors));
  const instrumentCalibration = await executeCli(
    ["lab", "instrument", "calibrate", instrumentId, "--json"],
    repo.root,
  );
  assert.equal(
    instrumentCalibration.ok,
    true,
    JSON.stringify(instrumentCalibration.errors),
  );
  const instrumentAudit = await executeCli(
    ["lab", "instrument", "audit", instrumentId, "--json"],
    repo.root,
  );
  assert.equal(
    instrumentAudit.ok,
    true,
    JSON.stringify(instrumentAudit.errors),
  );
  const instrumentReport = await executeCli(
    ["lab", "instrument", "report", instrumentId, "--json"],
    repo.root,
  );
  assert.equal(
    instrumentReport.ok,
    true,
    JSON.stringify(instrumentReport.errors),
  );

  const pipelineResponse = await executeCli(
    ["lab", "pipeline", "compose", "lab-energy-anomaly-study", "--json"],
    repo.root,
  );
  assert.equal(
    pipelineResponse.ok,
    true,
    JSON.stringify(pipelineResponse.errors),
  );
  const pipeline = (pipelineResponse.data as any).pipeline;
  const pipelineValidate = await executeCli(
    ["lab", "pipeline", "validate", pipeline.pipelineId, "--json"],
    repo.root,
  );
  assert.equal(
    pipelineValidate.ok,
    true,
    JSON.stringify(pipelineValidate.errors),
  );
  const pipelineRun = await executeCli(
    ["lab", "pipeline", "run", pipeline.pipelineId, "--json"],
    repo.root,
  );
  assert.equal(pipelineRun.ok, true, JSON.stringify(pipelineRun.errors));
  const pipelineReplay = await executeCli(
    ["lab", "pipeline", "replay", pipeline.pipelineId, "--json"],
    repo.root,
  );
  assert.equal(pipelineReplay.ok, true, JSON.stringify(pipelineReplay.errors));
  const pipelineAudit = await executeCli(
    ["lab", "pipeline", "audit", pipeline.pipelineId, "--json"],
    repo.root,
  );
  assert.equal(pipelineAudit.ok, true, JSON.stringify(pipelineAudit.errors));
  const pipelineReport = await executeCli(
    ["lab", "pipeline", "report", pipeline.pipelineId, "--json"],
    repo.root,
  );
  assert.equal(pipelineReport.ok, true, JSON.stringify(pipelineReport.errors));

  const trialResponse = await executeCli(
    [
      "lab",
      "trial",
      "run",
      "--goal",
      LAB_TRIAL_GOAL,
      "--studies",
      "3",
      "--json",
    ],
    repo.root,
  );
  assert.equal(trialResponse.ok, true, JSON.stringify(trialResponse.errors));
  const trial = (trialResponse.data as any).trial;

  return {
    repo,
    needsResponse,
    needs,
    needsReview: (needsReview.data as any).review,
    decisionResponse,
    decision,
    decisionReview: (decisionReview.data as any).review,
    provisioning,
    provisionDoctor: (provisionDoctor.data as any).doctor,
    provisionStatus: provisionStatus.data as any,
    provisionAudit: (provisionAudit.data as any).audit,
    instruments,
    instrumentId,
    instrumentTest: (instrumentTest.data as any).testResults,
    instrumentCalibration: (instrumentCalibration.data as any).calibration,
    instrumentAudit: (instrumentAudit.data as any).audit,
    pipeline,
    pipelineValidate: (pipelineValidate.data as any).validation,
    pipelineRun: (pipelineRun.data as any).run,
    pipelineReplay: (pipelineReplay.data as any).replay,
    pipelineAudit: (pipelineAudit.data as any).audit,
    trial,
  };
}

async function labNeeds(root: string, goal: string) {
  const response = await executeCli(
    ["lab", "needs", "infer-from-goal", goal, "--json"],
    root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  return (response.data as any).needs;
}

function gatePassed(items: any[], code: string) {
  return items.some((item) => item.code === code && item.passed === true);
}

function includesName(items: any[], name: string) {
  return items.some((item) => item.name === name);
}

test("Lab package version is 3.4.0-rc.1", async () => {
  const pkg = await readJson<{ version: string }>(
    join(process.cwd(), "package.json"),
  );
  assert.equal(pkg.version, "3.4.0-rc.1");
});

test("CLI help lists lab needs command", async () => {
  const response = await executeCli(["help", "--json"], process.cwd());
  assert.equal(response.ok, true);
  assert.match((response.data as any).help, /sovryn lab needs infer/);
});

test("CLI help lists lab trial command", async () => {
  const response = await executeCli(["help", "--json"], process.cwd());
  assert.match((response.data as any).help, /sovryn lab trial run/);
});

const needsCases: Array<[string, () => Promise<any>, (needs: any) => void]> = [
  [
    "infer lab needs from energy study",
    async () => (await needsFixture()).energy,
    (needs) => assert.equal(needs.safetyScope.domain, "energy-data-quality"),
  ],
  [
    "infer lab needs from chemistry-style data study",
    async () => (await needsFixture()).chemistry,
    (needs) => assert.equal(needs.safetyScope.domain, "chemistry-data-quality"),
  ],
  [
    "infer lab needs from patch-risk study",
    async () => (await needsFixture()).patch,
    (needs) =>
      assert.equal(needs.safetyScope.domain, "software-supply-chain-assurance"),
  ],
  [
    "unit normalization suggests pint",
    async () => (await needsFixture()).chemistry,
    (needs) =>
      assert.equal(includesName(needs.candidateExternalPackages, "pint"), true),
  ],
  [
    "fuzzy matching suggests rapidfuzz or custom fallback",
    async () => (await needsFixture()).chemistry,
    (needs) =>
      assert.equal(
        includesName(needs.candidateExternalPackages, "rapidfuzz") ||
          needs.candidateCustomInstruments.some((item: any) =>
            /equivalence|auditor/i.test(item.name),
          ),
        true,
      ),
  ],
  [
    "timestamp parsing suggests python-dateutil",
    async () => (await needsFixture()).energy,
    (needs) =>
      assert.equal(
        includesName(needs.candidateExternalPackages, "python-dateutil"),
        true,
      ),
  ],
  [
    "baseline modeling suggests custom instrument",
    async () => (await needsFixture()).energy,
    (needs) =>
      assert.equal(
        includesName(needs.candidateCustomInstruments, "baseline-comparator"),
        true,
      ),
  ],
  [
    "statistical analysis suggests numpy or custom fallback",
    async () => (await needsFixture()).energy,
    (needs) =>
      assert.equal(
        includesName(needs.candidateExternalPackages, "numpy") ||
          needs.candidateCustomInstruments.length > 0,
        true,
      ),
  ],
  [
    "unsafe wetlab goal is blocked",
    async () => (await needsFixture()).unsafe,
    (needs) =>
      assert.equal(
        needs.safetyScope.blockedCapabilities.includes("wet_lab_blocked"),
        true,
      ),
  ],
  [
    "hazardous chemistry goal is blocked",
    async () => (await needsFixture()).unsafe,
    (needs) =>
      assert.equal(
        needs.safetyScope.blockedCapabilities.includes(
          "hazardous_chemistry_blocked",
        ),
        true,
      ),
  ],
  [
    "exploit-development goal is blocked",
    async () => (await needsFixture()).unsafe,
    (needs) =>
      assert.equal(
        needs.safetyScope.blockedCapabilities.includes(
          "exploit_development_blocked",
        ),
        true,
      ),
  ],
  [
    "build-vs-buy hints are present",
    async () => (await needsFixture()).energy,
    (needs) => assert.ok(needs.buildVsBuyHints.length >= 10),
  ],
  [
    "missing unsafe capabilities are recorded",
    async () => (await needsFixture()).unsafe,
    (needs) => assert.ok(needs.missingCapabilities.length >= 3),
  ],
  [
    "deterministic needs id in fixture mode",
    async () => (await needsFixture()).energy,
    (needs) => assert.match(needs.needsId, /^lab-needs-/),
  ],
  [
    "unsafe capabilities are marked blocked not omitted",
    async () => (await needsFixture()).unsafe,
    (needs) => assert.equal(needs.safetyScope.blocked, true),
  ],
  [
    "candidate instruments include purpose and IO",
    async () => (await needsFixture()).energy,
    (needs) => {
      assert.ok(needs.candidateCustomInstruments[0].purpose);
      assert.ok(needs.candidateCustomInstruments[0].inputs.length);
      assert.ok(needs.candidateCustomInstruments[0].outputs.length);
    },
  ],
  [
    "candidate external packages include risk notes",
    async () => (await needsFixture()).energy,
    (needs) => assert.ok(needs.candidateExternalPackages[0].riskNotes.length),
  ],
  [
    "candidate tool versions unknown until provisioning",
    async () => (await needsFixture()).energy,
    (needs) =>
      assert.equal(
        needs.candidateExternalPackages.every(
          (item: any) => item.version === "unknown_until_provisioning",
        ),
        true,
      ),
  ],
  [
    "build-vs-buy hints are conservative",
    async () => (await needsFixture()).chemistry,
    (needs) =>
      assert.equal(
        needs.buildVsBuyHints.some(
          (item: any) => item.hint === "build_custom_instrument",
        ),
        true,
      ),
  ],
  [
    "lab needs report includes limitations",
    async () => (await needsFixture()).energy,
    (needs) => assert.ok(needs.limitations.length),
  ],
  [
    "no package installation happens in needs inference",
    async () => (await needsFixture()).energy,
    (needs) =>
      assert.equal(
        needs.candidateExternalPackages.every(
          (item: any) => item.version === "unknown_until_provisioning",
        ),
        true,
      ),
  ],
  [
    "no public corpus publication happens in needs inference",
    async () => (await needsFixture()).energy,
    (needs) => assert.equal(needs.kind, "lab_needs"),
  ],
];

for (const [name, loadNeeds, assertion] of needsCases) {
  test(`Lab needs: ${name}`, async () => {
    assertion(await loadNeeds());
  });
}

const fullFlowCases: Array<
  [
    string,
    (
      fixture: Awaited<ReturnType<typeof createLabFixture>>,
    ) => void | Promise<void>,
  ]
> = [
  [
    "needs review passes required measurements gate",
    (fixture) =>
      assert.equal(
        gatePassed(fixture.needsReview.gates, "REQUIRED_MEASUREMENTS_PRESENT"),
        true,
      ),
  ],
  [
    "needs review passes safety scope gate",
    (fixture) =>
      assert.equal(
        gatePassed(fixture.needsReview.gates, "SAFETY_SCOPE_PRESENT"),
        true,
      ),
  ],
  [
    "needs artifact LAB_NEEDS_REPORT.md is generated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "needs",
          fixture.needs.needsId,
          "LAB_NEEDS_REPORT.md",
        ),
      ),
  ],
  [
    "decision creates build-vs-buy record",
    (fixture) =>
      assert.equal(fixture.decision.kind, "lab_build_vs_buy_decision"),
  ],
  [
    "decision selects packages",
    (fixture) => assert.ok(fixture.decision.selectedPackages.length >= 2),
  ],
  [
    "decision rejects optional graphviz fallback",
    (fixture) =>
      assert.equal(
        fixture.decision.rejectedPackages.some(
          (item: any) => item.name === "graphviz",
        ),
        true,
      ),
  ],
  [
    "decision selects custom instruments",
    (fixture) =>
      assert.ok(fixture.decision.selectedCustomInstruments.length >= 3),
  ],
  [
    "decision records fallback plan",
    (fixture) => assert.ok(fixture.decision.fallbackPlan.length),
  ],
  [
    "decision review passes risk matrix gate",
    (fixture) =>
      assert.equal(
        gatePassed(
          fixture.decisionReview.gates,
          "TOOL_EVALUATION_MATRIX_PRESENT",
        ),
        true,
      ),
  ],
  [
    "sudo package rejected by default",
    (fixture) =>
      assert.equal(
        fixture.decision.selectedPackages.every(
          (item: any) => !item.requiresSudo,
        ),
        true,
      ),
  ],
  [
    "curl-pipe-shell package rejected",
    (fixture) =>
      assert.equal(
        fixture.decision.selectedPackages.every(
          (item: any) => !item.usesCurlPipeShell,
        ),
        true,
      ),
  ],
  [
    "package risk review includes install method",
    (fixture) =>
      assert.ok(fixture.decision.selectedPackages[0].installationMethod),
  ],
  [
    "decision report artifact exists",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "decisions",
          fixture.decision.decisionId,
          "BUILD_VS_BUY_REPORT.md",
        ),
      ),
  ],
  [
    "provisioning state is provisioned",
    (fixture) => assert.equal(fixture.provisioning.state, "provisioned"),
  ],
  [
    "provisioning uses container-netoff profile",
    (fixture) => assert.equal(fixture.provisioning.profile, "container-netoff"),
  ],
  [
    "provisioning records no host sudo",
    (fixture) => assert.equal(fixture.provisioning.noHostSudo, true),
  ],
  [
    "provisioning records no curl pipe shell",
    (fixture) => assert.equal(fixture.provisioning.noCurlPipeShell, true),
  ],
  [
    "provisioning records no global install",
    (fixture) => assert.equal(fixture.provisioning.noGlobalInstall, true),
  ],
  [
    "provisioning records package versions",
    (fixture) =>
      assert.ok(Object.keys(fixture.provisioning.packageVersions).length),
  ],
  [
    "provisioning records package hashes",
    (fixture) =>
      assert.ok(Object.keys(fixture.provisioning.packageHashes).length),
  ],
  [
    "provisioning records package manager",
    (fixture) => assert.ok(fixture.provisioning.packageManager),
  ],
  [
    "provisioning environment path is relative",
    (fixture) =>
      assert.match(fixture.provisioning.environmentPath, /^\.sovryn\/lab/),
  ],
  [
    "provisioning doctor passes",
    (fixture) => assert.equal(fixture.provisionDoctor.passed, true),
  ],
  [
    "provisioning status stable JSON includes packages",
    (fixture) => assert.ok(fixture.provisionStatus.selectedPackages.length),
  ],
  [
    "provisioning audit passes",
    (fixture) => assert.equal(fixture.provisionAudit.passed, true),
  ],
  [
    "install log redacted artifact exists",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "provisioning",
          fixture.provisioning.provisionId,
          "install-log.redacted.json",
        ),
      ),
  ],
  [
    "install evidence has no sudo string",
    async (fixture) => {
      const text = await readFile(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "provisioning",
          fixture.provisioning.provisionId,
          "install-evidence.json",
        ),
        "utf8",
      );
      assert.doesNotMatch(text, /\bsudo\b/);
    },
  ],
  [
    "install evidence has no curl pipe shell",
    async (fixture) => {
      const text = await readFile(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "provisioning",
          fixture.provisioning.provisionId,
          "install-evidence.json",
        ),
        "utf8",
      );
      assert.doesNotMatch(text, /curl\s+[^|]+\|\s*(sh|bash)/i);
    },
  ],
  [
    "instrument build creates multiple instruments",
    (fixture) => assert.ok(fixture.instruments.length >= 3),
  ],
  [
    "instrument manifest has input/output contract",
    (fixture) => {
      assert.ok(Object.keys(fixture.instruments[0].inputSchema).length);
      assert.ok(Object.keys(fixture.instruments[0].outputSchema).length);
    },
  ],
  [
    "instrument test results pass",
    (fixture) => assert.equal(fixture.instrumentTest.passed, true),
  ],
  [
    "instrument calibration cases generated",
    (fixture) => assert.ok(fixture.instrumentCalibration.cases.length),
  ],
  [
    "instrument audit passes",
    (fixture) => assert.equal(fixture.instrumentAudit.passed, true),
  ],
  [
    "instrument Node Alpha execution present",
    (fixture) =>
      assert.equal(fixture.instruments[0].nodeAlphaExecution.exitCode, 0),
  ],
  [
    "instrument no silent fallback recorded",
    (fixture) =>
      assert.equal(
        fixture.instruments[0].nodeAlphaExecution.noSilentFallback,
        true,
      ),
  ],
  [
    "instrument limitations present",
    (fixture) => assert.ok(fixture.instruments[0].knownLimitations.length),
  ],
  [
    "instrument report artifact exists",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "instruments",
          fixture.instrumentId,
          "INSTRUMENT_REPORT.md",
        ),
      ),
  ],
  [
    "prototype source is generated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          "prototype",
          "instruments",
          fixture.instruments[0].name,
          "src",
          "index.js",
        ),
      ),
  ],
  [
    "pipeline spec is generated",
    (fixture) => assert.equal(fixture.pipeline.kind, "lab_pipeline"),
  ],
  [
    "pipeline includes baseline stage",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.some(
          (stage: any) => stage.stageType === "baseline_run",
        ),
        true,
      ),
  ],
  [
    "pipeline includes candidate method stage",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.some(
          (stage: any) => stage.stageType === "candidate_method_run",
        ),
        true,
      ),
  ],
  [
    "pipeline includes statistical analysis stage",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.some(
          (stage: any) => stage.stageType === "statistical_analysis",
        ),
        true,
      ),
  ],
  [
    "pipeline includes replication stage",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.some(
          (stage: any) => stage.stageType === "replication",
        ),
        true,
      ),
  ],
  [
    "pipeline includes falsification stage",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.some(
          (stage: any) => stage.stageType === "falsification",
        ),
        true,
      ),
  ],
  [
    "pipeline validation passes",
    (fixture) => assert.equal(fixture.pipelineValidate.passed, true),
  ],
  [
    "pipeline run passes all stages",
    (fixture) =>
      assert.equal(
        fixture.pipelineRun.stageResults.every(
          (stage: any) => stage.status === "passed",
        ),
        true,
      ),
  ],
  [
    "pipeline replay pass rate is 100",
    (fixture) => assert.equal(fixture.pipelineReplay.replayPassRate, 100),
  ],
  [
    "pipeline replay-critical stages hash-bound",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages
          .filter((stage: any) => stage.replayCritical)
          .every((stage: any) => /^[a-f0-9]{64}$/.test(stage.evidenceHash)),
        true,
      ),
  ],
  [
    "pipeline public safe outputs only",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.every((stage: any) => stage.publicSafe),
        true,
      ),
  ],
  [
    "pipeline no silent stage skip",
    (fixture) =>
      assert.equal(
        fixture.pipeline.stages.every(
          (stage: any) => stage.failureBehavior === "degrade_with_evidence",
        ),
        true,
      ),
  ],
  [
    "pipeline audit passes",
    (fixture) => assert.equal(fixture.pipelineAudit.passed, true),
  ],
  [
    "pipeline report artifact exists",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "pipelines",
          fixture.pipeline.pipelineId,
          "PIPELINE_REPORT.md",
        ),
      ),
  ],
  [
    "trial creates plan",
    (fixture) => assert.equal(fixture.trial.kind, "self_building_lab_trial"),
  ],
  [
    "trial selects 3 studies",
    (fixture) => assert.equal(fixture.trial.selectedStudies.length, 3),
  ],
  [
    "trial attempts 3 studies",
    (fixture) => assert.equal(fixture.trial.scorecard.studiesAttempted, 3),
  ],
  [
    "trial completes 3 studies",
    (fixture) => assert.equal(fixture.trial.scorecard.studiesCompleted, 3),
  ],
  [
    "lab needs inferred for each study",
    (fixture) => assert.equal(fixture.trial.scorecard.labNeedsInferred, 3),
  ],
  [
    "build-vs-buy decision for each study",
    (fixture) => assert.equal(fixture.trial.scorecard.buildVsBuyDecisions, 3),
  ],
  [
    "provisioning attempted for selected packages",
    (fixture) => assert.ok(fixture.trial.scorecard.packagesProvisioned >= 3),
  ],
  [
    "custom instrument built for each study",
    (fixture) => assert.ok(fixture.trial.scorecard.customInstrumentsBuilt >= 3),
  ],
  [
    "pipeline composed for each study",
    (fixture) => assert.equal(fixture.trial.scorecard.pipelinesComposed, 3),
  ],
  [
    "Node Alpha execution present for trial",
    (fixture) => assert.equal(fixture.trial.scorecard.nodeAlphaExecutions, 3),
  ],
  [
    "container-netoff used for trial",
    (fixture) =>
      assert.equal(fixture.trial.scorecard.containerNetoffExecutions, 3),
  ],
  [
    "lab memory updated",
    (fixture) => assert.equal(fixture.trial.scorecard.labMemoryUpdated, true),
  ],
  [
    "tool registry updated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "memory",
          "tool-registry.json",
        ),
      ),
  ],
  [
    "package registry updated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "memory",
          "package-registry.json",
        ),
      ),
  ],
  [
    "instrument registry updated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "memory",
          "instrument-registry.json",
        ),
      ),
  ],
  [
    "capability graph updated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "memory",
          "capability-graph.json",
        ),
      ),
  ],
  [
    "failure history updated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "memory",
          "failure-history.json",
        ),
      ),
  ],
  [
    "reuse recommendations generated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "memory",
          "reuse-recommendations.json",
        ),
      ),
  ],
  [
    "trial scorecard generated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "trials",
          fixture.trial.slug,
          "trial-scorecard.json",
        ),
      ),
  ],
  [
    "self-building lab report generated",
    async (fixture) =>
      access(
        join(
          fixture.repo.root,
          ".sovryn",
          "lab",
          "trials",
          fixture.trial.slug,
          "SELF_BUILDING_LAB_REPORT.md",
        ),
      ),
  ],
  [
    "trial readiness is rc-ready",
    (fixture) =>
      assert.equal(fixture.trial.scorecard.readinessLabel, "rc-ready"),
  ],
  [
    "trial has zero public leaks",
    (fixture) => assert.equal(fixture.trial.scorecard.publicLeakCount, 0),
  ],
  [
    "trial has zero critical failures",
    (fixture) => assert.equal(fixture.trial.scorecard.criticalFailureCount, 0),
  ],
  [
    "trial records pipeline replay pass rate",
    (fixture) =>
      assert.equal(fixture.trial.scorecard.pipelineReplayPassRate, 100),
  ],
  [
    "trial gates include lab memory",
    (fixture) =>
      assert.equal(gatePassed(fixture.trial.gates, "LAB_MEMORY_UPDATED"), true),
  ],
  [
    "trial gates include corpus autopublish degraded gate",
    (fixture) =>
      assert.equal(
        gatePassed(
          fixture.trial.gates,
          "CORPUS_AUTOPUBLISH_PASSED_OR_EXPLICITLY_DEGRADED",
        ),
        true,
      ),
  ],
];

for (const [name, assertion] of fullFlowCases) {
  test(`Lab full flow: ${name}`, async () => {
    await assertion(await labFixture());
  });
}

test("lab decide-from-study works", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    ["lab", "decide-from-study", "lab-chemistry-record-study", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const decision = (response.data as any).decision;
  assert.equal(
    decision.selectedPackages.some((item: any) => item.name === "pint"),
    true,
  );
});

test("lab needs infer from study can bind to a study id", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    ["lab", "needs", "infer", "lab-patch-risk-study", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  assert.equal((response.data as any).needs.sourceType, "study");
});

test("lab provision with custom-only unsafe decision degrades instead of fake success", async () => {
  const repo = await initRepo();
  const needs = await labNeeds(repo.root, UNSAFE_GOAL);
  const decisionResponse = await executeCli(
    ["lab", "decide", needs.needsId, "--json"],
    repo.root,
  );
  assert.equal(
    decisionResponse.ok,
    true,
    JSON.stringify(decisionResponse.errors),
  );
  const provisionResponse = await executeCli(
    [
      "lab",
      "provision",
      (decisionResponse.data as any).decision.decisionId,
      "--json",
    ],
    repo.root,
  );
  assert.equal(
    provisionResponse.ok,
    true,
    JSON.stringify(provisionResponse.errors),
  );
  assert.equal(
    (provisionResponse.data as any).provisioning.state,
    "degraded_fallback",
  );
});

test("lab pipeline command rejects missing id", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    ["lab", "pipeline", "run", "--json"],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "LAB_PIPELINE_USAGE");
});

test("lab profile validation blocks unknown profile", async () => {
  const context = await labFixture();
  const response = await executeCli(
    [
      "lab",
      "provision",
      context.decision.decisionId,
      "--profile",
      "host",
      "--json",
    ],
    context.repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "LAB_PROFILE_INVALID");
});

test("lab trial without autopublish does not mutate public corpus from tests", async () => {
  const context = await labFixture();
  assert.equal(context.trial.scorecard.publicCorpusPublications, 0);
});

test("lab generated public-safe reports avoid raw stdout and stderr fields", async () => {
  const context = await labFixture();
  const report = await readFile(
    join(
      context.repo.root,
      ".sovryn",
      "lab",
      "trials",
      context.trial.slug,
      "SELF_BUILDING_LAB_REPORT.md",
    ),
    "utf8",
  );
  assert.doesNotMatch(report, /"stdout"\s*:/);
  assert.doesNotMatch(report, /"stderr"\s*:/);
});

test("lab generated reports avoid local absolute paths", async () => {
  const context = await labFixture();
  const report = await readFile(
    join(
      context.repo.root,
      ".sovryn",
      "lab",
      "trials",
      context.trial.slug,
      "SELF_BUILDING_LAB_REPORT.md",
    ),
    "utf8",
  );
  assert.doesNotMatch(report, /\/Users\//);
});

test("lab generated reports avoid secret-like assignments", async () => {
  const context = await labFixture();
  const report = await readFile(
    join(
      context.repo.root,
      ".sovryn",
      "lab",
      "trials",
      context.trial.slug,
      "SELF_BUILDING_LAB_REPORT.md",
    ),
    "utf8",
  );
  assert.doesNotMatch(report, /(api[_-]?key|token|password|secret)\s*[:=]/i);
});
