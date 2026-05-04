import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import {
  buildE2EScorecard,
  parseCandidateIds,
  parseFactoryIds,
  parseMissionIds,
  scanE2EPublicArtifacts,
  type E2EPhaseResult,
} from "../src/core/e2e/e2e-service.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

type E2EFixture = {
  root: string;
  run: any;
  report: any;
  commandResults: any;
  scorecard: any;
};

let fixturePromise: Promise<E2EFixture> | null = null;

test("CLI help lists e2e commands", async () => {
  const help = await executeCli(["--help", "--json"]);
  const text = (help.data as any).help;
  assert.match(text, /e2e doctor/);
  assert.match(text, /e2e run --profile beta-fixture/);
  assert.match(text, /e2e report/);
});

test("E2E doctor checks dist CLI and command groups", async () => {
  const repo = await makeTempRepo();
  const response = await executeCli(["e2e", "doctor", "--json"], repo.root);
  assert.equal(response.ok, true, JSON.stringify(response.errors, null, 2));
  const doctor = (response.data as any).doctor;
  assert.equal(doctor.targetVersion, "3.0.0-beta.7");
  assert.equal(doctor.ready, true);
});

test("E2E runner creates fresh repo", async () => {
  const { run } = await e2eFixture();
  assert.equal(run.run.profile, "beta-fixture");
  assert.equal(run.run.freshRepo, "<fresh-repo>");
  assert.equal(phase(run.run, "fresh_repo_init").passed, true);
});

test("E2E runner records command results", async () => {
  const { commandResults } = await e2eFixture();
  assert.equal(commandResults.commands.length > 10, true);
  assert.equal(commandResults.commands[0].command.includes("node"), true);
});

test("E2E report includes all required sections", async () => {
  const { root } = await e2eFixture();
  const report = await readFile(
    join(root, ".sovryn", "e2e", "E2E_REPORT.md"),
    "utf8",
  );
  for (const heading of [
    "## Commands Run",
    "## Phase Results",
    "## Artifacts Produced",
    "## IDs Discovered",
    "## Critical Failures",
    "## Known Limitations",
    "## Public Artifact Scan",
    "## Worker Isolation",
    "## Final Recommendation",
  ]) {
    assert.match(report, new RegExp(escapeRegExp(heading)));
  }
});

test("E2E scorecard fails on critical leak", () => {
  const scorecard = buildE2EScorecard({
    phases: happyPhases(),
    publicLeakCount: 1,
    releaseCandidateCount: 1,
    factoryRunCount: 1,
    workerExecutionCount: 1,
    replayPassRate: 100,
    qualityLabelDistribution: { good: 1 },
    unexpectedRealPublish: false,
    silentHostFallback: false,
  });
  assert.equal(scorecard.readinessLabel, "failed");
  assert.match(scorecard.blockingReasons.join("\n"), /Public leak/);
});

test("E2E scorecard fails on unexpected real publish", () => {
  const scorecard = buildE2EScorecard({
    phases: happyPhases(),
    publicLeakCount: 0,
    releaseCandidateCount: 1,
    factoryRunCount: 1,
    workerExecutionCount: 1,
    replayPassRate: 100,
    qualityLabelDistribution: { good: 1 },
    unexpectedRealPublish: true,
    silentHostFallback: false,
  });
  assert.equal(scorecard.readinessLabel, "failed");
  assert.match(scorecard.blockingReasons.join("\n"), /Real publication/);
});

test("E2E scorecard fails on silent host fallback", () => {
  const scorecard = buildE2EScorecard({
    phases: happyPhases(),
    publicLeakCount: 0,
    releaseCandidateCount: 1,
    factoryRunCount: 1,
    workerExecutionCount: 1,
    replayPassRate: 100,
    qualityLabelDistribution: { good: 1 },
    unexpectedRealPublish: false,
    silentHostFallback: true,
  });
  assert.equal(scorecard.readinessLabel, "failed");
  assert.match(scorecard.blockingReasons.join("\n"), /silently fell back/);
});

test("E2E scorecard marks unavailable container as degraded", () => {
  const phases = happyPhases().map((item) =>
    item.phase === "worker_flow"
      ? {
          ...item,
          passed: false,
          degraded: true,
          degradedReasons: ["container-netoff unavailable"],
        }
      : item,
  );
  const scorecard = buildE2EScorecard({
    phases,
    publicLeakCount: 0,
    releaseCandidateCount: 1,
    factoryRunCount: 1,
    workerExecutionCount: 0,
    replayPassRate: 100,
    qualityLabelDistribution: { good: 1 },
    unexpectedRealPublish: false,
    silentHostFallback: false,
  });
  assert.equal(scorecard.readinessLabel, "degraded");
  assert.match(scorecard.degradedReasons.join("\n"), /container-netoff/);
});

test("E2E scorecard passes deterministic fixture happy path", () => {
  const scorecard = buildE2EScorecard({
    phases: happyPhases(),
    publicLeakCount: 0,
    releaseCandidateCount: 2,
    factoryRunCount: 2,
    workerExecutionCount: 1,
    replayPassRate: 100,
    qualityLabelDistribution: { good: 2 },
    unexpectedRealPublish: false,
    silentHostFallback: false,
  });
  assert.equal(scorecard.readinessLabel, "strong-pass");
});

test("E2E scorecard degrades on low replay rate", () => {
  const scorecard = buildE2EScorecard({
    phases: happyPhases(),
    publicLeakCount: 0,
    releaseCandidateCount: 1,
    factoryRunCount: 1,
    workerExecutionCount: 1,
    replayPassRate: 50,
    qualityLabelDistribution: { good: 1 },
    unexpectedRealPublish: false,
    silentHostFallback: false,
  });
  assert.equal(scorecard.readinessLabel, "degraded");
  assert.match(scorecard.degradedReasons.join("\n"), /replay/i);
});

test("E2E public artifact scan detects raw logs", async () => {
  const repo = await makeTempRepo();
  const root = join(repo.root, "public-corpus");
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "bad.json"), '{"stdout":"secret output"}', "utf8");
  const scan = await scanE2EPublicArtifacts(repo.root, [root]);
  assert.equal(
    scan.findings.some((item) => item.kind === "raw_log"),
    true,
  );
});

test("E2E public artifact scan detects local absolute paths", async () => {
  const repo = await makeTempRepo();
  const root = join(repo.root, "public-corpus");
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "path.md"), "/Users/sovryn/private", "utf8");
  const scan = await scanE2EPublicArtifacts(repo.root, [root]);
  assert.equal(
    scan.findings.some((item) => item.kind === "local_path"),
    true,
  );
});

test("E2E public artifact scan detects secret-like strings", async () => {
  const repo = await makeTempRepo();
  const root = join(repo.root, "public-corpus");
  await mkdir(root, { recursive: true });
  await writeFile(
    join(root, "secret.md"),
    "token = github_pat_abcdefghijklmnopqrstuvwxyz123456",
    "utf8",
  );
  const scan = await scanE2EPublicArtifacts(repo.root, [root]);
  assert.equal(
    scan.findings.some((item) => item.kind === "secret"),
    true,
  );
});

test("E2E runner parses factory IDs from JSON", () => {
  assert.deepEqual(parseFactoryIds({ run: { id: "fac_abc" } }), ["fac_abc"]);
});

test("E2E runner parses mission IDs from JSON", () => {
  assert.deepEqual(parseMissionIds({ missionId: "mis_abc" }), ["mis_abc"]);
});

test("E2E runner parses candidate IDs from JSON", () => {
  assert.equal(
    parseCandidateIds({ candidateId: "source-card-trust-scorer" }).includes(
      "source-card-trust-scorer",
    ),
    true,
  );
});

test("E2E runner handles missing optional IDs gracefully", () => {
  assert.deepEqual(parseFactoryIds({ data: null }), []);
  assert.deepEqual(parseMissionIds({}), []);
  assert.deepEqual(parseCandidateIds({}), []);
});

test("E2E runner blocks real publish by default", async () => {
  const { run } = await e2eFixture();
  assert.equal(run.run.noRealPublication, true);
  assert.equal(phase(run.run, "publication_flow").passed, true);
});

test("E2E launch phase records known limitations", async () => {
  const { run } = await e2eFixture();
  const launch = phase(run.run, "launch_pilot_flow");
  assert.equal(launch.passed, true);
  assert.equal(
    launch.checks.some((check: any) => check.code === "LAUNCH_CHECK_RECORDED"),
    true,
  );
});

test("E2E corpus phase excludes private internals", async () => {
  const { scorecard } = await e2eFixture();
  assert.equal(scorecard.publicLeakCount, 0);
});

test("E2E worker phase records no-silent-fallback evidence", async () => {
  const { run } = await e2eFixture();
  assert.equal(
    phase(run.run, "worker_flow").checks.some(
      (check: any) =>
        check.code === "NO_SILENT_FALLBACK_RECORDED" && check.passed,
    ),
    true,
  );
});

test("E2E example docs exist", async () => {
  for (const file of [
    "README.md",
    "DEMO_SCRIPT.md",
    "expected-artifacts.md",
    "expected-report-summary.md",
  ]) {
    await readFile(join("examples", "e2e-beta-demo", file), "utf8");
  }
});

async function e2eFixture(): Promise<E2EFixture> {
  fixturePromise ??= createE2EFixture();
  return fixturePromise;
}

async function createE2EFixture(): Promise<E2EFixture> {
  const repo = await makeTempRepo();
  const response = await executeCli(
    ["e2e", "run", "--profile", "beta-fixture", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors, null, 2));
  const report = await executeCli(["e2e", "report", "--json"], repo.root);
  assert.equal(report.ok, true, JSON.stringify(report.errors, null, 2));
  const commandResults = JSON.parse(
    await readFile(
      join(repo.root, ".sovryn", "e2e", "e2e-command-results.json"),
      "utf8",
    ),
  );
  const scorecard = JSON.parse(
    await readFile(
      join(repo.root, ".sovryn", "e2e", "e2e-scorecard.json"),
      "utf8",
    ),
  );
  return {
    root: repo.root,
    run: response.data,
    report: report.data,
    commandResults,
    scorecard,
  };
}

function happyPhases(): E2EPhaseResult[] {
  return [
    "build_sanity",
    "fresh_repo_init",
    "beta_flow",
    "autonomy_flow",
    "factory_flow",
    "worker_flow",
    "quality_benchmark_flow",
    "publication_flow",
    "audit_safety_flow",
    "corpus_flow",
    "launch_pilot_flow",
  ].map((phase) => ({
    phase: phase as E2EPhaseResult["phase"],
    passed: true,
    degraded: false,
    summary: `${phase} passed`,
    commandIndexes: [],
    artifactRefs: [],
    discoveredIds: {
      factoryIds: phase === "factory_flow" ? ["fac_test"] : [],
      missionIds: phase === "factory_flow" ? ["mis_test"] : [],
      candidateIds: phase === "publication_flow" ? ["candidate-test"] : [],
    },
    checks: [],
    degradedReasons: [],
    criticalFailures: [],
    evidenceHash: `${phase}-hash`,
  }));
}

function phase(run: any, name: string): any {
  const found = run.phases.find((item: any) => item.phase === name);
  assert.ok(found, `missing phase ${name}`);
  return found;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
