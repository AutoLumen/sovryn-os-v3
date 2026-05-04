import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import type { SovrynConfig } from "../config.js";
import { hashEvidence } from "../invention/pipeline.js";
import {
  createPriorArtSearchAdapter,
  summarizePriorArtSearchResults,
  type PriorArtSearchAdapter,
  type PriorArtSearchQuery,
  type PriorArtSearchResult,
} from "../invention/providers.js";

export type ResearchCacheConfig = {
  cacheEnabled: boolean;
  cacheTtlHours: number;
  retryAttempts: number;
  retryBaseDelayMs: number;
  offlineReplay: boolean;
};

export type CachedSearchEvidence = {
  kind: "cached_public_source_search";
  cacheKey: string;
  query: PriorArtSearchQuery;
  createdAt: string;
  expiresAt: string;
  resultCount: number;
  results: PriorArtSearchResult[];
  evidenceHash: string;
};

export type AdapterHealthReport = {
  kind: "public_source_adapter_health";
  checkedAt: string;
  status: "ok" | "degraded" | "offline_replay" | "mock";
  cacheHit: boolean;
  retryAttempts: number;
  concreteResultCount: number;
  queryLinkCount: number;
  adapterFailureCount: number;
  mockPlaceholderCount: number;
  limitations: string[];
  evidenceHash: string;
};

export type SourceDedupeReport = {
  kind: "public_source_dedupe_report";
  createdAt: string;
  inputCount: number;
  outputCount: number;
  duplicateCount: number;
  duplicateKeys: string[];
  evidenceHash: string;
};

export type SourceQualityReport = {
  kind: "public_source_quality_report";
  createdAt: string;
  sourceCount: number;
  averageQualityScore: number;
  sources: Array<{
    title: string;
    sourceType: string;
    kind: PriorArtSearchResult["kind"];
    qualityScore: number;
    qualityClass: "strong" | "moderate" | "weak" | "degraded";
    reasons: string[];
  }>;
  evidenceHash: string;
};

export type RateLimitReport = {
  kind: "public_source_rate_limit_events";
  createdAt: string;
  events: Array<{
    title: string;
    sourceType: string;
    note: string;
  }>;
  evidenceHash: string;
};

export type CachedSearchResult = {
  results: PriorArtSearchResult[];
  cacheHit: boolean;
  cacheKey: string;
  health: AdapterHealthReport;
  dedupe: SourceDedupeReport;
  quality: SourceQualityReport;
  rateLimits: RateLimitReport;
};

export async function searchPublicSourcesWithCache(input: {
  root: string;
  config: SovrynConfig;
  query: PriorArtSearchQuery;
  adapter?: PriorArtSearchAdapter;
}): Promise<CachedSearchResult> {
  const settings = normalizeResearchCacheConfig(input.config);
  const cacheKey = cacheKeyFor(input.query);
  await mkdir(cacheRoot(input.root), { recursive: true });
  await mkdir(adapterRoot(input.root), { recursive: true });
  const cached = settings.cacheEnabled
    ? await readFreshCache(input.root, cacheKey, settings).catch(() => null)
    : null;
  if (cached) {
    return writeReports({
      root: input.root,
      query: input.query,
      cacheKey,
      results: cached.results,
      cacheHit: true,
      retryAttempts: 0,
      offlineReplay: settings.offlineReplay,
    });
  }
  if (settings.offlineReplay) {
    const stale = await readAnyCache(input.root, cacheKey).catch(() => null);
    return writeReports({
      root: input.root,
      query: input.query,
      cacheKey,
      results: stale?.results ?? [
        {
          kind: "adapter_failure",
          title: "offline replay cache miss",
          sourceType: "web",
          url: null,
          relevance: "low",
          overlap: "No cached public-source result was available.",
          difference:
            "Offline replay cannot create concrete source evidence without prior cache.",
          citation: null,
          note: "offline replay cache miss",
        },
      ],
      cacheHit: stale !== null,
      retryAttempts: 0,
      offlineReplay: true,
    });
  }
  const adapter = input.adapter ?? createPriorArtSearchAdapter(input.config);
  let lastError: unknown = null;
  let results: PriorArtSearchResult[] = [];
  let attempts = 0;
  for (let attempt = 0; attempt <= settings.retryAttempts; attempt += 1) {
    attempts = attempt;
    try {
      results = await adapter.search(input.query);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < settings.retryAttempts) {
        await delay(settings.retryBaseDelayMs * (attempt + 1));
      }
    }
  }
  if (lastError) {
    results = [
      {
        kind: "adapter_failure",
        title: "public source adapter failed",
        sourceType: "web",
        url: null,
        relevance: "low",
        overlap: "No source evidence was retrieved.",
        difference: "Retry or use fixture/cache replay for deterministic runs.",
        citation: null,
        note:
          lastError instanceof Error ? lastError.message : String(lastError),
      },
    ];
  }
  const deduped = dedupeResults(results).results;
  if (settings.cacheEnabled) {
    await writeCache(input.root, cacheKey, input.query, deduped, settings);
  }
  return writeReports({
    root: input.root,
    query: input.query,
    cacheKey,
    results,
    cacheHit: false,
    retryAttempts: attempts,
    offlineReplay: false,
  });
}

export async function researchCacheStatus(root: string): Promise<{
  cachePath: string;
  entries: Array<{
    cacheKey: string;
    path: string;
    resultCount: number;
    createdAt: string;
    expiresAt: string;
  }>;
  artifactRefs: string[];
}> {
  await mkdir(cacheRoot(root), { recursive: true });
  const entries = [];
  for (const file of await readdir(cacheRoot(root)).catch(() => [])) {
    if (!file.endsWith(".json")) continue;
    const evidence = await readJson<CachedSearchEvidence>(
      join(cacheRoot(root), file),
    ).catch(() => null);
    if (!evidence) continue;
    entries.push({
      cacheKey: evidence.cacheKey,
      path: join(".sovryn", "research-cache", "search", file),
      resultCount: evidence.resultCount,
      createdAt: evidence.createdAt,
      expiresAt: evidence.expiresAt,
    });
  }
  entries.sort((a, b) => a.cacheKey.localeCompare(b.cacheKey));
  await writeJson(join(root, ".sovryn", "research-cache", "index.json"), {
    kind: "research_cache_index",
    updatedAt: nowIso(),
    entries,
    evidenceHash: hashEvidence(entries),
  });
  return {
    cachePath: cacheRoot(root),
    entries,
    artifactRefs: [join(".sovryn", "research-cache", "index.json")],
  };
}

export async function pruneResearchCache(root: string): Promise<{
  removedEntries: number;
  artifactRefs: string[];
}> {
  const status = await researchCacheStatus(root);
  let removedEntries = 0;
  for (const entry of status.entries) {
    if (Date.parse(entry.expiresAt) < Date.now()) {
      await rm(join(root, entry.path), { force: true });
      removedEntries += 1;
    }
  }
  await researchCacheStatus(root);
  return {
    removedEntries,
    artifactRefs: [join(".sovryn", "research-cache", "index.json")],
  };
}

export async function adapterDoctor(root: string): Promise<{
  health: AdapterHealthReport | null;
  dedupe: SourceDedupeReport | null;
  quality: SourceQualityReport | null;
  rateLimits: RateLimitReport | null;
  artifactRefs: string[];
}> {
  await mkdir(adapterRoot(root), { recursive: true });
  return {
    health: await readJson<AdapterHealthReport>(
      join(adapterRoot(root), "adapter-health.json"),
    ).catch(() => null),
    dedupe: await readJson<SourceDedupeReport>(
      join(adapterRoot(root), "source-dedupe-report.json"),
    ).catch(() => null),
    quality: await readJson<SourceQualityReport>(
      join(adapterRoot(root), "source-quality-report.json"),
    ).catch(() => null),
    rateLimits: await readJson<RateLimitReport>(
      join(adapterRoot(root), "rate-limit-events.json"),
    ).catch(() => null),
    artifactRefs: [
      join(".sovryn", "adapters", "adapter-health.json"),
      join(".sovryn", "adapters", "source-dedupe-report.json"),
      join(".sovryn", "adapters", "source-quality-report.json"),
      join(".sovryn", "adapters", "rate-limit-events.json"),
    ],
  };
}

export function normalizeResearchCacheConfig(
  config: SovrynConfig,
): ResearchCacheConfig {
  const settings = config.research?.publicSearch;
  return {
    cacheEnabled: boolOrDefault(settings?.cacheEnabled, true),
    cacheTtlHours: clampInt(settings?.cacheTtlHours, 168, 1, 24 * 90),
    retryAttempts: clampInt(settings?.retryAttempts, 2, 0, 5),
    retryBaseDelayMs: clampInt(settings?.retryBaseDelayMs, 100, 0, 5000),
    offlineReplay: boolOrDefault(settings?.offlineReplay, false),
  };
}

function writeReports(input: {
  root: string;
  query: PriorArtSearchQuery;
  cacheKey: string;
  results: PriorArtSearchResult[];
  cacheHit: boolean;
  retryAttempts: number;
  offlineReplay: boolean;
}): Promise<CachedSearchResult> {
  const dedupe = dedupeResults(input.results);
  const summary = summarizePriorArtSearchResults(dedupe.results);
  const health = withHash<AdapterHealthReport>({
    kind: "public_source_adapter_health",
    checkedAt: nowIso(),
    status: input.offlineReplay
      ? "offline_replay"
      : summary.mockPlaceholderCount > 0
        ? "mock"
        : summary.failureCount > 0
          ? "degraded"
          : "ok",
    cacheHit: input.cacheHit,
    retryAttempts: input.retryAttempts,
    concreteResultCount: summary.concreteResultCount,
    queryLinkCount: summary.linkOnlyResultCount,
    adapterFailureCount: summary.failureCount,
    mockPlaceholderCount: summary.mockPlaceholderCount,
    limitations: [
      ...(input.cacheHit ? ["Results were replayed from cache."] : []),
      ...(input.offlineReplay
        ? ["Offline replay does not perform network source discovery."]
        : []),
      ...(summary.failureCount > 0
        ? ["One or more adapters failed or were unavailable."]
        : []),
    ],
    evidenceHash: "",
  });
  const quality = buildQualityReport(dedupe.results);
  const rateLimits = buildRateLimitReport(dedupe.results);
  return writeAdapterReports(
    input.root,
    health,
    dedupe,
    quality,
    rateLimits,
  ).then(() => ({
    results: dedupe.results,
    cacheHit: input.cacheHit,
    cacheKey: input.cacheKey,
    health,
    dedupe,
    quality,
    rateLimits,
  }));
}

function dedupeResults(results: PriorArtSearchResult[]): SourceDedupeReport & {
  results: PriorArtSearchResult[];
} {
  const seen = new Set<string>();
  const duplicateKeys: string[] = [];
  const output: PriorArtSearchResult[] = [];
  for (const result of results) {
    const key =
      `${result.kind}:${result.sourceType}:${result.url ?? result.title}`.toLowerCase();
    if (seen.has(key)) {
      duplicateKeys.push(key);
      continue;
    }
    seen.add(key);
    output.push(result);
  }
  return withHash({
    kind: "public_source_dedupe_report",
    createdAt: nowIso(),
    inputCount: results.length,
    outputCount: output.length,
    duplicateCount: duplicateKeys.length,
    duplicateKeys,
    results: output,
    evidenceHash: "",
  });
}

function buildQualityReport(
  results: PriorArtSearchResult[],
): SourceQualityReport {
  const sources = results.map((result) => {
    const qualityScore = qualityScoreFor(result);
    const qualityClass: "strong" | "moderate" | "weak" | "degraded" =
      qualityScore >= 80
        ? "strong"
        : qualityScore >= 60
          ? "moderate"
          : qualityScore >= 30
            ? "weak"
            : "degraded";
    return {
      title: result.title,
      sourceType: result.sourceType,
      kind: result.kind,
      qualityScore,
      qualityClass,
      reasons: qualityReasons(result),
    };
  });
  return withHash({
    kind: "public_source_quality_report",
    createdAt: nowIso(),
    sourceCount: results.length,
    averageQualityScore:
      sources.length === 0
        ? 0
        : Math.round(
            sources.reduce((sum, source) => sum + source.qualityScore, 0) /
              sources.length,
          ),
    sources,
    evidenceHash: "",
  });
}

function buildRateLimitReport(
  results: PriorArtSearchResult[],
): RateLimitReport {
  return withHash({
    kind: "public_source_rate_limit_events",
    createdAt: nowIso(),
    events: results
      .filter((result) => /rate|limit|429|403/i.test(result.note))
      .map((result) => ({
        title: result.title,
        sourceType: result.sourceType,
        note: result.note,
      })),
    evidenceHash: "",
  });
}

async function writeAdapterReports(
  root: string,
  health: AdapterHealthReport,
  dedupe: SourceDedupeReport,
  quality: SourceQualityReport,
  rateLimits: RateLimitReport,
): Promise<void> {
  await mkdir(adapterRoot(root), { recursive: true });
  await writeJson(join(adapterRoot(root), "adapter-health.json"), health);
  await writeJson(join(adapterRoot(root), "source-dedupe-report.json"), dedupe);
  await writeJson(
    join(adapterRoot(root), "source-quality-report.json"),
    quality,
  );
  await writeJson(
    join(adapterRoot(root), "rate-limit-events.json"),
    rateLimits,
  );
}

async function readFreshCache(
  root: string,
  cacheKey: string,
  settings: ResearchCacheConfig,
): Promise<CachedSearchEvidence | null> {
  const evidence = await readAnyCache(root, cacheKey);
  if (Date.parse(evidence.expiresAt) < Date.now() && !settings.offlineReplay) {
    return null;
  }
  return evidence;
}

async function readAnyCache(
  root: string,
  cacheKey: string,
): Promise<CachedSearchEvidence> {
  return readJson<CachedSearchEvidence>(
    join(cacheRoot(root), `${cacheKey}.json`),
  );
}

async function writeCache(
  root: string,
  cacheKey: string,
  query: PriorArtSearchQuery,
  results: PriorArtSearchResult[],
  settings: ResearchCacheConfig,
): Promise<void> {
  const createdAt = nowIso();
  const expiresAt = new Date(
    Date.now() + settings.cacheTtlHours * 60 * 60 * 1000,
  ).toISOString();
  const evidence = withHash<CachedSearchEvidence>({
    kind: "cached_public_source_search",
    cacheKey,
    query,
    createdAt,
    expiresAt,
    resultCount: results.length,
    results,
    evidenceHash: "",
  });
  await writeJson(join(cacheRoot(root), `${cacheKey}.json`), evidence);
}

function cacheKeyFor(query: PriorArtSearchQuery): string {
  return hashEvidence({
    brief: query.brief,
    sources: [...query.sources].sort(),
  }).slice(0, 24);
}

function qualityScoreFor(result: PriorArtSearchResult): number {
  if (result.kind === "adapter_failure") return 5;
  if (result.kind === "mock_placeholder") return 15;
  if (result.kind === "query_link") return 30;
  const relevance =
    result.relevance === "high" ? 35 : result.relevance === "medium" ? 25 : 15;
  const sourceType =
    result.sourceType === "github" || result.sourceType === "paper" ? 35 : 25;
  const citation = result.citation ? 15 : 5;
  const url = result.url ? 15 : 0;
  return Math.min(100, relevance + sourceType + citation + url);
}

function qualityReasons(result: PriorArtSearchResult): string[] {
  return [
    `${result.kind} result`,
    `${result.relevance} relevance`,
    result.citation ? "citation present" : "citation missing",
    result.url ? "url present" : "url missing",
    ...(result.kind === "query_link"
      ? ["query links are research leads, not concrete prior art"]
      : []),
    ...(result.kind === "adapter_failure" ? ["adapter failure"] : []),
  ];
}

function cacheRoot(root: string): string {
  return join(root, ".sovryn", "research-cache", "search");
}

function adapterRoot(root: string): string {
  return join(root, ".sovryn", "adapters");
}

function clampInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed =
    typeof value === "number" && Number.isFinite(value)
      ? Math.trunc(value)
      : fallback;
  return Math.min(max, Math.max(min, parsed));
}

function boolOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function withHash<T extends { evidenceHash: string }>(value: T): T {
  value.evidenceHash = hashEvidence({ ...value, evidenceHash: "" });
  return value;
}

function delay(ms: number): Promise<void> {
  return ms <= 0
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, ms));
}
