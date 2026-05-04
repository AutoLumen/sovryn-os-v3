import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

type Alpha18Fixture = {
  root: string;
  run: any;
  base: string;
  releasePath: string;
};

let fixturePromise: Promise<Alpha18Fixture> | null = null;

test("Alpha.18 fixture paper source can produce bounded fulltext-like reading", async () => {
  const { base } = await alpha18Fixture();
  const readings = await readJson(join(base, "source-readings.json"));
  assert.equal(
    readings.readings.some(
      (reading: any) =>
        reading.sourceType === "paper" &&
        reading.readingDepth === "paper_fulltext_level",
    ),
    true,
  );
});

test("paper-readings artifact is generated and hash-bound", async () => {
  const { base, run } = await alpha18Fixture();
  const papers = await readJson(join(base, "paper-readings.json"));
  assert.equal(papers.kind, "factory_paper_readings");
  assert.equal(papers.paperCount >= 2, true);
  assert.equal(run.evidenceHashes.paper_readings, papers.evidenceHash);
});

test("paper-readings distinguish fulltext-like and metadata-only evidence", async () => {
  const { base } = await alpha18Fixture();
  const papers = await readJson(join(base, "paper-readings.json"));
  assert.equal(papers.fulltextLikeCount >= 1, true);
  assert.equal(papers.metadataOnlyCount >= 1, true);
});

test("paper-readings store summaries and not raw fulltext", async () => {
  const { base } = await alpha18Fixture();
  const raw = await readFile(join(base, "paper-readings.json"), "utf8");
  assert.doesNotMatch(raw, /fullRawContent|rawPdf|fulltextBody|ocrText/);
});

test("patent-claim-readings artifact is generated from concrete patent fixtures", async () => {
  const { base, run } = await alpha18Fixture();
  const patents = await readJson(join(base, "patent-claim-readings.json"));
  assert.equal(patents.kind, "factory_patent_claim_readings");
  assert.equal(patents.patentCount >= 1, true);
  assert.equal(patents.claimElementCount >= 1, true);
  assert.equal(run.evidenceHashes.patent_claim_readings, patents.evidenceHash);
});

test("patent claim elements require legal review language", async () => {
  const { base } = await alpha18Fixture();
  const patents = await readJson(join(base, "patent-claim-readings.json"));
  assert.equal(
    patents.patents.every((patent: any) =>
      patent.claimElements.every(
        (element: any) => element.requiresLegalReview === true,
      ),
    ),
    true,
  );
  assert.match(patents.limitations.join(" "), /does not perform legal/i);
});

test("claim-element map binds paper and patent evidence hashes", async () => {
  const { base, run } = await alpha18Fixture();
  const map = await readJson(join(base, "claim-element-map.json"));
  const papers = await readJson(join(base, "paper-readings.json"));
  const patents = await readJson(join(base, "patent-claim-readings.json"));
  const matrix = await readJson(join(base, "claim-feature-matrix.json"));
  assert.equal(map.kind, "factory_claim_element_map");
  assert.equal(map.paperReadingsEvidenceHash, papers.evidenceHash);
  assert.equal(map.patentClaimReadingsEvidenceHash, patents.evidenceHash);
  assert.equal(map.claimFeatureMatrixEvidenceHash, matrix.evidenceHash);
  assert.equal(run.evidenceHashes.claim_element_map, map.evidenceHash);
});

test("source-to-claim markdown uses careful non-legal language", async () => {
  const { base } = await alpha18Fixture();
  const md = await readFile(join(base, "SOURCE_TO_CLAIM_MAP.md"), "utf8");
  assert.match(md, /not a legal novelty conclusion/i);
  assert.doesNotMatch(
    md,
    /guaranteed new|patentable|freedom to operate opinion/i,
  );
});

test("patent risk notes are generated with no patentability claim", async () => {
  const { base } = await alpha18Fixture();
  const md = await readFile(join(base, "PATENT_RISK_NOTES.md"), "utf8");
  assert.match(md, /not legal claim construction/i);
  assert.doesNotMatch(md, /guaranteed patentability|legally novel/i);
});

test("factory review includes Alpha.18 claim intelligence gates", async () => {
  const { root, run } = await alpha18Fixture();
  const review = await executeCli(
    ["factory", "review", run.id, "--json"],
    root,
  );
  assert.equal(review.ok, true);
  assert.equal(
    checkPassed((review.data as any).review, "PAPER_READINGS_PRESENT"),
    true,
  );
  assert.equal(
    checkPassed((review.data as any).review, "PATENT_CLAIM_READINGS_PRESENT"),
    true,
  );
  assert.equal(
    checkPassed((review.data as any).review, "CLAIM_ELEMENT_MAP_PRESENT"),
    true,
  );
  assert.equal(
    checkPassed((review.data as any).review, "CLAIM_ELEMENT_MAP_HASH_BOUND"),
    true,
  );
});

test("factory review blocks stale claim-element map evidence", async () => {
  const fixture = await createAlpha18Run();
  const mapPath = join(fixture.base, "claim-element-map.json");
  const map = await readJson(mapPath);
  map.highRiskMappings = 999;
  await writeFile(mapPath, `${JSON.stringify(map, null, 2)}\n`, "utf8");
  const review = await executeCli(
    ["factory", "review", fixture.run.id, "--json"],
    fixture.root,
  );
  assert.equal(review.ok, true);
  assert.equal(
    checkPassed((review.data as any).review, "CLAIM_ELEMENT_MAP_HASH_BOUND"),
    false,
  );
  assert.equal(
    checkPassed((review.data as any).review, "HASHES_BOUND_TO_EVIDENCE"),
    false,
  );
});

test("public release includes Alpha.18 curated summaries", async () => {
  const { releasePath } = await alpha18Fixture();
  await readJson(join(releasePath, "paper-readings.summary.json"));
  await readJson(join(releasePath, "patent-claim-readings.summary.json"));
  await readJson(join(releasePath, "claim-element-map.summary.json"));
});

test("public release includes Alpha.18 reports", async () => {
  const { releasePath } = await alpha18Fixture();
  await readFile(join(releasePath, "SOURCE_TO_CLAIM_MAP.md"), "utf8");
  await readFile(join(releasePath, "PATENT_RISK_NOTES.md"), "utf8");
});

test("public Alpha.18 release excludes raw paper or patent content", async () => {
  const { releasePath } = await alpha18Fixture();
  const map = await readFile(
    join(releasePath, "claim-element-map.summary.json"),
    "utf8",
  );
  const papers = await readFile(
    join(releasePath, "paper-readings.summary.json"),
    "utf8",
  );
  assert.doesNotMatch(
    `${map}\n${papers}`,
    /fullRawContent|rawPdf|ocrText|privateConfig/,
  );
});

test("Alpha.18 artifact refs include source-to-claim files", async () => {
  const { base } = await alpha18Fixture();
  const run = await readJson(join(base, "factory-run.json"));
  assert.equal(
    run.evidencePaths.some((path: string) =>
      path.endsWith("claim-element-map.json"),
    ),
    true,
  );
  assert.equal(
    run.evidencePaths.some((path: string) =>
      path.endsWith("SOURCE_TO_CLAIM_MAP.md"),
    ),
    true,
  );
});

test("claim-element map has high-risk mappings when patent elements overlap", async () => {
  const { base } = await alpha18Fixture();
  const map = await readJson(join(base, "claim-element-map.json"));
  assert.equal(map.mappings.length > 0, true);
  assert.equal(typeof map.highRiskMappings, "number");
});

async function alpha18Fixture(): Promise<Alpha18Fixture> {
  fixturePromise ??= createAlpha18Run().then(async (fixture) => {
    const packaged = await executeCli(
      ["factory", "package", fixture.run.id, "--json"],
      fixture.root,
    );
    assert.equal(packaged.ok, true);
    return {
      ...fixture,
      releasePath: (packaged.data as any).releasePath,
    };
  });
  return fixturePromise;
}

async function createAlpha18Run(): Promise<Alpha18Fixture> {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const configPath = join(repo.root, ".sovryn", "config.json");
  const config = await readJson(configPath);
  config.research.publicSearch.enabled = true;
  config.research.publicSearch.fixtureMode = true;
  config.research.sourceReading.enabled = true;
  config.research.sourceReading.fixtureMode = true;
  config.research.factory.strictEvidenceMode = true;
  config.research.factory.allowMockMode = false;
  config.research.factory.requireConcreteSources = true;
  config.research.factory.minConcreteSources = 3;
  config.research.factory.minConcreteSourcesRead = 3;
  config.research.factory.minEvidenceStrengthScore = 60;
  config.research.factory.minReproducibilityScore = 60;
  config.research.factory.minReadingDepthScore = 40;
  config.research.factory.minClaimMappingScore = 50;
  config.research.factory.minNoveltyRiskScore = 50;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  const response = await executeCli(
    [
      "factory",
      "run",
      "Develop a method for verifiable autonomous open-source research agents",
      "--mode",
      "autonomous",
      "--max-cycles",
      "3",
      "--json",
    ],
    repo.root,
  );
  assert.equal(response.ok, true);
  const run = (response.data as any).run;
  return {
    root: repo.root,
    run,
    base: join(repo.root, ".sovryn", "factory", run.slug),
    releasePath: join(
      repo.root,
      ".sovryn",
      "factory",
      run.slug,
      "release",
      "public",
    ),
  };
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function checkPassed(review: any, code: string): boolean | undefined {
  return review.checks.find((check: any) => check.code === code)?.passed;
}
