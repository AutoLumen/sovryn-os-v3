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

function studyPath(root: string, slug: string, file: string): string {
  return join(root, ".sovryn", "science", "studies", slug, file);
}

test("v1.1 alpha package version is set", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(pkg.version, "3.1.0-alpha.1");
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
