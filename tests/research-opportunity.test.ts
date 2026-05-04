import assert from "node:assert/strict";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { normalizeOpportunityConfig } from "../src/core/research/opportunity-engine.js";
import type { ResearchOpportunity } from "../src/core/research/opportunity-types.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

test("research scan generates deterministic opportunities from a broad goal", async () => {
  const { repo } = await initRepo();
  const first = await scan(repo.root);
  const second = await scan(repo.root);
  assert.deepEqual(
    first.scan.opportunities.map(
      (item: ResearchOpportunity) => item.opportunityId,
    ),
    second.scan.opportunities.map(
      (item: ResearchOpportunity) => item.opportunityId,
    ),
  );
  assert.equal(first.scan.kind, "research_opportunity_scan");
});

test("research priority score is normalized", async () => {
  const { repo } = await initRepo();
  const result = await scan(repo.root);
  for (const opportunity of result.scan
    .opportunities as ResearchOpportunity[]) {
    assert.equal(opportunity.priorityScore >= 0, true);
    assert.equal(opportunity.priorityScore <= 100, true);
  }
});

test("high safety risk opportunity is blocked", async () => {
  const { repo } = await initRepo();
  const result = await scan(
    repo.root,
    "Develop malware credential theft automation",
  );
  assert.equal(
    result.scan.opportunities.some(
      (item: ResearchOpportunity) => item.recommendedAction === "block",
    ),
    true,
  );
});

test("duplicate-like opportunity receives duplicate risk", async () => {
  const { repo } = await initRepo();
  await writeJson(join(repo.root, ".sovryn", "inventions", "index.json"), {
    inventions: [
      {
        id: "mis_existing",
        slug: "source-card-trust-scoring",
        title: "Source-card trust scoring",
        status: "draft",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  const result = await scan(repo.root);
  const duplicate = result.scan.opportunities.find(
    (item: ResearchOpportunity) => /Source-card trust scoring/.test(item.title),
  );
  assert.equal((duplicate?.duplicateRisk ?? 0) > 0, true);
});

test("weak factory score generates improvement opportunity", async () => {
  const { repo } = await initRepo();
  await writeFakeFactoryRun(repo.root, {
    blockingReasons: ["Evidence strength score is below threshold."],
  });
  const result = await scan(repo.root);
  assert.equal(
    result.scan.opportunities.some((item: ResearchOpportunity) =>
      item.sourceTypes.includes("factory_score"),
    ),
    true,
  );
});

test("missing prototype gate generates prototype-related opportunity", async () => {
  const { repo } = await initRepo();
  await writeFakeFactoryRun(repo.root, {
    prototypePresent: false,
    blockingReasons: ["Prototype is missing."],
  });
  const result = await scan(repo.root);
  assert.equal(
    result.scan.opportunities.some((item: ResearchOpportunity) =>
      /prototype/i.test(item.title),
    ),
    true,
  );
});

test("counter-evidence generates follow-up opportunity", async () => {
  const { repo } = await initRepo();
  await writeFakeFactoryRun(repo.root, {
    counterEvidence: true,
  });
  const result = await scan(repo.root);
  assert.equal(
    result.scan.opportunities.some((item: ResearchOpportunity) =>
      item.sourceTypes.includes("counter_evidence"),
    ),
    true,
  );
});

test("queue build selects top A-class opportunities", async () => {
  const { repo } = await initRepo();
  const queue = await queueBuild(repo.root);
  assert.equal(queue.queue.selectedForRun.length > 0, true);
  assert.equal(
    queue.queue.selectedForRun.every(
      (entry: any) => entry.priorityClass === "A",
    ),
    true,
  );
});

test("queue build defers B-class opportunities", async () => {
  const { repo } = await initRepo();
  const config = await readJson(join(repo.root, ".sovryn", "config.json"));
  config.research.opportunities.minPriorityScore = 90;
  await writeJson(join(repo.root, ".sovryn", "config.json"), config);
  const queue = await queueBuild(repo.root);
  assert.equal(queue.queue.selectedForRun.length, 0);
  assert.equal(queue.queue.deferred.length > 0, true);
});

test("queue run triggers factory run for selected opportunity", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  const result = await queueRun(repo.root);
  assert.equal(result.queue.completed.length, 1);
  assert.match(result.queue.completed[0].factoryId, /^fac_/);
});

test("queue run does not execute blocked opportunity", async () => {
  const { repo } = await initRepo();
  const build = await queueBuild(
    repo.root,
    "Develop malware credential theft automation",
  );
  const blockedIds = new Set(
    build.queue.blocked.map((item: ResearchOpportunity) => item.opportunityId),
  );
  const result = await queueRun(repo.root);
  assert.equal(
    result.queue.selectedForRun.some(
      (entry: any) => blockedIds.has(entry.opportunityId) && entry.factoryId,
    ),
    false,
  );
});

test("queue run respects maxRuns", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  const result = await queueRun(repo.root, 1);
  assert.equal(result.queue.completed.length, 1);
  assert.equal(
    result.queue.selectedForRun.filter((entry: any) => entry.factoryId).length,
    1,
  );
});

test("queue run writes morning report", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  await queueRun(repo.root);
  await access(
    join(repo.root, ".sovryn", "opportunities", "MORNING_REPORT.md"),
  );
  await access(
    join(repo.root, ".sovryn", "opportunities", "morning-report.json"),
  );
});

test("morning report includes factory IDs", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  const result = await queueRun(repo.root);
  assert.equal(
    result.morningReport.selectedOpportunities.some((item: any) =>
      /^fac_/.test(item.factoryId ?? ""),
    ),
    true,
  );
});

test("opportunity review returns rationale", async () => {
  const { repo } = await initRepo();
  const build = await queueBuild(repo.root);
  const id = build.queue.opportunities[0].opportunityId;
  const review = await executeCli(
    ["research", "opportunity", "review", id, "--json"],
    repo.root,
  );
  assert.equal(review.ok, true);
  assert.equal(
    ((review.data as any).opportunity.rationale as string[]).length > 0,
    true,
  );
});

test("malformed opportunity config is clamped safely", () => {
  const normalized = normalizeOpportunityConfig({
    enabled: "true" as any,
    maxCandidates: 999,
    minPriorityScore: -5,
    maxQueueRuns: 999,
    blockHighSafetyRisk: "false" as any,
  });
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.maxCandidates, 25);
  assert.equal(normalized.minPriorityScore, 0);
  assert.equal(normalized.maxQueueRuns, 10);
  assert.equal(normalized.blockHighSafetyRisk, true);
});

test("fixture public search mode requires no network and creates public-source signals", async () => {
  const { repo } = await initRepo();
  const config = await readJson(join(repo.root, ".sovryn", "config.json"));
  config.research.publicSearch.fixtureMode = true;
  await writeJson(join(repo.root, ".sovryn", "config.json"), config);
  const result = await scan(repo.root);
  assert.equal(result.scan.sourceSummary.publicSourceSignalCount > 0, true);
});

test("previous inventions influence duplicate risk", async () => {
  const { repo } = await initRepo();
  await writeJson(join(repo.root, ".sovryn", "inventions", "index.json"), {
    inventions: [
      {
        id: "mis_prior",
        slug: "reproducible-research-replay",
        title: "Reproducible research replay",
        status: "draft",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  const result = await scan(repo.root);
  const replay = result.scan.opportunities.find((item: ResearchOpportunity) =>
    /Reproducible research replay/.test(item.title),
  );
  assert.equal((replay?.duplicateRisk ?? 0) > 0, true);
});

test("previous factory runs influence opportunity source types", async () => {
  const { repo } = await initRepo();
  await writeFakeFactoryRun(repo.root, {});
  const result = await scan(repo.root);
  assert.equal(
    result.scan.opportunities.some(
      (item: ResearchOpportunity) =>
        item.relatedFactoryRuns.includes("fac_existing") &&
        item.sourceTypes.includes("factory_score"),
    ),
    true,
  );
});

test("CLI research scan returns stable JSON", async () => {
  const { repo } = await initRepo();
  const result = await executeCli(
    ["research", "scan", "--goal", "Improve autonomous research", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal(result.command, "research");
  assert.equal((result.data as any).scan.kind, "research_opportunity_scan");
});

test("CLI research queue build returns stable JSON", async () => {
  const { repo } = await initRepo();
  const result = await executeCli(
    [
      "research",
      "queue",
      "build",
      "--goal",
      "Improve autonomous research",
      "--json",
    ],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).queue.kind, "research_queue");
});

test("CLI research queue status returns stable JSON", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  const result = await executeCli(
    ["research", "queue", "status", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).queue.kind, "research_queue");
});

test("CLI research queue run returns stable JSON", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  const result = await executeCli(
    ["research", "queue", "run", "--max-runs", "1", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal(
    (result.data as any).morningReport.kind,
    "research_morning_report",
  );
});

test("opportunity gates block missing queue evidence", async () => {
  const { repo } = await initRepo();
  const scanResult = await scan(repo.root);
  const id = scanResult.scan.opportunities[0].opportunityId;
  const review = await executeCli(
    ["research", "opportunity", "review", id, "--json"],
    repo.root,
  );
  assert.equal(review.ok, true);
  assert.equal(
    checkPassed(review.data as any, "RESEARCH_QUEUE_PRESENT"),
    false,
  );
});

test("factory public release does not include private opportunity internals", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  const run = await queueRun(repo.root);
  const factoryId = run.queue.completed[0].factoryId;
  const packaged = await executeCli(
    ["factory", "package", factoryId, "--json"],
    repo.root,
  );
  assert.equal(packaged.ok, true);
  const releaseFiles = await readdir((packaged.data as any).releasePath);
  assert.equal(releaseFiles.includes("opportunity-scan.json"), false);
  assert.equal(releaseFiles.includes("research-queue.json"), false);
});

test("research morning-report command regenerates report", async () => {
  const { repo } = await initRepo();
  await queueBuild(repo.root);
  await queueRun(repo.root);
  const result = await executeCli(
    ["research", "morning-report", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal(
    (result.data as any).morningReport.kind,
    "research_morning_report",
  );
});

test("CLI help lists research queue commands", async () => {
  const result = await executeCli(["--help"]);
  assert.equal(result.ok, true);
  assert.match((result.data as any).help, /research queue build/);
  assert.match((result.data as any).help, /research morning-report/);
});

async function initRepo() {
  const repo = await makeTempRepo();
  const init = await executeCli(["init", "--json"], repo.root);
  assert.equal(init.ok, true);
  return { repo };
}

async function scan(
  root: string,
  goal = "Improve autonomous open-source research agents",
) {
  const result = await executeCli(
    ["research", "scan", "--goal", goal, "--json"],
    root,
  );
  assert.equal(result.ok, true);
  return result.data as any;
}

async function queueBuild(
  root: string,
  goal = "Improve autonomous open-source research agents",
) {
  const result = await executeCli(
    ["research", "queue", "build", "--goal", goal, "--json"],
    root,
  );
  assert.equal(result.ok, true);
  return result.data as any;
}

async function queueRun(root: string, maxRuns = 1) {
  const result = await executeCli(
    ["research", "queue", "run", "--max-runs", String(maxRuns), "--json"],
    root,
  );
  assert.equal(result.ok, true);
  return result.data as any;
}

async function writeFakeFactoryRun(
  root: string,
  options: {
    prototypePresent?: boolean;
    blockingReasons?: string[];
    counterEvidence?: boolean;
  },
): Promise<void> {
  const factoryRoot = join(root, ".sovryn", "factory");
  const factoryDir = join(factoryRoot, "existing-run");
  await mkdir(factoryDir, { recursive: true });
  await writeJson(join(factoryRoot, "index.json"), {
    factoryRuns: [
      {
        id: "fac_existing",
        slug: "existing-run",
        researchGoal: "Improve autonomous research evidence",
        status: "degraded",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  await writeJson(join(factoryDir, "factory-score.json"), {
    kind: "factory_score",
    concreteSourcesFound: 0,
    evidenceStrengthScore: 35,
    noveltyRiskScore: 45,
    reproducibilityScore: 50,
    prototypePresent: options.prototypePresent ?? true,
    testsPresent: true,
    blockingReasons: options.blockingReasons ?? [],
    evidenceHash: "fake-score",
  });
  if (options.counterEvidence) {
    await writeJson(join(factoryDir, "counter-evidence.json"), {
      kind: "factory_counter_evidence",
      items: [
        {
          itemId: "counter-1",
          sourceCardId: "source-1",
          claimFeatureId: "source-feature-1",
          overlapDescription: "Source already covers basic evidence scoring.",
          riskLevel: "high",
          recommendedAction: "Search for a stronger differentiator.",
        },
      ],
      evidenceHash: "fake-counter",
    });
  }
}

function checkPassed(review: any, code: string): boolean {
  return (
    review.checks.find((check: any) => check.code === code)?.passed ?? false
  );
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
