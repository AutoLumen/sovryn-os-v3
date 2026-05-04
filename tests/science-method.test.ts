import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { readJson } from "../src/shared/fs.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

const ENERGY_QUESTION =
  "Do provenance-aware anomaly scoring methods reduce false positives in synthetic energy-usage datasets compared with simple threshold baselines?";

async function initRepo() {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  return repo;
}

async function createQuestion() {
  const repo = await initRepo();
  const response = await executeCli(
    ["science", "question", ENERGY_QUESTION, "--json"],
    repo.root,
  );
  assert.equal(response.ok, true);
  return {
    repo,
    response,
    study: (response.data as any).study,
    question: (response.data as any).question,
  };
}

async function createHypothesizedStudy() {
  const context = await createQuestion();
  const response = await executeCli(
    ["science", "hypothesize", context.question.questionId, "--json"],
    context.repo.root,
  );
  assert.equal(response.ok, true);
  return {
    ...context,
    response,
    study: (response.data as any).study,
    hypotheses: (response.data as any).hypotheses,
  };
}

async function createDesignedStudy() {
  const context = await createHypothesizedStudy();
  const hypothesisId = context.hypotheses.hypotheses[0].hypothesisId;
  const response = await executeCli(
    ["science", "experiment", "design", hypothesisId, "--json"],
    context.repo.root,
  );
  assert.equal(response.ok, true);
  return {
    ...context,
    response,
    study: (response.data as any).study,
    experimentDesign: (response.data as any).experimentDesign,
  };
}

let runtimeFixturePromise:
  | Promise<Awaited<ReturnType<typeof createRuntimeStudy>>>
  | undefined;

async function runtimeFixture() {
  runtimeFixturePromise ??= createRuntimeStudy();
  return runtimeFixturePromise;
}

async function createRuntimeStudy() {
  const context = await createDesignedStudy();
  const data = await executeCli(
    ["science", "data", "generate", context.study.studyId, "--json"],
    context.repo.root,
  );
  assert.equal(data.ok, true, JSON.stringify(data.errors, null, 2));
  const instrument = await executeCli(
    ["science", "instrument", "build", context.study.studyId, "--json"],
    context.repo.root,
  );
  assert.equal(instrument.ok, true, JSON.stringify(instrument.errors, null, 2));
  const experimentRun = await executeCli(
    [
      "science",
      "experiment",
      "run",
      context.experimentDesign.experimentId,
      "--json",
    ],
    context.repo.root,
  );
  assert.equal(
    experimentRun.ok,
    true,
    JSON.stringify(experimentRun.errors, null, 2),
  );
  return {
    ...context,
    dataPlan: (data.data as any).dataPlan,
    datasets: (data.data as any).datasets,
    instrumentPlan: (instrument.data as any).instrumentPlan,
    toolchainPlan: (instrument.data as any).toolchainPlan,
    policyReview: (instrument.data as any).policyReview,
    runs: (experimentRun.data as any).runs,
    nodeAlphaExecution: (experimentRun.data as any).nodeAlphaExecution,
    runtimeGates: (experimentRun.data as any).gates,
  };
}

function studyPath(root: string, slug: string, file: string): string {
  return join(root, ".sovryn", "science", "studies", slug, file);
}

test("v1.1 alpha package version is set", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(pkg.version, "3.1.0-alpha.2");
});

test("init ignores science runtime artifacts", async () => {
  const repo = await initRepo();
  const gitignore = await readFile(join(repo.root, ".gitignore"), "utf8");
  assert.match(gitignore, /\.sovryn\/science\//);
});

test("science question command creates deterministic question", async () => {
  const first = await createQuestion();
  const second = await createQuestion();
  assert.equal(first.question.questionId, second.question.questionId);
  assert.equal(first.study.studyId, second.study.studyId);
  assert.equal(first.study.slug, second.study.slug);
});

test("science question includes required scientific fields", async () => {
  const { question } = await createQuestion();
  assert.equal(question.field, "energy-data-quality");
  assert.match(question.problemStatement, /provenance-aware/i);
  assert.match(question.whyItMatters, /false positives/i);
  assert.match(question.measurableOutcome, /false-positive rate/i);
  assert.ok(
    question.requiredData.includes("seeded synthetic energy-usage records"),
  );
});

test("science question records public source needs and corpus hints", async () => {
  const { question } = await createQuestion();
  assert.ok(question.publicSourceNeeds.length >= 2);
  assert.ok(
    question.priorCorpusResultsUsed.includes("energy-usage-anomaly-auditor"),
  );
});

test("science question writes study artifacts", async () => {
  const { repo, study } = await createQuestion();
  await access(studyPath(repo.root, study.slug, "study.json"));
  await access(studyPath(repo.root, study.slug, "question.json"));
  await access(studyPath(repo.root, study.slug, "safety-scope.json"));
  await access(studyPath(repo.root, study.slug, "SCIENCE_PLAN.md"));
  await access(studyPath(repo.root, study.slug, "STUDY_STATUS.md"));
});

test("science question is hash-bound", async () => {
  const { question } = await createQuestion();
  assert.equal(typeof question.evidenceHash, "string");
  assert.equal(question.evidenceHash.length, 64);
});

test("safe computational energy study has non-blocked safety scope", async () => {
  const { question } = await createQuestion();
  assert.equal(question.safetyScope.blocked, false);
  assert.equal(question.safetyScope.riskLevel, "low");
  assert.ok(question.safetyScope.allowedMethods.includes("statistics"));
});

test("safety scope blocks wet-lab protocol requests", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    [
      "science",
      "question",
      "Design a wet-lab protocol for a new assay",
      "--json",
    ],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_UNSAFE_DOMAIN_BLOCKED");
});

test("safety scope blocks hazardous chemistry requests", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    [
      "science",
      "question",
      "Optimize an explosive hazardous substance synthesis route",
      "--json",
    ],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_UNSAFE_DOMAIN_BLOCKED");
});

test("safety scope blocks medical treatment studies", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    [
      "science",
      "question",
      "Recommend a medical treatment for patients based on gene expression",
      "--json",
    ],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_UNSAFE_DOMAIN_BLOCKED");
});

test("safety scope blocks exploit development", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    [
      "science",
      "question",
      "Develop exploit guidance for attacking live systems",
      "--json",
    ],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_UNSAFE_DOMAIN_BLOCKED");
});

test("hypothesize creates at least two hypotheses", async () => {
  const { hypotheses } = await createHypothesizedStudy();
  assert.equal(hypotheses.hypotheses.length, 2);
});

test("hypotheses include null hypotheses", async () => {
  const { hypotheses } = await createHypothesizedStudy();
  assert.ok(
    hypotheses.hypotheses.every((hypothesis: any) =>
      hypothesis.nullHypothesis.includes("will not"),
    ),
  );
});

test("hypotheses include falsification criteria", async () => {
  const { hypotheses } = await createHypothesizedStudy();
  assert.ok(
    hypotheses.hypotheses.every(
      (hypothesis: any) => hypothesis.falsificationCriteria.length >= 3,
    ),
  );
});

test("hypotheses include baseline methods", async () => {
  const { hypotheses } = await createHypothesizedStudy();
  assert.ok(
    hypotheses.hypotheses.every((hypothesis: any) =>
      hypothesis.baselineMethod.includes("baseline"),
    ),
  );
});

test("hypotheses are hash-bound", async () => {
  const { hypotheses } = await createHypothesizedStudy();
  assert.equal(hypotheses.evidenceHash.length, 64);
  assert.equal(hypotheses.hypotheses[0].evidenceHash.length, 64);
});

test("hypothesize requires existing question id", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    ["science", "hypothesize", "sci-q-missing", "--json"],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_QUESTION_NOT_FOUND");
});

test("experiment design includes baseline", async () => {
  const { experimentDesign } = await createDesignedStudy();
  assert.match(experimentDesign.baseline, /baseline/);
});

test("experiment design includes measurable metrics", async () => {
  const { experimentDesign } = await createDesignedStudy();
  assert.ok(experimentDesign.metrics.includes("precision"));
  assert.ok(experimentDesign.metrics.includes("false positive rate"));
});

test("experiment design includes replication plan", async () => {
  const { experimentDesign } = await createDesignedStudy();
  assert.match(experimentDesign.replicationPlan, /three deterministic seeds/);
});

test("experiment design includes ablation and sensitivity plans", async () => {
  const { experimentDesign } = await createDesignedStudy();
  assert.ok(experimentDesign.ablationPlan.includes("remove provenance score"));
  assert.ok(
    experimentDesign.sensitivityPlan.some((item: string) =>
      item.includes("threshold"),
    ),
  );
});

test("experiment design prefers container-netoff", async () => {
  const { experimentDesign } = await createDesignedStudy();
  assert.equal(experimentDesign.workerProfile, "container-netoff");
});

test("experiment design is hash-bound", async () => {
  const { experimentDesign } = await createDesignedStudy();
  assert.equal(experimentDesign.evidenceHash.length, 64);
});

test("experiment design requires existing hypothesis id", async () => {
  const repo = await initRepo();
  const response = await executeCli(
    ["science", "experiment", "design", "sci-h-missing", "--json"],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_HYPOTHESIS_NOT_FOUND");
});

test("study status returns stable JSON shape", async () => {
  const { repo, study } = await createDesignedStudy();
  const response = await executeCli(
    ["science", "study", "status", study.studyId, "--json"],
    repo.root,
  );
  assert.equal(response.ok, true);
  assert.deepEqual(Object.keys(response.data as any).sort(), [
    "artifactRefs",
    "experimentCount",
    "hypothesisCount",
    "questionId",
    "safetyBlocked",
    "slug",
    "status",
    "studyId",
  ]);
});

test("study status accepts study slug", async () => {
  const { repo, study } = await createDesignedStudy();
  const response = await executeCli(
    ["science", "study", "status", study.slug, "--json"],
    repo.root,
  );
  assert.equal(response.ok, true);
  assert.equal((response.data as any).studyId, study.studyId);
});

test("review passes complete science plan", async () => {
  const { repo, study } = await createDesignedStudy();
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal(response.ok, true);
  assert.equal((response.data as any).status, "passed");
  assert.ok((response.data as any).gates.every((gate: any) => gate.passed));
});

test("review writes review artifacts", async () => {
  const { repo, study } = await createDesignedStudy();
  await executeCli(["science", "review", study.studyId, "--json"], repo.root);
  await access(studyPath(repo.root, study.slug, "science-review.json"));
  await access(studyPath(repo.root, study.slug, "SCIENCE_REVIEW.md"));
});

test("review reports missing hypotheses", async () => {
  const { repo, study } = await createQuestion();
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal(response.ok, true);
  const failed = (response.data as any).gates.filter(
    (gate: any) => !gate.passed,
  );
  assert.ok(failed.some((gate: any) => gate.code === "HYPOTHESIS_PRESENT"));
});

test("review blocks missing null hypothesis", async () => {
  const { repo, study } = await createHypothesizedStudy();
  const path = studyPath(repo.root, study.slug, "hypotheses.json");
  const hypotheses = await readJson<any>(path);
  hypotheses.hypotheses[0].nullHypothesis = "";
  await writeFile(path, `${JSON.stringify(hypotheses, null, 2)}\n`, "utf8");
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "blocked");
  assert.ok(
    (response.data as any).gates.some(
      (gate: any) => gate.code === "NULL_HYPOTHESIS_PRESENT" && !gate.passed,
    ),
  );
});

test("review blocks missing experiment design", async () => {
  const { repo, study } = await createHypothesizedStudy();
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "blocked");
  assert.ok(
    (response.data as any).gates.some(
      (gate: any) => gate.code === "EXPERIMENT_DESIGN_PRESENT" && !gate.passed,
    ),
  );
});

test("review blocks experiment design without baseline", async () => {
  const { repo, study } = await createDesignedStudy();
  const path = studyPath(repo.root, study.slug, "experiment-design.json");
  const design = await readJson<any>(path);
  design.baseline = "";
  await writeFile(path, `${JSON.stringify(design, null, 2)}\n`, "utf8");
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "blocked");
  assert.ok(
    (response.data as any).gates.some(
      (gate: any) => gate.code === "BASELINE_PRESENT" && !gate.passed,
    ),
  );
});

test("review blocks experiment design without metrics", async () => {
  const { repo, study } = await createDesignedStudy();
  const path = studyPath(repo.root, study.slug, "experiment-design.json");
  const design = await readJson<any>(path);
  design.metrics = [];
  await writeFile(path, `${JSON.stringify(design, null, 2)}\n`, "utf8");
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "blocked");
  assert.ok(
    (response.data as any).gates.some(
      (gate: any) => gate.code === "METRICS_PRESENT" && !gate.passed,
    ),
  );
});

test("review blocks unsupported scientific claim language", async () => {
  const { repo, study } = await createDesignedStudy();
  const path = studyPath(repo.root, study.slug, "question.json");
  const question = await readJson<any>(path);
  question.whyItMatters =
    "This proves the method is scientifically established.";
  await writeFile(path, `${JSON.stringify(question, null, 2)}\n`, "utf8");
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "blocked");
  assert.ok(
    (response.data as any).gates.some(
      (gate: any) =>
        gate.code === "NO_UNSUPPORTED_SCIENTIFIC_CLAIMS" && !gate.passed,
    ),
  );
});

test("review blocks unsafe content added after planning", async () => {
  const { repo, study } = await createDesignedStudy();
  const path = studyPath(repo.root, study.slug, "experiment-design.json");
  const design = await readJson<any>(path);
  design.datasetPlan = "Add a wet-lab protocol to generate data.";
  await writeFile(path, `${JSON.stringify(design, null, 2)}\n`, "utf8");
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "blocked");
  assert.ok(
    (response.data as any).gates.some(
      (gate: any) => gate.code === "NO_UNSAFE_DOMAIN_CONTENT" && !gate.passed,
    ),
  );
});

test("SCIENCE_PLAN uses careful non-legal language", async () => {
  const { repo, study } = await createDesignedStudy();
  const plan = await readFile(
    studyPath(repo.root, study.slug, "SCIENCE_PLAN.md"),
    "utf8",
  );
  assert.match(plan, /does not claim support/i);
  assert.match(plan, /not a patent filing/i);
  assert.doesNotMatch(
    plan,
    /\bis patentable\b|\bis legally novel\b|\bhas freedom to operate\b/i,
  );
});

test("science help lists science commands", async () => {
  const response = await executeCli(["--help"], process.cwd());
  assert.equal(response.ok, true);
  const help = (response.data as any).help;
  assert.match(help, /sovryn science question/);
  assert.match(help, /sovryn science experiment design/);
});

test("science index records study status", async () => {
  const { repo, study } = await createDesignedStudy();
  const index = await readJson<any>(
    join(repo.root, ".sovryn", "science", "index.json"),
  );
  assert.ok(index.studies.some((item: any) => item.studyId === study.studyId));
});

test("alpha.2 science data generate command is listed in help", async () => {
  const response = await executeCli(["--help"], process.cwd());
  const help = (response.data as any).help;
  assert.match(help, /sovryn science data generate/);
});

test("alpha.2 science instrument and run commands are listed in help", async () => {
  const response = await executeCli(["--help"], process.cwd());
  const help = (response.data as any).help;
  assert.match(help, /sovryn science instrument build/);
  assert.match(help, /sovryn science experiment run/);
  assert.match(help, /sovryn science experiment status/);
});

test("science data generate requires experiment design", async () => {
  const { repo, study } = await createQuestion();
  const response = await executeCli(
    ["science", "data", "generate", study.studyId, "--json"],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_EXPERIMENT_DESIGN_REQUIRED");
});

test("science data generate writes data plan", async () => {
  const { repo, study, dataPlan } = await runtimeFixture();
  assert.equal(dataPlan.datasetKind, "synthetic_energy_usage");
  await access(studyPath(repo.root, study.slug, "data-plan.json"));
});

test("science data generate writes three seeded datasets", async () => {
  const { repo, study, datasets } = await runtimeFixture();
  assert.equal(datasets.length, 3);
  await access(
    studyPath(repo.root, study.slug, "synthetic-datasets/dataset-seed-1.json"),
  );
  await access(
    studyPath(repo.root, study.slug, "synthetic-datasets/dataset-seed-2.json"),
  );
  await access(
    studyPath(repo.root, study.slug, "synthetic-datasets/dataset-seed-3.json"),
  );
});

test("synthetic data is deterministic by seed", async () => {
  const left = await createDesignedStudy();
  const first = await executeCli(
    ["science", "data", "generate", left.study.studyId, "--json"],
    left.repo.root,
  );
  const right = await createDesignedStudy();
  const second = await executeCli(
    ["science", "data", "generate", right.study.studyId, "--json"],
    right.repo.root,
  );
  assert.deepEqual(
    (first.data as any).datasets[0].records,
    (second.data as any).datasets[0].records,
  );
});

test("synthetic data contains true anomaly spikes", async () => {
  const { datasets } = await runtimeFixture();
  assert.ok(datasets[0].labels.trueAnomalyRecordIds.length > 0);
  assert.ok(
    datasets[0].records.some(
      (record: any) => record.expectedAnomaly === true && record.kwh > 12,
    ),
  );
});

test("synthetic data contains normal high-usage weather examples", async () => {
  const { datasets } = await runtimeFixture();
  const normalHigh = datasets[0].records.find((record: any) =>
    record.recordId.includes("weather-high"),
  );
  assert.equal(normalHigh.expectedAnomaly, false);
  assert.equal(normalHigh.provenance, "weather_adjusted");
});

test("synthetic data contains missing interval labels", async () => {
  const { datasets } = await runtimeFixture();
  assert.ok(datasets[0].labels.missingIntervalMeterIds.length > 0);
  assert.ok(
    datasets[0].records.some((record: any) =>
      record.expectedQualityIssues.includes("missing_interval"),
    ),
  );
});

test("synthetic data contains duplicate records", async () => {
  const { datasets } = await runtimeFixture();
  assert.ok(datasets[0].labels.duplicateRecordIds.length > 0);
});

test("synthetic data contains weak provenance records", async () => {
  const { datasets } = await runtimeFixture();
  assert.ok(datasets[0].labels.weakProvenanceRecordIds.length > 0);
  assert.ok(
    datasets[0].records.some(
      (record: any) => record.provenance === "weak_estimate",
    ),
  );
});

test("data plan has privacy-safe scope", async () => {
  const { dataPlan } = await runtimeFixture();
  assert.match(dataPlan.privacyScope, /Synthetic toy records only/);
  assert.match(dataPlan.privacyScope, /no private meter data/i);
});

test("science instrument build requires generated data", async () => {
  const { repo, study } = await createDesignedStudy();
  const response = await executeCli(
    ["science", "instrument", "build", study.studyId, "--json"],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_DATA_PLAN_REQUIRED");
});

test("science instrument build writes three instruments", async () => {
  const { instrumentPlan } = await runtimeFixture();
  assert.deepEqual(
    instrumentPlan.instruments.map((instrument: any) => instrument.name),
    [
      "threshold-baseline-detector",
      "provenance-aware-energy-detector",
      "experiment-runner",
    ],
  );
});

test("instrument build writes toolchain plan and policy review", async () => {
  const { repo, study, toolchainPlan, policyReview } = await runtimeFixture();
  assert.equal(toolchainPlan.installRequired, false);
  assert.equal(policyReview.passed, true);
  await access(studyPath(repo.root, study.slug, "toolchain-plan.json"));
  await access(
    studyPath(repo.root, study.slug, "toolchain-policy-review.json"),
  );
});

test("toolchain policy forbids sudo and curl pipe shell", async () => {
  const { policyReview } = await runtimeFixture();
  assert.ok(
    policyReview.blockedCommands.some((item: string) => item.includes("sudo")),
  );
  assert.ok(
    policyReview.blockedCommands.some((item: string) => item.includes("| sh")),
  );
});

test("instrument directories include readme source tests and package", async () => {
  const { repo, study, instrumentPlan } = await runtimeFixture();
  for (const instrument of instrumentPlan.instruments) {
    await access(
      studyPath(repo.root, study.slug, `${instrument.path}/README.md`),
    );
    await access(
      studyPath(repo.root, study.slug, `${instrument.path}/package.json`),
    );
    await access(
      studyPath(repo.root, study.slug, `${instrument.path}/src/index.js`),
    );
    await access(
      studyPath(
        repo.root,
        study.slug,
        `${instrument.path}/tests/prototype.test.js`,
      ),
    );
  }
});

test("threshold baseline source is generated", async () => {
  const { repo, study } = await runtimeFixture();
  const source = await readFile(
    studyPath(
      repo.root,
      study.slug,
      "instruments/threshold-baseline-detector/src/index.js",
    ),
    "utf8",
  );
  assert.match(source, /threshold-baseline-detector/);
});

test("provenance-aware detector source is generated", async () => {
  const { repo, study } = await runtimeFixture();
  const source = await readFile(
    studyPath(
      repo.root,
      study.slug,
      "instruments/provenance-aware-energy-detector/src/index.js",
    ),
    "utf8",
  );
  assert.match(source, /weatherExplainsHighUse/);
});

test("experiment runner source is generated", async () => {
  const { repo, study } = await runtimeFixture();
  const source = await readFile(
    studyPath(
      repo.root,
      study.slug,
      "instruments/experiment-runner/src/index.js",
    ),
    "utf8",
  );
  assert.match(source, /falsePositiveReduction/);
});

test("science experiment run requires instruments", async () => {
  const { repo, experimentDesign } = await createDesignedStudy();
  const response = await executeCli(
    ["science", "experiment", "run", experimentDesign.experimentId, "--json"],
    repo.root,
  );
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, "SCIENCE_INSTRUMENTS_REQUIRED");
});

test("science experiment run writes three run artifacts", async () => {
  const { repo, study, runs } = await runtimeFixture();
  assert.equal(runs.length, 3);
  await access(studyPath(repo.root, study.slug, "experiment-runs/run-1.json"));
  await access(studyPath(repo.root, study.slug, "experiment-runs/run-2.json"));
  await access(studyPath(repo.root, study.slug, "experiment-runs/run-3.json"));
});

test("baseline has more false positives than provenance-aware detector", async () => {
  const { runs } = await runtimeFixture();
  assert.ok(
    runs.every(
      (run: any) => run.baseline.falsePositives > run.candidate.falsePositives,
    ),
  );
});

test("candidate detects true anomaly spikes", async () => {
  const { runs } = await runtimeFixture();
  assert.ok(runs.every((run: any) => run.candidate.truePositives >= 1));
});

test("candidate preserves recall compared with baseline", async () => {
  const { runs } = await runtimeFixture();
  assert.ok(runs.every((run: any) => run.comparison.recallDelta >= 0));
});

test("experiment run evidence is hash-bound", async () => {
  const { runs } = await runtimeFixture();
  assert.ok(runs.every((run: any) => typeof run.evidenceHash === "string"));
});

test("Node Alpha execution evidence is written", async () => {
  const { repo, study, nodeAlphaExecution } = await runtimeFixture();
  assert.equal(
    nodeAlphaExecution.executionId.startsWith("sci-node-alpha-"),
    true,
  );
  await access(studyPath(repo.root, study.slug, "node-alpha-execution.json"));
  await access(studyPath(repo.root, study.slug, "NODE_ALPHA_EXECUTION.md"));
});

test("Node Alpha execution records requested container-netoff", async () => {
  const { nodeAlphaExecution } = await runtimeFixture();
  assert.equal(nodeAlphaExecution.requestedProfile, "container-netoff");
});

test("Node Alpha execution records no silent fallback", async () => {
  const { nodeAlphaExecution } = await runtimeFixture();
  assert.equal(nodeAlphaExecution.noSilentFallback, true);
});

test("Node Alpha execution records degraded fallback explicitly", async () => {
  const { nodeAlphaExecution } = await runtimeFixture();
  if (nodeAlphaExecution.usedProfile === "sandbox-local") {
    assert.equal(nodeAlphaExecution.degraded, true);
    assert.match(nodeAlphaExecution.degradedReason, /container-netoff/i);
  } else {
    assert.equal(nodeAlphaExecution.usedProfile, "container-netoff");
    assert.equal(nodeAlphaExecution.degraded, false);
  }
});

test("Node Alpha command evidence is redacted and bounded", async () => {
  const { nodeAlphaExecution } = await runtimeFixture();
  assert.ok(nodeAlphaExecution.commands.length >= 6);
  assert.ok(
    nodeAlphaExecution.commands.every(
      (command: any) =>
        typeof command.stdoutRedactedPreview === "string" &&
        !("stdout" in command) &&
        !("stderr" in command),
    ),
  );
});

test("instrument tests pass before experiment runs", async () => {
  const { nodeAlphaExecution } = await runtimeFixture();
  const tests = nodeAlphaExecution.commands.filter((command: any) =>
    command.command.includes("tests/prototype.test.js"),
  );
  assert.equal(tests.length, 3);
  assert.ok(tests.every((command: any) => command.exitCode === 0));
});

test("experiment status returns runtime gates", async () => {
  const { repo, experimentDesign } = await runtimeFixture();
  const response = await executeCli(
    [
      "science",
      "experiment",
      "status",
      experimentDesign.experimentId,
      "--json",
    ],
    repo.root,
  );
  assert.equal(response.ok, true);
  const gates = (response.data as any).gates.map((gate: any) => gate.code);
  assert.ok(gates.includes("DATA_PLAN_PRESENT"));
  assert.ok(gates.includes("NODE_ALPHA_EXECUTION_PRESENT"));
});

test("experiment status passes after runtime execution", async () => {
  const { repo, experimentDesign } = await runtimeFixture();
  const response = await executeCli(
    [
      "science",
      "experiment",
      "status",
      experimentDesign.experimentId,
      "--json",
    ],
    repo.root,
  );
  assert.equal((response.data as any).passed, true);
  assert.equal((response.data as any).runCount, 3);
});

test("experiment status returns stable alpha.2 JSON shape", async () => {
  const { repo, experimentDesign } = await runtimeFixture();
  const response = await executeCli(
    [
      "science",
      "experiment",
      "status",
      experimentDesign.experimentId,
      "--json",
    ],
    repo.root,
  );
  assert.deepEqual(Object.keys(response.data as any).sort(), [
    "artifactRefs",
    "degraded",
    "experimentId",
    "gates",
    "noSilentFallback",
    "passed",
    "runCount",
    "slug",
    "status",
    "studyId",
    "workerProfileUsed",
  ]);
});

test("runtime review includes every alpha.2 runtime gate", async () => {
  const { repo, study } = await runtimeFixture();
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  const codes = new Set(
    (response.data as any).gates.map((gate: any) => gate.code),
  );
  for (const code of [
    "DATA_PLAN_PRESENT",
    "SYNTHETIC_DATA_PRESENT",
    "INSTRUMENT_PLAN_PRESENT",
    "INSTRUMENT_BUILT",
    "INSTRUMENT_TESTED",
    "TOOLCHAIN_POLICY_PASSED",
    "NODE_ALPHA_EXECUTION_PRESENT",
    "NO_SILENT_FALLBACK",
    "EXPERIMENT_RUN_PRESENT",
  ]) {
    assert.equal(codes.has(code), true, code);
  }
});

test("study status reaches experiment completed", async () => {
  const { repo, study } = await runtimeFixture();
  const response = await executeCli(
    ["science", "study", "status", study.studyId, "--json"],
    repo.root,
  );
  assert.ok(
    ["experiment_completed", "reviewed"].includes(
      (response.data as any).status,
    ),
  );
});

test("science review after runtime includes runtime gates", async () => {
  const { repo, study } = await runtimeFixture();
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  const codes = (response.data as any).gates.map((gate: any) => gate.code);
  assert.ok(codes.includes("INSTRUMENT_TESTED"));
  assert.ok(codes.includes("EXPERIMENT_RUN_PRESENT"));
});

test("science review after runtime passes", async () => {
  const { repo, study } = await runtimeFixture();
  const response = await executeCli(
    ["science", "review", study.studyId, "--json"],
    repo.root,
  );
  assert.equal((response.data as any).status, "passed");
});

test("NODE_ALPHA_EXECUTION markdown excludes raw logs", async () => {
  const { repo, study } = await runtimeFixture();
  const report = await readFile(
    studyPath(repo.root, study.slug, "NODE_ALPHA_EXECUTION.md"),
    "utf8",
  );
  assert.match(report, /Raw stdout\/stderr logs are not published/);
  assert.doesNotMatch(report, /command-journal|stdout:/i);
});

test("runtime artifacts do not contain sudo or curl pipe shell execution", async () => {
  const { nodeAlphaExecution } = await runtimeFixture();
  const text = JSON.stringify(nodeAlphaExecution);
  assert.doesNotMatch(text, /\bsudo\b/);
  assert.doesNotMatch(text, /curl.+\|\s*sh/);
});
