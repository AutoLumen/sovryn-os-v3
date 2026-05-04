import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

type PublicCorpusFixture = {
  root: string;
  factoryId: string;
  inventionId: string;
  sourceKey: string;
  exportResult: any;
};

let fixturePromise: Promise<PublicCorpusFixture> | null = null;

test("public corpus export creates curated file set", async () => {
  const { root } = await publicCorpusFixture();
  for (const file of expectedPublicFiles()) {
    await access(join(root, ".sovryn", "corpus", "public", file));
  }
});

test("public corpus index includes corpus counts", async () => {
  const { root } = await publicCorpusFixture();
  const index = await readJson(
    join(root, ".sovryn", "corpus", "public", "index.json"),
  );
  assert.equal(index.factoryRunCount > 0, true);
  assert.equal(index.inventionCount > 0, true);
  assert.equal(index.sourceCount > 0, true);
});

test("public inventions export includes generated inventions", async () => {
  const { root, inventionId } = await publicCorpusFixture();
  const inventions = await readJson(
    join(root, ".sovryn", "corpus", "public", "inventions.json"),
  );
  assert.equal(
    inventions.inventions.some((item: any) => item.inventionId === inventionId),
    true,
  );
});

test("public sources export includes source summaries", async () => {
  const { root } = await publicCorpusFixture();
  const sources = await readJson(
    join(root, ".sovryn", "corpus", "public", "sources.json"),
  );
  assert.equal(sources.sources.length > 0, true);
  assert.equal(typeof sources.sources[0].readingDepth, "string");
});

test("public source-card export excludes raw source content", async () => {
  const { root } = await publicCorpusFixture();
  const text = await readFile(
    join(root, ".sovryn", "corpus", "public", "source-cards.json"),
    "utf8",
  );
  assert.doesNotMatch(text, /rawSource|fullRaw|stdout|stderr/i);
});

test("public claim-features export includes matrix rows", async () => {
  const { root } = await publicCorpusFixture();
  const features = await readJson(
    join(root, ".sovryn", "corpus", "public", "claim-features.json"),
  );
  assert.equal(features.claimFeatures.length > 0, true);
  assert.equal(
    typeof features.claimFeatures[0].possibleDifferentiator,
    "string",
  );
});

test("public release-candidates export includes release candidates", async () => {
  const { root, factoryId } = await publicCorpusFixture();
  const candidates = await readJson(
    join(root, ".sovryn", "corpus", "public", "release-candidates.json"),
  );
  assert.equal(
    candidates.releaseCandidates.some(
      (item: any) => item.factoryId === factoryId,
    ),
    true,
  );
});

test("public quality scores include labels", async () => {
  const { root } = await publicCorpusFixture();
  const quality = await readJson(
    join(root, ".sovryn", "corpus", "public", "quality-scores.json"),
  );
  assert.equal(quality.qualityScores.length > 0, true);
  assert.equal(typeof quality.qualityScores[0].qualityLabel, "string");
});

test("public duplicate map is written", async () => {
  const { root } = await publicCorpusFixture();
  const duplicates = await readJson(
    join(root, ".sovryn", "corpus", "public", "duplicate-map.public.json"),
  );
  assert.equal(Array.isArray(duplicates.duplicates), true);
});

test("public corpus graph contains nodes and edges", async () => {
  const { root } = await publicCorpusFixture();
  const graph = await readJson(
    join(root, ".sovryn", "corpus", "public", "corpus-graph.json"),
  );
  assert.equal(graph.nodes.length > 0, true);
  assert.equal(graph.edges.length > 0, true);
});

test("public corpus export gates pass", async () => {
  const { exportResult } = await publicCorpusFixture();
  assert.equal(
    exportResult.checks.every((gate: any) => gate.passed),
    true,
  );
});

test("public corpus export excludes raw logs", async () => {
  const { root } = await publicCorpusFixture();
  const text = await readAllText(join(root, ".sovryn", "corpus", "public"));
  assert.doesNotMatch(text, /command-journal|raw command log|stdout|stderr/i);
});

test("public corpus export excludes local absolute paths", async () => {
  const { root } = await publicCorpusFixture();
  const text = await readAllText(join(root, ".sovryn", "corpus", "public"));
  assert.doesNotMatch(text, /\/Users\/|\/home\/|\/private\/tmp\//);
});

test("public corpus export excludes private config", async () => {
  const { root } = await publicCorpusFixture();
  const files = await readdir(join(root, ".sovryn", "corpus", "public"));
  assert.equal(files.includes("config.json"), false);
});

test("public corpus export excludes secret-like values", async () => {
  const { root } = await publicCorpusFixture();
  const text = await readAllText(join(root, ".sovryn", "corpus", "public"));
  assert.doesNotMatch(text, /ghp_|github_pat_|sk-[A-Za-z0-9_-]{20,}/);
});

test("corpus explain works for factory ids", async () => {
  const { root, factoryId } = await publicCorpusFixture();
  const explained = await executeCli(
    ["corpus", "explain", factoryId, "--json"],
    root,
  );
  assert.equal(explained.ok, true);
  assert.equal((explained.data as any).explanation.targetKind, "factory");
});

test("corpus explain works for invention ids", async () => {
  const { root, inventionId } = await publicCorpusFixture();
  const explained = await executeCli(
    ["corpus", "explain", inventionId, "--json"],
    root,
  );
  assert.equal(explained.ok, true);
  assert.equal((explained.data as any).explanation.targetKind, "invention");
});

test("corpus explain works for source ids", async () => {
  const { root, sourceKey } = await publicCorpusFixture();
  const explained = await executeCli(
    ["corpus", "explain", sourceKey, "--json"],
    root,
  );
  assert.equal(explained.ok, true);
  assert.equal((explained.data as any).explanation.targetKind, "source");
});

test("corpus explain returns stable not-found error", async () => {
  const { root } = await publicCorpusFixture();
  const explained = await executeCli(
    ["corpus", "explain", "missing", "--json"],
    root,
  );
  assert.equal(explained.ok, false);
  assert.equal(explained.errors[0].code, "CORPUS_EXPLAIN_NOT_FOUND");
});

test("corpus compare returns duplicate clusters", async () => {
  const { root } = await publicCorpusFixture();
  const compared = await executeCli(["corpus", "compare", "--json"], root);
  assert.equal(compared.ok, true);
  assert.equal(
    Array.isArray((compared.data as any).comparison.duplicateClusters),
    true,
  );
});

test("corpus compare returns source reuse", async () => {
  const { root } = await publicCorpusFixture();
  const compared = await executeCli(["corpus", "compare", "--json"], root);
  assert.equal((compared.data as any).comparison.sourceReuse.length > 0, true);
});

test("corpus graph CLI returns graph", async () => {
  const { root } = await publicCorpusFixture();
  const graph = await executeCli(["corpus", "graph", "--json"], root);
  assert.equal(graph.ok, true);
  assert.equal((graph.data as any).graph.kind, "public_corpus_graph");
});

test("corpus site build creates static files", async () => {
  const { root } = await publicCorpusFixture();
  const site = await executeCli(["corpus", "site", "build", "--json"], root);
  assert.equal(site.ok, true);
  await access(join(root, "public-corpus", "index.html"));
  await access(join(root, "public-corpus", "corpus.json"));
});

test("public corpus static site uses non-legal language", async () => {
  const { root } = await publicCorpusFixture();
  await executeCli(["corpus", "site", "build", "--json"], root);
  const html = await readFile(
    join(root, "public-corpus", "index.html"),
    "utf8",
  );
  assert.match(html, /not a legal patent filing/i);
});

test("public corpus export CLI returns artifact refs", async () => {
  const { root } = await publicCorpusFixture();
  const exported = await executeCli(
    ["corpus", "export-public", "--json"],
    root,
  );
  assert.equal(exported.ok, true);
  assert.equal(
    exported.artifactRefs.includes(".sovryn/corpus/public/index.json"),
    true,
  );
});

test("corpus compare CLI writes comparison artifact", async () => {
  const { root } = await publicCorpusFixture();
  await executeCli(["corpus", "compare", "--json"], root);
  await access(
    join(root, ".sovryn", "corpus", "public", "corpus-compare.json"),
  );
});

test("corpus explain CLI writes last explanation", async () => {
  const { root, factoryId } = await publicCorpusFixture();
  await executeCli(["corpus", "explain", factoryId, "--json"], root);
  await access(join(root, ".sovryn", "corpus", "public", "last-explain.json"));
});

test("CLI help lists public corpus commands", async () => {
  const help = await executeCli(["--help", "--json"]);
  assert.match((help.data as any).help, /corpus export-public/);
  assert.match((help.data as any).help, /corpus site build/);
  assert.match((help.data as any).help, /corpus explain/);
});

test("public corpus release status is included", async () => {
  const { root } = await publicCorpusFixture();
  const index = await readJson(
    join(root, ".sovryn", "corpus", "public", "index.json"),
  );
  assert.equal(index.releaseStatusIncluded, true);
});

test("public corpus curated-only gate sees only allowlisted files", async () => {
  const { root } = await publicCorpusFixture();
  const exported = await executeCli(
    ["corpus", "export-public", "--json"],
    root,
  );
  const gate = (exported.data as any).checks.find(
    (item: any) => item.code === "PUBLIC_CORPUS_CURATED_ONLY",
  );
  assert.equal(gate.passed, true);
});

test("public corpus site build is deterministic by counts", async () => {
  const { root } = await publicCorpusFixture();
  await executeCli(["corpus", "site", "build", "--json"], root);
  const first = await readJson(join(root, "public-corpus", "corpus.json"));
  await executeCli(["corpus", "site", "build", "--json"], root);
  const second = await readJson(join(root, "public-corpus", "corpus.json"));
  assert.equal(first.factoryRunCount, second.factoryRunCount);
  assert.equal(first.sourceCount, second.sourceCount);
});

async function publicCorpusFixture(): Promise<PublicCorpusFixture> {
  fixturePromise ??= createPublicCorpusFixture();
  return fixturePromise;
}

async function createPublicCorpusFixture(): Promise<PublicCorpusFixture> {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const built = await executeCli(
    ["release", "candidates", "build", "--max", "1", "--json"],
    repo.root,
  );
  assert.equal(built.ok, true);
  await executeCli(
    ["invent-open", "A method for reusable corpus memory", "--json"],
    repo.root,
  );
  const exported = await executeCli(
    ["corpus", "export-public", "--json"],
    repo.root,
  );
  assert.equal(exported.ok, true);
  const candidate = (built.data as any).build.candidates[0];
  const sources = await readJson(
    join(repo.root, ".sovryn", "corpus", "public", "sources.json"),
  );
  return {
    root: repo.root,
    factoryId: candidate.factoryId,
    inventionId: candidate.inventionMissionId,
    sourceKey: sources.sources[0].sourceKey,
    exportResult: exported.data as any,
  };
}

function expectedPublicFiles(): string[] {
  return [
    "index.json",
    "inventions.json",
    "sources.json",
    "source-cards.json",
    "claim-features.json",
    "release-candidates.json",
    "quality-scores.json",
    "duplicate-map.public.json",
    "corpus-graph.json",
    "CORPUS_INDEX.md",
    "INVENTIONS.md",
    "SOURCES.md",
    "QUALITY.md",
    "DUPLICATES.md",
    "public-corpus-export.json",
  ];
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readAllText(root: string): Promise<string> {
  const chunks: string[] = [];
  for (const entry of await readdir(root)) {
    const path = join(root, entry);
    const info = await import("node:fs/promises").then((fs) => fs.stat(path));
    if (info.isDirectory()) chunks.push(await readAllText(path));
    else if (info.isFile()) chunks.push(await readFile(path, "utf8"));
  }
  return chunks.join("\n");
}
