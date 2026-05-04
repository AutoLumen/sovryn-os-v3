import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import type { SovrynConfig } from "../src/core/config.js";
import {
  adapterDoctor,
  normalizeResearchCacheConfig,
  pruneResearchCache,
  researchCacheStatus,
  searchPublicSourcesWithCache,
} from "../src/core/research/research-cache.js";
import type {
  PriorArtSearchAdapter,
  PriorArtSearchResult,
} from "../src/core/invention/providers.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

test("research cache config clamps malformed values", () => {
  const config = baseConfig({
    cacheTtlHours: -1,
    retryAttempts: 99,
    retryBaseDelayMs: 99_999,
    cacheEnabled: "yes" as any,
    offlineReplay: "true" as any,
  });
  const normalized = normalizeResearchCacheConfig(config);
  assert.equal(normalized.cacheEnabled, true);
  assert.equal(normalized.cacheTtlHours, 1);
  assert.equal(normalized.retryAttempts, 5);
  assert.equal(normalized.retryBaseDelayMs, 5000);
  assert.equal(normalized.offlineReplay, false);
});

test("public-source search writes cache on first run", async () => {
  const repo = await makeTempRepo();
  const result = await cachedSearch(repo.root);
  assert.equal(result.cacheHit, false);
  await access(
    join(
      repo.root,
      ".sovryn",
      "research-cache",
      "search",
      `${result.cacheKey}.json`,
    ),
  );
});

test("public-source search replays fresh cache on second run", async () => {
  const repo = await makeTempRepo();
  await cachedSearch(repo.root);
  const second = await cachedSearch(repo.root, {
    search: async () => [result("adapter_failure", "web", "unexpected")],
  });
  assert.equal(second.cacheHit, true);
  assert.equal(second.results[0].title, "github source");
});

test("source dedupe report removes duplicate URLs", async () => {
  const repo = await makeTempRepo();
  const duplicate = result(
    "concrete_source",
    "github",
    "dupe",
    "https://example.test/a",
  );
  const search = await cachedSearch(repo.root, {
    search: async () => [duplicate, duplicate],
  });
  assert.equal(search.dedupe.inputCount, 2);
  assert.equal(search.dedupe.outputCount, 1);
  assert.equal(search.dedupe.duplicateCount, 1);
});

test("source quality report scores concrete GitHub sources strongly", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root);
  const github = search.quality.sources.find(
    (source) => source.sourceType === "github",
  );
  assert.equal(github?.qualityClass, "strong");
});

test("query links stay weak quality and not concrete evidence", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root);
  const query = search.quality.sources.find(
    (source) => source.kind === "query_link",
  );
  assert.equal(query?.qualityClass, "weak");
});

test("adapter failures produce degraded quality", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [result("adapter_failure", "web", "failure")],
  });
  assert.equal(search.quality.sources[0].qualityClass, "degraded");
});

test("rate-limit report records rate-limit-like failures", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [
      {
        ...result("adapter_failure", "web", "rate limited"),
        note: "HTTP 429 rate limit",
      },
    ],
  });
  assert.equal(search.rateLimits.events.length, 1);
});

test("adapter doctor reads latest reports", async () => {
  const repo = await makeTempRepo();
  await cachedSearch(repo.root);
  const doctor = await adapterDoctor(repo.root);
  assert.equal(doctor.health?.kind, "public_source_adapter_health");
  assert.equal(doctor.quality?.kind, "public_source_quality_report");
});

test("research cache status lists entries", async () => {
  const repo = await makeTempRepo();
  await cachedSearch(repo.root);
  const status = await researchCacheStatus(repo.root);
  assert.equal(status.entries.length, 1);
});

test("research cache prune removes expired entries", async () => {
  const repo = await makeTempRepo();
  await mkdir(join(repo.root, ".sovryn", "research-cache", "search"), {
    recursive: true,
  });
  await writeJson(
    join(repo.root, ".sovryn", "research-cache", "search", "expired.json"),
    {
      kind: "cached_public_source_search",
      cacheKey: "expired",
      query: { brief: "expired", sources: ["web"] },
      createdAt: "2020-01-01T00:00:00.000Z",
      expiresAt: "2020-01-02T00:00:00.000Z",
      resultCount: 0,
      results: [],
      evidenceHash: "expired",
    },
  );
  const pruned = await pruneResearchCache(repo.root);
  assert.equal(pruned.removedEntries, 1);
});

test("offline replay uses stale cache when configured", async () => {
  const repo = await makeTempRepo();
  await cachedSearch(repo.root);
  const replay = await searchPublicSourcesWithCache({
    root: repo.root,
    config: baseConfig({ offlineReplay: true }),
    query: query(),
    adapter: {
      search: async () => [result("adapter_failure", "web", "network")],
    },
  });
  assert.equal(replay.cacheHit, true);
  assert.equal(replay.health.status, "offline_replay");
});

test("offline replay cache miss returns degraded adapter failure", async () => {
  const repo = await makeTempRepo();
  const replay = await searchPublicSourcesWithCache({
    root: repo.root,
    config: baseConfig({ offlineReplay: true }),
    query: query("uncached"),
    adapter: { search: async () => [concrete()] },
  });
  assert.equal(replay.results[0].kind, "adapter_failure");
  assert.equal(replay.health.status, "offline_replay");
});

test("retry succeeds after transient adapter failure", async () => {
  const repo = await makeTempRepo();
  let attempts = 0;
  const search = await searchPublicSourcesWithCache({
    root: repo.root,
    config: baseConfig({ retryAttempts: 2, retryBaseDelayMs: 0 }),
    query: query("retry"),
    adapter: {
      search: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("temporary");
        return [concrete()];
      },
    },
  });
  assert.equal(search.results[0].kind, "concrete_source");
  assert.equal(search.health.retryAttempts, 1);
});

test("retry exhaustion creates adapter failure", async () => {
  const repo = await makeTempRepo();
  const search = await searchPublicSourcesWithCache({
    root: repo.root,
    config: baseConfig({ retryAttempts: 1, retryBaseDelayMs: 0 }),
    query: query("retry exhausted"),
    adapter: {
      search: async () => {
        throw new Error("permanent");
      },
    },
  });
  assert.equal(search.results[0].kind, "adapter_failure");
  assert.equal(search.health.adapterFailureCount, 1);
});

test("factory run in fixture mode writes adapter reports", async () => {
  const { root } = await factoryFixtureRun();
  await access(join(root, ".sovryn", "adapters", "adapter-health.json"));
  await access(join(root, ".sovryn", "adapters", "source-quality-report.json"));
});

test("factory run --real-sources preserves fixture mode and writes cache", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const config = await readJson(join(repo.root, ".sovryn", "config.json"));
  config.research.publicSearch.fixtureMode = true;
  await writeJson(join(repo.root, ".sovryn", "config.json"), config);
  const run = await executeCli(
    ["factory", "run", "Real source fixture run", "--real-sources", "--json"],
    repo.root,
  );
  assert.equal(run.ok, true);
  const status = await researchCacheStatus(repo.root);
  assert.equal(status.entries.length > 0, true);
});

test("research adapters doctor CLI returns stable JSON", async () => {
  const { root } = await factoryFixtureRun();
  const doctor = await executeCli(
    ["research", "adapters", "doctor", "--json"],
    root,
  );
  assert.equal(doctor.ok, true);
  assert.equal(
    (doctor.data as any).health.kind,
    "public_source_adapter_health",
  );
});

test("research cache status CLI returns stable JSON", async () => {
  const { root } = await factoryFixtureRun();
  const status = await executeCli(
    ["research", "cache", "status", "--json"],
    root,
  );
  assert.equal(status.ok, true);
  assert.equal(Array.isArray((status.data as any).entries), true);
});

test("research cache prune CLI returns stable JSON", async () => {
  const { root } = await factoryFixtureRun();
  const pruned = await executeCli(
    ["research", "cache", "prune", "--json"],
    root,
  );
  assert.equal(pruned.ok, true);
  assert.equal(typeof (pruned.data as any).removedEntries, "number");
});

test("CLI help lists research adapter and cache commands", async () => {
  const help = await executeCli(["--help"]);
  assert.match((help.data as any).help, /research adapters doctor/);
  assert.match((help.data as any).help, /research cache status/);
});

test("source dedupe report is persisted", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root);
  const persisted = await readJson(
    join(repo.root, ".sovryn", "adapters", "source-dedupe-report.json"),
  );
  assert.equal(persisted.evidenceHash, search.dedupe.evidenceHash);
});

test("source quality report average drops when query links are present", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root);
  assert.equal(search.quality.averageQualityScore < 100, true);
});

test("cache evidence is hash-bound", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root);
  const cached = await readJson(
    join(
      repo.root,
      ".sovryn",
      "research-cache",
      "search",
      `${search.cacheKey}.json`,
    ),
  );
  assert.equal(cached.evidenceHash.length, 64);
});

test("research cache status writes cache index", async () => {
  const repo = await makeTempRepo();
  await cachedSearch(repo.root);
  await researchCacheStatus(repo.root);
  await access(join(repo.root, ".sovryn", "research-cache", "index.json"));
});

test("adapter health report does not expose token-like text", async () => {
  const repo = await makeTempRepo();
  await cachedSearch(repo.root);
  const raw = await readFile(
    join(repo.root, ".sovryn", "adapters", "adapter-health.json"),
    "utf8",
  );
  assert.doesNotMatch(raw, /SOVRYN_GITHUB_TOKEN|sk-[A-Za-z0-9]/);
});

test("rate-limit events report is persisted", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [
      {
        ...result("adapter_failure", "web", "rate limited"),
        note: "403 rate limit",
      },
    ],
  });
  const persisted = await readJson(
    join(repo.root, ".sovryn", "adapters", "rate-limit-events.json"),
  );
  assert.equal(persisted.evidenceHash, search.rateLimits.evidenceHash);
});

test("cache disabled still writes adapter reports but not cache entries", async () => {
  const repo = await makeTempRepo();
  await searchPublicSourcesWithCache({
    root: repo.root,
    config: baseConfig({ cacheEnabled: false }),
    query: query("no cache"),
    adapter: fixtureAdapter(),
  });
  await access(join(repo.root, ".sovryn", "adapters", "adapter-health.json"));
  const status = await researchCacheStatus(repo.root);
  assert.equal(status.entries.length, 0);
});

test("source quality keeps mock placeholders low", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [result("mock_placeholder", "web", "mock")],
  });
  assert.equal(search.quality.sources[0].qualityClass, "degraded");
});

test("adapter health status is mock for mock placeholders", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [result("mock_placeholder", "web", "mock")],
  });
  assert.equal(search.health.status, "mock");
});

test("adapter health status is degraded for adapter failures", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [result("adapter_failure", "web", "failure")],
  });
  assert.equal(search.health.status, "degraded");
});

test("adapter health status is ok for concrete-only sources", async () => {
  const repo = await makeTempRepo();
  const search = await cachedSearch(repo.root, {
    search: async () => [concrete()],
  });
  assert.equal(search.health.status, "ok");
});

async function factoryFixtureRun(): Promise<{ root: string }> {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const config = await readJson(join(repo.root, ".sovryn", "config.json"));
  config.research.publicSearch.fixtureMode = true;
  config.research.sourceReading.fixtureMode = true;
  await writeJson(join(repo.root, ".sovryn", "config.json"), config);
  const run = await executeCli(
    ["factory", "run", "Fixture robust source research", "--json"],
    repo.root,
  );
  assert.equal(run.ok, true);
  return { root: repo.root };
}

async function cachedSearch(
  root: string,
  adapter: PriorArtSearchAdapter = fixtureAdapter(),
) {
  return searchPublicSourcesWithCache({
    root,
    config: baseConfig(),
    query: query(),
    adapter,
  });
}

function fixtureAdapter(): PriorArtSearchAdapter {
  return {
    search: async () => [
      concrete(),
      result(
        "query_link",
        "patent",
        "patent search",
        "https://example.test/patents",
      ),
    ],
  };
}

function concrete(): PriorArtSearchResult {
  return result(
    "concrete_source",
    "github",
    "github source",
    "https://example.test/repo",
  );
}

function result(
  kind: PriorArtSearchResult["kind"],
  sourceType: PriorArtSearchResult["sourceType"],
  title: string,
  url: string | null = null,
): PriorArtSearchResult {
  return {
    kind,
    title,
    sourceType,
    url,
    relevance: kind === "concrete_source" ? "high" : "medium",
    overlap: "overlap",
    difference: "difference",
    citation: kind === "concrete_source" ? `Citation for ${title}` : null,
    note: `${kind} note`,
  };
}

function query(brief = "robust source research") {
  return {
    brief,
    sources: ["web", "github", "papers", "standards", "patents"] as Array<
      "web" | "github" | "papers" | "standards" | "patents"
    >,
  };
}

function baseConfig(overrides: Record<string, unknown> = {}): SovrynConfig {
  return {
    version: 1,
    runner: { default: "fake", command: "fake", args: [] },
    git: {
      useWorktrees: true,
      worktreeRoot: ".sovryn/worktrees",
      baseBranch: "main",
      branchPrefix: "sovryn/",
    },
    verify: { commands: "auto" },
    policy: {
      maxChangedFiles: 20,
      maxChangedLines: 1000,
      blockedPaths: [],
      sensitivePaths: [],
      autoFinalizeRisk: "low",
      requireApprovalForRisk: ["medium", "high", "critical"],
      requireReviewBeforeFinalize: true,
      allowNetwork: false,
    },
    storage: { driver: "file" },
    output: { truncateOutputChars: 12000 },
    research: {
      requireConcretePriorArtForPublish: false,
      publicSearch: {
        enabled: true,
        maxResultsPerSource: 3,
        maxTotalResults: 30,
        timeoutMs: 8000,
        includeQueryLinks: true,
        githubTokenEnv: null,
        fixtureMode: false,
        fixturePath: null,
        cacheEnabled: true,
        cacheTtlHours: 168,
        retryAttempts: 2,
        retryBaseDelayMs: 0,
        offlineReplay: false,
        ...overrides,
      },
      sourceReading: {
        enabled: false,
        timeoutMs: 8000,
        maxReadBytes: 20000,
        githubTokenEnv: null,
      },
    },
  };
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
