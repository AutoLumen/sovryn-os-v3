import assert from "node:assert/strict";
import { access, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

type CandidateFixture = {
  root: string;
  build: any;
};

let fixturePromise: Promise<CandidateFixture> | null = null;

test("release candidates build creates three candidates by default", async () => {
  const { build } = await releaseCandidateFixture();
  assert.equal(build.candidates.length, 3);
});

test("release candidates target the expected Alpha.21 domains", async () => {
  const { build } = await releaseCandidateFixture();
  const goals = build.candidates.map(
    (candidate: any) => candidate.researchGoal,
  );
  assert.equal(
    goals.some((goal: string) => /verifiable autonomous/i.test(goal)),
    true,
  );
  assert.equal(
    goals.some((goal: string) => /source-card trust/i.test(goal)),
    true,
  );
  assert.equal(
    goals.some((goal: string) => /container-isolated/i.test(goal)),
    true,
  );
});

test("each release candidate binds factory and Open Invention mission", async () => {
  const { build } = await releaseCandidateFixture();
  for (const candidate of build.candidates) {
    assert.equal(typeof candidate.factoryId, "string");
    assert.equal(typeof candidate.inventionMissionId, "string");
    assert.equal(candidate.factoryId.length > 0, true);
    assert.equal(candidate.inventionMissionId.length > 0, true);
  }
});

test("each release candidate has readiness scoring dimensions", async () => {
  const { build } = await releaseCandidateFixture();
  const score = build.candidates[0].score;
  for (const key of [
    "releaseReadinessScore",
    "publicEvidenceScore",
    "reproducibilityScore",
    "sourceStrengthScore",
    "noveltyRiskScore",
    "safetyRiskScore",
    "corpusDuplicateRisk",
  ]) {
    assert.equal(typeof score[key], "number");
  }
});

test("release readiness score is strong for fixture-backed candidates", async () => {
  const { build } = await releaseCandidateFixture();
  assert.equal(
    build.candidates.every(
      (candidate: any) => candidate.score.releaseReadinessScore >= 70,
    ),
    true,
  );
});

test("human review is required for every release candidate", async () => {
  const { build } = await releaseCandidateFixture();
  assert.equal(
    build.candidates.every((candidate: any) => candidate.humanReviewRequired),
    true,
  );
});

test("release candidates include publication intent paths", async () => {
  const { root, build } = await releaseCandidateFixture();
  for (const candidate of build.candidates) {
    await access(join(root, candidate.publicationIntentPath));
  }
});

test("release candidates include curated public release paths", async () => {
  const { root, build } = await releaseCandidateFixture();
  for (const candidate of build.candidates) {
    await access(join(root, candidate.releasePath, "FACTORY_REPORT.md"));
    await access(
      join(root, candidate.releasePath, "factory-score.summary.json"),
    );
  }
});

test("release candidate review passes complete fixture candidates", async () => {
  const { root } = await releaseCandidateFixture();
  const review = await executeCli(
    ["release", "candidates", "review", "--json"],
    root,
  );
  assert.equal(review.ok, true);
  assert.equal((review.data as any).review.allowed, true);
});

test("release candidate review writes markdown report", async () => {
  const { root } = await releaseCandidateFixture();
  await executeCli(["release", "candidates", "review", "--json"], root);
  const report = await readFile(
    join(
      root,
      ".sovryn",
      "releases",
      "candidates",
      "RELEASE_CANDIDATE_REVIEW.md",
    ),
    "utf8",
  );
  assert.match(report, /Release Candidate Review/);
});

test("release candidate review records required gates", async () => {
  const { root } = await releaseCandidateFixture();
  const review = await executeCli(
    ["release", "candidates", "review", "--json"],
    root,
  );
  const codes = (review.data as any).review.checks.map(
    (check: any) => check.code,
  );
  assert.equal(codes.includes("RELEASE_CANDIDATE_COMPLETE"), true);
  assert.equal(codes.includes("FACTORY_REPLAY_PASSED"), true);
  assert.equal(codes.includes("NO_RAW_LOGS_IN_RELEASE"), true);
  assert.equal(codes.includes("HUMAN_REVIEW_REQUIRED_FOR_REAL_PUBLISH"), true);
});

test("release candidate package creates aggregate public package", async () => {
  const { root } = await releaseCandidateFixture();
  const packaged = await executeCli(
    ["release", "candidates", "package", "--json"],
    root,
  );
  assert.equal(packaged.ok, true);
  await access(join(root, ".sovryn", "releases", "candidates", "public"));
});

test("release candidate package includes candidate summaries", async () => {
  const { root, build } = await releaseCandidateFixture();
  await executeCli(["release", "candidates", "package", "--json"], root);
  for (const candidate of build.candidates) {
    await access(
      join(
        root,
        ".sovryn",
        "releases",
        "candidates",
        "public",
        candidate.candidateId,
        "candidate.summary.json",
      ),
    );
  }
});

test("release candidate package excludes raw command logs", async () => {
  const { root } = await releaseCandidateFixture();
  await executeCli(["release", "candidates", "package", "--json"], root);
  const text = await readAllText(
    join(root, ".sovryn", "releases", "candidates", "public"),
  );
  assert.doesNotMatch(text, /command-journal|stdoutPath|stderrPath/i);
});

test("release candidate package excludes secret-like values", async () => {
  const { root } = await releaseCandidateFixture();
  await executeCli(["release", "candidates", "package", "--json"], root);
  const text = await readAllText(
    join(root, ".sovryn", "releases", "candidates", "public"),
  );
  assert.doesNotMatch(text, /ghp_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}/);
});

test("release candidate package keeps legal language careful", async () => {
  const { root } = await releaseCandidateFixture();
  await executeCli(["release", "candidates", "package", "--json"], root);
  const report = await readFile(
    join(
      root,
      ".sovryn",
      "releases",
      "candidates",
      "public",
      "RELEASE_CANDIDATES.md",
    ),
    "utf8",
  );
  assert.match(report, /not legal patent filings/i);
  assert.doesNotMatch(report, /is patentable|guaranteed novelty/i);
});

test("publication queue is written during build", async () => {
  const { root } = await releaseCandidateFixture();
  await access(
    join(root, ".sovryn", "releases", "candidates", "publication-queue.json"),
  );
  await access(
    join(root, ".sovryn", "releases", "candidates", "PUBLICATION_QUEUE.md"),
  );
});

test("publication queue recommends human review for passing candidates", async () => {
  const { root } = await releaseCandidateFixture();
  const queue = await readJson(
    join(root, ".sovryn", "releases", "candidates", "publication-queue.json"),
  );
  assert.equal(
    queue.candidates.every(
      (candidate: any) => candidate.recommendedAction === "human_review",
    ),
    true,
  );
});

test("corpus index is updated by release candidate build", async () => {
  const { root } = await releaseCandidateFixture();
  const corpus = await readJson(
    join(root, ".sovryn", "corpus", "corpus-index.json"),
  );
  assert.equal(corpus.factoryRuns.length >= 3, true);
  assert.equal(corpus.publicReleases.length >= 3, true);
});

test("release registry sees release candidate dry-runs", async () => {
  const { root } = await releaseCandidateFixture();
  const registry = await executeCli(
    ["release", "registry", "update", "--json"],
    root,
  );
  assert.equal((registry.data as any).publicReleases.length >= 3, true);
});

test("build --max limits generated candidates", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  assert.equal(built.ok, true);
  assert.equal((built.data as any).build.candidates.length, 1);
});

test("candidate review blocks missing public release evidence", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  const candidate = (built.data as any).build.candidates[0];
  await rm(join(repo.root, candidate.releasePath), {
    recursive: true,
    force: true,
  });
  const review = await executeCli(
    ["release", "candidates", "review", "--json"],
    repo.root,
  );
  assert.equal(review.ok, true);
  assert.equal((review.data as any).review.allowed, false);
});

test("candidate review detects raw log leakage", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  const candidate = (built.data as any).build.candidates[0];
  await writeFile(
    join(repo.root, candidate.releasePath, "stdout.log"),
    "raw log\n",
    "utf8",
  );
  const review = await executeCli(
    ["release", "candidates", "review", "--json"],
    repo.root,
  );
  assert.equal((review.data as any).review.allowed, false);
  assert.equal(
    (review.data as any).review.checks.some(
      (check: any) => check.code === "NO_RAW_LOGS_IN_RELEASE" && !check.passed,
    ),
    true,
  );
});

test("candidate review detects secrets in release evidence", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  const candidate = (built.data as any).build.candidates[0];
  await writeFile(
    join(repo.root, candidate.releasePath, "secret.txt"),
    "token = ghp_abcdefghijklmnopqrstuvwxyz123456\n",
    "utf8",
  );
  const review = await executeCli(
    ["release", "candidates", "review", "--json"],
    repo.root,
  );
  assert.equal((review.data as any).review.allowed, false);
});

test("candidate review detects legal patentability claims", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  const candidate = (built.data as any).build.candidates[0];
  await writeFile(
    join(repo.root, candidate.releasePath, "bad-claim.md"),
    "This invention is patentable and legally novel.\n",
    "utf8",
  );
  const review = await executeCli(
    ["release", "candidates", "review", "--json"],
    repo.root,
  );
  assert.equal((review.data as any).review.allowed, false);
});

test("release candidates require Sovryn initialization", async () => {
  const repo = await makeTempRepo();
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  assert.equal(built.ok, false);
  assert.equal(built.errors[0].code, "CONFIG_MISSING");
});

test("CLI help lists release candidate commands", async () => {
  const help = await executeCli(["--help", "--json"]);
  assert.match((help.data as any).help, /release candidates build/);
  assert.match((help.data as any).help, /release candidates review/);
  assert.match((help.data as any).help, /release candidates package/);
});

async function releaseCandidateFixture(): Promise<CandidateFixture> {
  fixturePromise ??= createReleaseCandidateFixture();
  return fixturePromise;
}

async function createReleaseCandidateFixture(): Promise<CandidateFixture> {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "3", "--json"],
    repo.root,
  );
  assert.equal(built.ok, true);
  return {
    root: repo.root,
    build: (built.data as any).build,
  };
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readAllText(root: string): Promise<string> {
  const { readdir, stat } = await import("node:fs/promises");
  const chunks: string[] = [];
  for (const entry of await readdir(root)) {
    const path = join(root, entry);
    const info = await stat(path);
    if (info.isDirectory()) chunks.push(await readAllText(path));
    else if (info.isFile()) chunks.push(await readFile(path, "utf8"));
  }
  return chunks.join("\n");
}
