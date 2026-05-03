import type { SovrynConfig } from "../config.js";
import type { PriorArtMatrixItem } from "./invention-types.js";
import { hashEvidence } from "./pipeline.js";
import type { FetchLike, PriorArtSearchResult } from "./providers.js";

export type SourceReadStatus =
  | "read"
  | "skipped"
  | "unsupported"
  | "failed"
  | "disabled";

export type SourceReadingNoveltyRisk = "low" | "medium" | "high" | "unknown";
export type SourceReadingPrototypeRelevance = "low" | "medium" | "high";
export type SourceReadingEvidenceStatus =
  | "ok"
  | "degraded"
  | "failed"
  | "disabled";

export type DeepSourceReading = {
  title: string;
  sourceType: PriorArtMatrixItem["sourceType"];
  kind: PriorArtSearchResult["kind"];
  url: string | null;
  citation: string | null;
  provider: string;
  readStatus: SourceReadStatus;
  summary: string;
  keyTechnicalMechanism: string;
  overlapWithInvention: string;
  differenceFromInvention: string;
  noveltyRisk: SourceReadingNoveltyRisk;
  prototypeRelevance: SourceReadingPrototypeRelevance;
  metadata: Record<string, unknown>;
  error?: string;
};

export type SourceReadingSummary = {
  status: SourceReadingEvidenceStatus;
  readCount: number;
  skippedCount: number;
  unsupportedCount: number;
  failedCount: number;
  disabledCount: number;
  concreteReadCount: number;
  sourceTypesRead: PriorArtMatrixItem["sourceType"][];
};

export type SourceReadingEvidence = {
  kind: "source_readings";
  mode: "disabled" | "deep_source";
  status: SourceReadingEvidenceStatus;
  resultCount: number;
  readCount: number;
  skippedCount: number;
  unsupportedCount: number;
  failedCount: number;
  disabledCount: number;
  concreteReadCount: number;
  sourceTypesRead: PriorArtMatrixItem["sourceType"][];
  readings: DeepSourceReading[];
  completedAt: string;
  evidenceHash: string;
};

export type SourceReadingConfig = {
  enabled: boolean;
  timeoutMs: number;
  maxReadBytes: number;
  githubTokenEnv: string | null;
};

export type SourceReadingQuery = {
  brief: string;
  sources: PriorArtSearchResult[];
};

export interface SourceReadingProvider {
  read(query: SourceReadingQuery): Promise<DeepSourceReading[]>;
}

export interface ConcreteSourceReader {
  readonly name: string;
  canRead(source: PriorArtSearchResult): boolean;
  read(
    source: PriorArtSearchResult,
    query: SourceReadingQuery,
  ): Promise<DeepSourceReading>;
}

export const DEFAULT_SOURCE_READING_CONFIG: SourceReadingConfig = {
  enabled: false,
  timeoutMs: 8000,
  maxReadBytes: 20000,
  githubTokenEnv: null,
};

export function createSourceReadingProvider(
  config: Pick<SovrynConfig, "research">,
  fetcher: FetchLike = defaultFetch,
): SourceReadingProvider {
  const normalized = normalizeSourceReadingConfig(
    config.research?.sourceReading,
  );
  if (!normalized.enabled) return new DisabledSourceReadingProvider();
  const fetcherWithTimeout = withFetchTimeout(fetcher, normalized.timeoutMs);
  return new CompositeSourceReadingProvider([
    new GitHubReadmeReader({
      fetcher: fetcherWithTimeout,
      maxReadBytes: normalized.maxReadBytes,
      tokenEnv: normalized.githubTokenEnv,
    }),
    new ArxivAbstractReader({
      fetcher: fetcherWithTimeout,
      maxReadBytes: normalized.maxReadBytes,
    }),
    new OpenAlexWorkReader({
      fetcher: fetcherWithTimeout,
      maxReadBytes: normalized.maxReadBytes,
    }),
  ]);
}

export function normalizeSourceReadingConfig(
  settings: Partial<SourceReadingConfig> = {},
): SourceReadingConfig {
  return {
    enabled: boolOrDefault(
      settings.enabled,
      DEFAULT_SOURCE_READING_CONFIG.enabled,
    ),
    timeoutMs: clampInt(
      settings.timeoutMs,
      DEFAULT_SOURCE_READING_CONFIG.timeoutMs,
      1000,
      30000,
    ),
    maxReadBytes: clampInt(
      settings.maxReadBytes,
      DEFAULT_SOURCE_READING_CONFIG.maxReadBytes,
      1000,
      100000,
    ),
    githubTokenEnv:
      typeof settings.githubTokenEnv === "string" &&
      settings.githubTokenEnv.trim().length > 0
        ? settings.githubTokenEnv
        : null,
  };
}

export function createSourceReadingEvidence(
  readings: DeepSourceReading[],
  mode: SourceReadingEvidence["mode"],
  completedAt: string,
): SourceReadingEvidence {
  const summary = summarizeSourceReadings(readings, mode);
  const evidence: SourceReadingEvidence = {
    kind: "source_readings",
    mode,
    status: summary.status,
    resultCount: readings.length,
    readCount: summary.readCount,
    skippedCount: summary.skippedCount,
    unsupportedCount: summary.unsupportedCount,
    failedCount: summary.failedCount,
    disabledCount: summary.disabledCount,
    concreteReadCount: summary.concreteReadCount,
    sourceTypesRead: summary.sourceTypesRead,
    readings,
    completedAt,
    evidenceHash: "",
  };
  evidence.evidenceHash = hashEvidence(evidence);
  return evidence;
}

export function summarizeSourceReadings(
  readings: DeepSourceReading[],
  mode: SourceReadingEvidence["mode"] = "deep_source",
): SourceReadingSummary {
  const read = readings.filter((reading) => reading.readStatus === "read");
  const skipped = readings.filter(
    (reading) => reading.readStatus === "skipped",
  );
  const unsupported = readings.filter(
    (reading) => reading.readStatus === "unsupported",
  );
  const failed = readings.filter((reading) => reading.readStatus === "failed");
  const disabled = readings.filter(
    (reading) => reading.readStatus === "disabled",
  );
  const concreteRead = read.filter(
    (reading) => reading.kind === "concrete_source",
  );
  return {
    status:
      mode === "disabled"
        ? "disabled"
        : read.length > 0 && failed.length === 0
          ? "ok"
          : read.length > 0
            ? "degraded"
            : failed.length > 0
              ? "failed"
              : "degraded",
    readCount: read.length,
    skippedCount: skipped.length,
    unsupportedCount: unsupported.length,
    failedCount: failed.length,
    disabledCount: disabled.length,
    concreteReadCount: concreteRead.length,
    sourceTypesRead: uniqueSourceTypes(concreteRead),
  };
}

export class DisabledSourceReadingProvider implements SourceReadingProvider {
  async read(query: SourceReadingQuery): Promise<DeepSourceReading[]> {
    return query.sources.map((source) =>
      source.kind === "concrete_source"
        ? disabledReading(source)
        : skippedReading(source),
    );
  }
}

export class CompositeSourceReadingProvider implements SourceReadingProvider {
  constructor(private readonly readers: ConcreteSourceReader[]) {}

  async read(query: SourceReadingQuery): Promise<DeepSourceReading[]> {
    const out: DeepSourceReading[] = [];
    for (const source of query.sources) {
      if (source.kind !== "concrete_source") {
        out.push(skippedReading(source));
        continue;
      }
      const reader = this.readers.find((candidate) =>
        candidate.canRead(source),
      );
      if (!reader) {
        out.push(unsupportedReading(source));
        continue;
      }
      try {
        out.push(await reader.read(source, query));
      } catch (error) {
        out.push(failedReading(source, reader.name, error));
      }
    }
    return out;
  }
}

export class GitHubReadmeReader implements ConcreteSourceReader {
  readonly name = "github-readme-reader";

  constructor(
    private readonly options: {
      fetcher?: FetchLike;
      maxReadBytes?: number;
      tokenEnv?: string | null;
    } = {},
  ) {}

  canRead(source: PriorArtSearchResult): boolean {
    return source.sourceType === "github" && parseGitHubRepo(source) !== null;
  }

  async read(
    source: PriorArtSearchResult,
    query: SourceReadingQuery,
  ): Promise<DeepSourceReading> {
    const repo = parseGitHubRepo(source);
    if (!repo) return unsupportedReading(source);
    const fetcher = this.options.fetcher ?? defaultFetch;
    const headers = githubHeaders(this.options.tokenEnv ?? null);
    const repoMeta = asRecord(
      await fetchJson(
        fetcher,
        `https://api.github.com/repos/${repo.owner}/${repo.name}`,
        headers,
      ),
    );
    const readme = truncate(
      await fetchText(
        fetcher,
        `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`,
        { ...headers, Accept: "application/vnd.github.raw" },
      ),
      this.options.maxReadBytes ?? DEFAULT_SOURCE_READING_CONFIG.maxReadBytes,
    );
    const description =
      stringOrNull(repoMeta.description) ??
      "No repository description provided.";
    const language = stringOrNull(repoMeta.language);
    const stars = numberOrNull(repoMeta.stargazers_count);
    const topics = asArray(repoMeta.topics).filter(
      (item): item is string => typeof item === "string",
    );
    return {
      title: source.title,
      sourceType: source.sourceType,
      kind: source.kind,
      url: source.url,
      citation: source.citation,
      provider: this.name,
      readStatus: "read",
      summary: oneLine(readme || description),
      keyTechnicalMechanism: `Public repository ${repo.owner}/${repo.name}${language ? ` in ${language}` : ""} exposes implementation/documentation signals relevant to ${query.brief}.`,
      overlapWithInvention: `${source.overlap} README/metadata signal: ${oneLine(description || readme)}`,
      differenceFromInvention: `${source.difference} Compare repository implementation boundaries, tests, license, and evidence artifacts before treating it as overlapping prior art.`,
      noveltyRisk: noveltyRiskFor(source.relevance),
      prototypeRelevance: source.relevance === "low" ? "medium" : "high",
      metadata: {
        owner: repo.owner,
        repo: repo.name,
        language,
        stars,
        topics,
        readmeExcerpt: oneLine(readme),
      },
    };
  }
}

export class ArxivAbstractReader implements ConcreteSourceReader {
  readonly name = "arxiv-abstract-reader";

  constructor(
    private readonly options: {
      fetcher?: FetchLike;
      maxReadBytes?: number;
    } = {},
  ) {}

  canRead(source: PriorArtSearchResult): boolean {
    return source.sourceType === "paper" && parseArxivId(source.url) !== null;
  }

  async read(
    source: PriorArtSearchResult,
    query: SourceReadingQuery,
  ): Promise<DeepSourceReading> {
    const id = parseArxivId(source.url);
    if (!id) return unsupportedReading(source);
    const xml = await fetchText(
      this.options.fetcher ?? defaultFetch,
      `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`,
      { "User-Agent": "sovryn-os-source-reader" },
    );
    const entry = parseArxivEntries(xml)[0];
    if (!entry) throw new Error(`No arXiv entry found for ${id}`);
    const abstract = truncate(
      entry.summary,
      this.options.maxReadBytes ?? DEFAULT_SOURCE_READING_CONFIG.maxReadBytes,
    );
    return {
      title: entry.title || source.title,
      sourceType: source.sourceType,
      kind: source.kind,
      url: source.url,
      citation: source.citation ?? `arXiv:${id}`,
      provider: this.name,
      readStatus: "read",
      summary: oneLine(abstract),
      keyTechnicalMechanism: `arXiv abstract describes: ${oneLine(abstract)}`,
      overlapWithInvention: `${source.overlap} Abstract signal: ${oneLine(abstract)}`,
      differenceFromInvention:
        "Compare the paper's method, assumptions, evaluation, and released artifacts against the open invention dossier.",
      noveltyRisk: noveltyRiskFor(source.relevance),
      prototypeRelevance: source.relevance === "high" ? "medium" : "low",
      metadata: {
        arxivId: id,
        authors: entry.authors,
        categories: entry.categories,
        publishedYear: entry.publishedYear,
        abstractExcerpt: oneLine(abstract),
      },
    };
  }
}

export class OpenAlexWorkReader implements ConcreteSourceReader {
  readonly name = "openalex-work-reader";

  constructor(
    private readonly options: {
      fetcher?: FetchLike;
      maxReadBytes?: number;
    } = {},
  ) {}

  canRead(source: PriorArtSearchResult): boolean {
    return source.sourceType === "paper" && openAlexApiUrl(source.url) !== null;
  }

  async read(
    source: PriorArtSearchResult,
    query: SourceReadingQuery,
  ): Promise<DeepSourceReading> {
    const apiUrl = openAlexApiUrl(source.url);
    if (!apiUrl) return unsupportedReading(source);
    const work = asRecord(
      await fetchJson(this.options.fetcher ?? defaultFetch, apiUrl, {
        "User-Agent": "sovryn-os-source-reader",
      }),
    );
    const title = stringOrNull(work.title) ?? source.title;
    const abstract = truncate(
      reconstructOpenAlexAbstract(work.abstract_inverted_index) ||
        "No OpenAlex abstract available.",
      this.options.maxReadBytes ?? DEFAULT_SOURCE_READING_CONFIG.maxReadBytes,
    );
    const year = numberOrNull(work.publication_year);
    const doi = stringOrNull(work.doi);
    const venue = openAlexVenue(work);
    const authors = openAlexAuthors(work);
    return {
      title,
      sourceType: source.sourceType,
      kind: source.kind,
      url: source.url,
      citation: source.citation ?? `${title}${year ? ` (${year})` : ""}`,
      provider: this.name,
      readStatus: "read",
      summary: oneLine(abstract),
      keyTechnicalMechanism: `OpenAlex metadata describes: ${oneLine(abstract)}`,
      overlapWithInvention: `${source.overlap} Abstract signal: ${oneLine(abstract)}`,
      differenceFromInvention:
        "Compare the paper's mechanism, evidence model, publication mode, and implementation availability against the open invention.",
      noveltyRisk: noveltyRiskFor(source.relevance),
      prototypeRelevance: source.relevance === "high" ? "medium" : "low",
      metadata: {
        doi,
        venue,
        year,
        authors,
        abstractExcerpt: oneLine(abstract),
        brief: query.brief,
      },
    };
  }
}

function disabledReading(source: PriorArtSearchResult): DeepSourceReading {
  return baseReading(
    source,
    "source-reading-disabled",
    "disabled",
    "Deep source reading is disabled in Sovryn config.",
  );
}

function skippedReading(source: PriorArtSearchResult): DeepSourceReading {
  return baseReading(
    source,
    "source-reading-skipper",
    "skipped",
    source.kind === "query_link"
      ? "Query link prepared for review; no concrete source was read."
      : source.kind === "adapter_failure"
        ? "Public-source adapter failure recorded; no source was read."
        : "Deterministic placeholder recorded; no source was read.",
  );
}

function unsupportedReading(source: PriorArtSearchResult): DeepSourceReading {
  return baseReading(
    source,
    "unsupported-source-reader",
    "unsupported",
    "No deep source reader supports this concrete source yet.",
  );
}

function failedReading(
  source: PriorArtSearchResult,
  provider: string,
  reason: unknown,
): DeepSourceReading {
  return {
    ...baseReading(
      source,
      provider,
      "failed",
      "Deep source reader failed. Retry or manual review is required.",
    ),
    error: reason instanceof Error ? reason.message : String(reason),
  };
}

function baseReading(
  source: PriorArtSearchResult,
  provider: string,
  readStatus: SourceReadStatus,
  summary: string,
): DeepSourceReading {
  return {
    title: source.title,
    sourceType: source.sourceType,
    kind: source.kind,
    url: source.url,
    citation: source.citation,
    provider,
    readStatus,
    summary,
    keyTechnicalMechanism: "Not available from deep source reading.",
    overlapWithInvention: source.overlap,
    differenceFromInvention: source.difference,
    noveltyRisk: "unknown",
    prototypeRelevance: "low",
    metadata: {},
  };
}

function githubHeaders(tokenEnv: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "sovryn-os-source-reader",
  };
  const token = tokenEnv ? process.env[tokenEnv] : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseGitHubRepo(
  source: PriorArtSearchResult,
): { owner: string; name: string } | null {
  const fromUrl = source.url?.match(
    /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\.git)?\/?$/,
  );
  if (fromUrl) return { owner: fromUrl[1], name: fromUrl[2] };
  const fromTitle = source.title.match(
    /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/,
  );
  return fromTitle ? { owner: fromTitle[1], name: fromTitle[2] } : null;
}

function parseArxivId(url: string | null): string | null {
  const match = url?.match(/arxiv\.org\/abs\/([A-Za-z0-9_.-]+)/i);
  return match ? match[1] : null;
}

function openAlexApiUrl(url: string | null): string | null {
  const openAlex = url?.match(/openalex\.org\/(W[0-9A-Za-z]+)/i);
  if (openAlex) return `https://api.openalex.org/works/${openAlex[1]}`;
  const doi = url?.match(/^https:\/\/doi\.org\/(.+)$/i);
  if (doi) return `https://api.openalex.org/works/https://doi.org/${doi[1]}`;
  return null;
}

function reconstructOpenAlexAbstract(value: unknown): string | null {
  const index = asRecord(value);
  const positions: Array<{ word: string; position: number }> = [];
  for (const [word, rawPositions] of Object.entries(index)) {
    if (!Array.isArray(rawPositions)) continue;
    for (const position of rawPositions) {
      if (typeof position === "number" && Number.isFinite(position)) {
        positions.push({ word, position });
      }
    }
  }
  if (positions.length === 0) return null;
  return positions
    .sort((a, b) => a.position - b.position)
    .map((item) => item.word)
    .join(" ");
}

function openAlexVenue(work: Record<string, unknown>): string | null {
  const primaryLocation = asRecord(work.primary_location);
  const source = asRecord(primaryLocation.source);
  return stringOrNull(source.display_name);
}

function openAlexAuthors(work: Record<string, unknown>): string[] {
  return asArray(work.authorships)
    .map((item) => stringOrNull(asRecord(asRecord(item).author).display_name))
    .filter((item): item is string => item !== null);
}

async function defaultFetch(
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
): ReturnType<FetchLike> {
  const response = await fetch(url, init);
  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json() as Promise<unknown>,
    text: () => response.text(),
  };
}

function withFetchTimeout(fetcher: FetchLike, timeoutMs: number): FetchLike {
  return async (url, init) => {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;
    const timeoutFailure = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(
          new Error(`Timed out after ${timeoutMs}ms while fetching ${url}`),
        );
      }, timeoutMs);
    });
    try {
      return await Promise.race([
        fetcher(url, { ...init, signal: controller.signal }),
        timeoutFailure,
      ]);
    } finally {
      clearTimeout(timeout!);
    }
  };
}

async function fetchJson(
  fetcher: FetchLike,
  url: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const response = await fetcher(url, { headers });
  if (!response.ok || !response.json) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.json();
}

async function fetchText(
  fetcher: FetchLike,
  url: string,
  headers: Record<string, string>,
): Promise<string> {
  const response = await fetcher(url, { headers });
  if (!response.ok || !response.text) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.text();
}

function parseArxivEntries(xml: string): Array<{
  title: string;
  summary: string;
  authors: string[];
  categories: string[];
  publishedYear: number | null;
}> {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((entry) => ({
    title: decodeXml(extractXmlTag(entry, "title") ?? "Untitled arXiv entry"),
    summary: oneLine(
      decodeXml(extractXmlTag(entry, "summary") ?? "No summary provided."),
    ),
    authors: [
      ...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g),
    ].map((match) => decodeXml(match[1])),
    categories: [...entry.matchAll(/<category\s+term="([^"]+)"/g)].map(
      (match) => decodeXml(match[1]),
    ),
    publishedYear: yearFromIso(extractXmlTag(entry, "published")),
  }));
}

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].replace(/\s+/g, " ").trim() : null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function yearFromIso(value: string | null): number | null {
  const year = value?.slice(0, 4);
  const parsed = year ? Number.parseInt(year, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function noveltyRiskFor(
  relevance: PriorArtSearchResult["relevance"],
): SourceReadingNoveltyRisk {
  if (relevance === "high") return "high";
  if (relevance === "medium") return "medium";
  return "low";
}

function uniqueSourceTypes(
  readings: DeepSourceReading[],
): PriorArtMatrixItem["sourceType"][] {
  return [...new Set(readings.map((reading) => reading.sourceType))].sort();
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

function truncate(value: string, maxBytes: number): string {
  return Buffer.from(value, "utf8").subarray(0, maxBytes).toString("utf8");
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
