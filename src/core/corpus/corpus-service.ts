import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { scanSecrets } from "../../shared/redaction.js";
import { nowIso } from "../../shared/time.js";
import { configExists } from "../config.js";
import { hashEvidence } from "../invention/pipeline.js";
import type { FactoryIndex } from "../factory/factory-service.js";
import type {
  FactoryScore,
  ResearchFactoryRun,
  SourceCardIndex,
} from "../factory/factory-types.js";
import type {
  InventionDossier,
  InventionIndex,
  OpenInventionMissionState,
} from "../invention/invention-types.js";
import type {
  CorpusDuplicateEntry,
  CorpusFactoryEntry,
  CorpusIndex,
  CorpusInventionEntry,
  CorpusPublicReleaseEntry,
  CorpusQualityReport,
  CorpusReadinessLabel,
  CorpusSearchResponse,
  CorpusSearchResult,
  CorpusSourceEntry,
} from "./corpus-types.js";

export class CorpusService {
  constructor(private readonly root: string) {}

  async index(): Promise<{
    index: CorpusIndex;
    quality: CorpusQualityReport;
    artifactRefs: string[];
  }> {
    await this.ensureInitialized();
    await mkdir(this.corpusRoot(), { recursive: true });
    const factoryRuns = await this.scanFactoryRuns();
    const inventions = await this.scanInventions();
    const sources = await this.scanSources(factoryRuns, inventions);
    const duplicates = buildDuplicateMap(factoryRuns, inventions);
    const publicReleases = await this.scanPublicReleases(
      factoryRuns,
      inventions,
    );
    const quality = withHash(
      buildQualityReport({
        factoryRuns,
        inventions,
        sources,
        duplicates,
        publicReleases,
      }),
    );
    const index = withHash({
      kind: "sovryn_corpus_index" as const,
      generatedAt: quality.generatedAt,
      factoryRuns,
      inventions,
      sources,
      duplicates,
      publicReleases,
      qualitySummary: {
        generatedAt: quality.generatedAt,
        factoryRunCount: quality.factoryRunCount,
        inventionCount: quality.inventionCount,
        sourceCount: quality.sourceCount,
        publicReleaseCount: quality.publicReleaseCount,
        duplicateCount: quality.duplicateCount,
        highDuplicateRiskCount: quality.highDuplicateRiskCount,
        averageFactoryQualityScore: quality.averageFactoryQualityScore,
        readinessCounts: quality.readinessCounts,
        missingSourceCardFactoryRuns: quality.missingSourceCardFactoryRuns,
        recommendations: quality.recommendations,
      },
      evidenceHash: "",
    });
    await this.writeArtifacts({ index, quality });
    return {
      index,
      quality,
      artifactRefs: [
        this.corpusRef("corpus-index.json"),
        this.corpusRef("invention-registry.json"),
        this.corpusRef("source-registry.json"),
        this.corpusRef("duplicate-map.json"),
        this.corpusRef("corpus-quality-report.json"),
        this.corpusRef("PUBLIC_RELEASES.md"),
      ],
    };
  }

  async search(query: string): Promise<{
    search: CorpusSearchResponse;
    artifactRefs: string[];
  }> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new AppError(
        "CORPUS_QUERY_REQUIRED",
        "corpus search requires a non-empty query.",
      );
    }
    const { index } = await this.index();
    const terms = comparableTokens(normalizedQuery);
    const results: CorpusSearchResult[] = [
      ...index.factoryRuns.map((entry) => ({
        kind: "factory" as const,
        id: entry.factoryId,
        title: entry.researchGoal,
        score: similarityFromTerms(terms, entry.researchGoal),
        summary: `${entry.status} factory run with ${entry.readinessLabel} readiness.`,
        refs: [join(".sovryn", "factory", entry.slug, "factory-run.json")],
      })),
      ...index.inventions.map((entry) => ({
        kind: "invention" as const,
        id: entry.inventionId,
        title: entry.title,
        score: similarityFromTerms(terms, entry.title),
        summary: `${entry.status} Open Invention in ${entry.publicationMode} mode.`,
        refs: [join(".sovryn", "inventions", entry.slug, "dossier.json")],
      })),
      ...index.sources.map((entry) => ({
        kind: "source" as const,
        id: entry.sourceKey,
        title: entry.title,
        score: similarityFromTerms(
          terms,
          `${entry.title} ${entry.sourceType} ${entry.citation ?? ""}`,
        ),
        summary: `${entry.sourceType} source reused in ${entry.factoryRunIds.length} factory run(s).`,
        refs: entry.factoryRunIds.map((factoryId) => `factory:${factoryId}`),
      })),
      ...index.publicReleases.map((entry) => ({
        kind: "release" as const,
        id: entry.releaseId,
        title: entry.title,
        score: similarityFromTerms(terms, entry.title),
        summary: entry.dryRun
          ? "Dry-run release package recorded."
          : "Public release entry recorded.",
        refs: [entry.releasePath ?? entry.url ?? entry.slug],
      })),
    ]
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 10);
    const search = withHash({
      kind: "corpus_search" as const,
      query: normalizedQuery,
      searchedAt: nowIso(),
      resultCount: results.length,
      results,
      evidenceHash: "",
    });
    await writeJson(join(this.corpusRoot(), "last-search.json"), search);
    return {
      search,
      artifactRefs: [this.corpusRef("last-search.json")],
    };
  }

  async dedupe(): Promise<{
    duplicates: {
      kind: "corpus_duplicate_map";
      generatedAt: string;
      duplicates: CorpusDuplicateEntry[];
      evidenceHash: string;
    };
    artifactRefs: string[];
  }> {
    const { index } = await this.index();
    return {
      duplicates: {
        kind: "corpus_duplicate_map",
        generatedAt: index.generatedAt,
        duplicates: index.duplicates,
        evidenceHash: hashEvidence(index.duplicates),
      },
      artifactRefs: [this.corpusRef("duplicate-map.json")],
    };
  }

  async report(): Promise<{
    index: CorpusIndex;
    quality: CorpusQualityReport;
    publicReleases: CorpusPublicReleaseEntry[];
    artifactRefs: string[];
  }> {
    const { index, quality, artifactRefs } = await this.index();
    return {
      index,
      quality,
      publicReleases: index.publicReleases,
      artifactRefs: [
        ...artifactRefs,
        this.corpusRef("corpus-quality-report.md"),
      ],
    };
  }

  async updateReleaseRegistry(): Promise<{
    publicReleases: CorpusPublicReleaseEntry[];
    artifactRefs: string[];
  }> {
    const { index } = await this.index();
    return {
      publicReleases: index.publicReleases,
      artifactRefs: [this.corpusRef("PUBLIC_RELEASES.md")],
    };
  }

  async exportPublic(): Promise<{
    export: Record<string, unknown>;
    checks: Array<{
      code: string;
      passed: boolean;
      message: string;
      details: Record<string, unknown>;
    }>;
    publicPath: string;
    artifactRefs: string[];
  }> {
    const { index, quality } = await this.index();
    const publicRoot = join(this.corpusRoot(), "public");
    await rm(publicRoot, { recursive: true, force: true });
    await mkdir(publicRoot, { recursive: true });
    const claimFeatures = await this.publicClaimFeatures(index.factoryRuns);
    const releaseCandidates = await this.publicReleaseCandidates();
    const qualityScores = await this.publicQualityScores(index);
    const sourceCards = index.sources.map((source) => ({
      sourceKey: source.sourceKey,
      sourceType: source.sourceType,
      title: source.title,
      url: source.url,
      citation: source.citation,
      evidenceStrength: source.evidenceStrength,
      confidence: source.confidence,
      readingDepth: source.readingDepth,
      linkedFactoryRunIds: source.factoryRunIds,
      linkedInventionIds: source.inventionIds,
    }));
    const graph = buildCorpusGraph({
      index,
      claimFeatures,
      releaseCandidates,
      qualityScores,
    });
    const publicIndex = withHash({
      kind: "public_corpus_index" as const,
      generatedAt: index.generatedAt,
      factoryRunCount: index.factoryRuns.length,
      inventionCount: index.inventions.length,
      sourceCount: index.sources.length,
      releaseCandidateCount: releaseCandidates.length,
      publicReleaseCount: index.publicReleases.length,
      duplicateCount: index.duplicates.length,
      readinessCounts: quality.readinessCounts,
      qualityLabelsIncluded: qualityScores.length > 0,
      releaseStatusIncluded: true,
      files: [
        "inventions.json",
        "sources.json",
        "source-cards.json",
        "claim-features.json",
        "release-candidates.json",
        "quality-scores.json",
        "duplicate-map.public.json",
        "corpus-graph.json",
      ],
      legalNotice:
        "This is a public Open Invention corpus export. It is not a legal patent filing, patentability opinion, legal novelty opinion, or freedom-to-operate opinion.",
      evidenceHash: "",
    });
    await writeJson(join(publicRoot, "index.json"), publicIndex);
    await writeJson(join(publicRoot, "inventions.json"), {
      kind: "public_corpus_inventions",
      generatedAt: index.generatedAt,
      inventions: index.inventions.map(publicInvention),
      evidenceHash: hashEvidence(index.inventions.map(publicInvention)),
    });
    await writeJson(join(publicRoot, "sources.json"), {
      kind: "public_corpus_sources",
      generatedAt: index.generatedAt,
      sources: index.sources,
      evidenceHash: hashEvidence(index.sources),
    });
    await writeJson(join(publicRoot, "source-cards.json"), {
      kind: "public_corpus_source_cards",
      generatedAt: index.generatedAt,
      sourceCards,
      evidenceHash: hashEvidence(sourceCards),
    });
    await writeJson(join(publicRoot, "claim-features.json"), {
      kind: "public_corpus_claim_features",
      generatedAt: index.generatedAt,
      claimFeatures,
      evidenceHash: hashEvidence(claimFeatures),
    });
    await writeJson(join(publicRoot, "release-candidates.json"), {
      kind: "public_corpus_release_candidates",
      generatedAt: index.generatedAt,
      releaseCandidates,
      evidenceHash: hashEvidence(releaseCandidates),
    });
    await writeJson(join(publicRoot, "quality-scores.json"), {
      kind: "public_corpus_quality_scores",
      generatedAt: index.generatedAt,
      qualityScores,
      evidenceHash: hashEvidence(qualityScores),
    });
    await writeJson(join(publicRoot, "duplicate-map.public.json"), {
      kind: "public_corpus_duplicate_map",
      generatedAt: index.generatedAt,
      duplicates: index.duplicates,
      evidenceHash: hashEvidence(index.duplicates),
    });
    await writeJson(join(publicRoot, "corpus-graph.json"), graph);
    await writeFile(
      join(publicRoot, "CORPUS_INDEX.md"),
      renderPublicCorpusIndex(publicIndex),
      "utf8",
    );
    await writeFile(
      join(publicRoot, "INVENTIONS.md"),
      renderPublicInventions(index.inventions),
      "utf8",
    );
    await writeFile(
      join(publicRoot, "SOURCES.md"),
      renderPublicSources(index.sources),
      "utf8",
    );
    await writeFile(
      join(publicRoot, "QUALITY.md"),
      renderPublicQuality(qualityScores),
      "utf8",
    );
    await writeFile(
      join(publicRoot, "DUPLICATES.md"),
      renderPublicDuplicates(index.duplicates),
      "utf8",
    );
    const checks = await this.evaluatePublicExport(publicRoot, {
      qualityScores,
      releases: index.publicReleases,
    });
    const exportSummary = {
      publicIndex,
      checks,
      publicPath: join(".sovryn", "corpus", "public"),
    };
    await writeJson(join(publicRoot, "public-corpus-export.json"), {
      kind: "public_corpus_export",
      generatedAt: nowIso(),
      publicIndexEvidenceHash: publicIndex.evidenceHash,
      checks,
      evidenceHash: hashEvidence(exportSummary),
    });
    return {
      export: exportSummary,
      checks,
      publicPath: join(".sovryn", "corpus", "public"),
      artifactRefs: [
        this.corpusRef("public/index.json"),
        this.corpusRef("public/CORPUS_INDEX.md"),
        this.corpusRef("public/corpus-graph.json"),
      ],
    };
  }

  async buildPublicSite(): Promise<{
    sitePath: string;
    artifactRefs: string[];
  }> {
    const exported = await this.exportPublic();
    const siteRoot = join(this.root, "public-corpus");
    await rm(siteRoot, { recursive: true, force: true });
    await mkdir(siteRoot, { recursive: true });
    const corpusJson = await readJson<Record<string, unknown>>(
      join(this.corpusRoot(), "public", "index.json"),
    );
    await writeJson(join(siteRoot, "corpus.json"), corpusJson);
    await writeFile(
      join(siteRoot, "index.html"),
      renderStaticCorpusSite(corpusJson),
      "utf8",
    );
    return {
      sitePath: "public-corpus",
      artifactRefs: [
        "public-corpus/index.html",
        "public-corpus/corpus.json",
        ...exported.artifactRefs,
      ],
    };
  }

  async graph(): Promise<{
    graph: Record<string, unknown>;
    artifactRefs: string[];
  }> {
    await this.exportPublic();
    const graph = await readJson<Record<string, unknown>>(
      join(this.corpusRoot(), "public", "corpus-graph.json"),
    );
    return {
      graph,
      artifactRefs: [this.corpusRef("public/corpus-graph.json")],
    };
  }

  async compare(): Promise<{
    comparison: Record<string, unknown>;
    artifactRefs: string[];
  }> {
    const { index } = await this.index();
    const comparison = withHash({
      kind: "public_corpus_comparison" as const,
      comparedAt: nowIso(),
      duplicateClusters: index.duplicates.map((entry) => ({
        duplicateId: entry.duplicateId,
        risk: entry.duplicateRisk,
        similarityScore: entry.similarityScore,
        left: {
          kind: entry.leftKind,
          id: entry.leftId,
          title: entry.leftTitle,
        },
        right: {
          kind: entry.rightKind,
          id: entry.rightId,
          title: entry.rightTitle,
        },
        recommendedAction: entry.recommendedAction,
      })),
      sourceReuse: index.sources.map((source) => ({
        sourceKey: source.sourceKey,
        title: source.title,
        reuseCount: source.factoryRunIds.length + source.inventionIds.length,
        factoryRunIds: source.factoryRunIds,
        inventionIds: source.inventionIds,
      })),
      readinessCounts: index.qualitySummary.readinessCounts,
      limitations: [
        "Duplicate clusters are deterministic similarity signals, not legal conclusions.",
        "Source reuse is a corpus navigation aid and does not prove novelty.",
      ],
      evidenceHash: "",
    });
    await mkdir(join(this.corpusRoot(), "public"), { recursive: true });
    await writeJson(
      join(this.corpusRoot(), "public", "corpus-compare.json"),
      comparison,
    );
    return {
      comparison,
      artifactRefs: [this.corpusRef("public/corpus-compare.json")],
    };
  }

  async explain(id: string): Promise<{
    explanation: Record<string, unknown>;
    artifactRefs: string[];
  }> {
    const normalized = id.trim();
    if (!normalized) {
      throw new AppError(
        "CORPUS_EXPLAIN_ID_REQUIRED",
        "corpus explain requires an id.",
      );
    }
    const { index } = await this.index();
    const factory = index.factoryRuns.find(
      (entry) => entry.factoryId === normalized || entry.slug === normalized,
    );
    const invention = index.inventions.find(
      (entry) => entry.inventionId === normalized || entry.slug === normalized,
    );
    const source = index.sources.find(
      (entry) =>
        entry.sourceKey === normalized || entry.sourceId === normalized,
    );
    const release = index.publicReleases.find(
      (entry) => entry.releaseId === normalized || entry.slug === normalized,
    );
    const target = factory ?? invention ?? source ?? release;
    if (!target) {
      throw new AppError(
        "CORPUS_EXPLAIN_NOT_FOUND",
        `Corpus id not found: ${id}`,
        {
          id,
        },
      );
    }
    const explanation = withHash({
      kind: "public_corpus_explanation" as const,
      explainedAt: nowIso(),
      id: normalized,
      targetKind: factory
        ? "factory"
        : invention
          ? "invention"
          : source
            ? "source"
            : "release",
      title:
        (factory?.researchGoal ??
          invention?.title ??
          source?.title ??
          release?.title) ||
        normalized,
      summary: explainSummary({ factory, invention, source, release }),
      evidenceRefs: publicEvidenceRefs({ factory, invention, source, release }),
      relatedSources: factory
        ? index.sources.filter((item) =>
            item.factoryRunIds.includes(factory.factoryId),
          )
        : [],
      relatedInventions: factory
        ? index.inventions.filter(
            (item) => item.factoryRunId === factory.factoryId,
          )
        : [],
      duplicateRisks: index.duplicates.filter(
        (entry) => entry.leftId === normalized || entry.rightId === normalized,
      ),
      releaseStatus: release?.status ?? null,
      legalNotice:
        "This explanation is corpus navigation evidence, not a legal patentability, legal novelty, or freedom-to-operate conclusion.",
      evidenceHash: "",
    });
    await mkdir(join(this.corpusRoot(), "public"), { recursive: true });
    await writeJson(
      join(this.corpusRoot(), "public", "last-explain.json"),
      explanation,
    );
    return {
      explanation,
      artifactRefs: [this.corpusRef("public/last-explain.json")],
    };
  }

  private async publicClaimFeatures(
    factoryRuns: CorpusFactoryEntry[],
  ): Promise<Array<Record<string, unknown>>> {
    const features: Array<Record<string, unknown>> = [];
    for (const run of factoryRuns) {
      const matrix = await readJson<Record<string, unknown>>(
        join(
          this.root,
          ".sovryn",
          "factory",
          run.slug,
          "claim-feature-matrix.json",
        ),
      ).catch(() => null);
      const rows = Array.isArray(matrix?.features) ? matrix.features : [];
      for (const row of rows) {
        if (!isRecord(row)) continue;
        features.push({
          factoryId: run.factoryId,
          factorySlug: run.slug,
          claimFeatureId: stringValue(row.claimFeatureId ?? row.featureId),
          featureText: stringValue(row.featureText ?? row.description),
          featureType: stringValue(row.featureType ?? "other"),
          sourceSupport: stringValue(row.sourceSupport ?? "unknown"),
          supportedBySourceCards: arrayOfStrings(row.supportedBySourceCards),
          knownOverlap: stringValue(row.knownOverlap),
          possibleDifferentiator: stringValue(
            row.possibleDifferentiator ?? row.candidateDifferentiator,
          ),
          confidence: stringValue(row.confidence ?? "low"),
          noveltyRisk: stringValue(row.noveltyRisk ?? "unknown"),
          evidenceRefs: arrayOfStrings(row.evidenceRefs),
        });
      }
    }
    return features.sort(
      (a, b) =>
        stringValue(a.factoryId).localeCompare(stringValue(b.factoryId)) ||
        stringValue(a.claimFeatureId).localeCompare(
          stringValue(b.claimFeatureId),
        ),
    );
  }

  private async publicReleaseCandidates(): Promise<
    Array<Record<string, unknown>>
  > {
    const build = await readJson<Record<string, unknown>>(
      join(
        this.root,
        ".sovryn",
        "releases",
        "candidates",
        "release-candidates.json",
      ),
    ).catch(() => null);
    const candidates = Array.isArray(build?.candidates) ? build.candidates : [];
    return candidates.filter(isRecord).map((candidate) => ({
      candidateId: stringValue(candidate.candidateId),
      title: stringValue(candidate.title),
      factoryId: stringValue(candidate.factoryId),
      inventionMissionId: stringValue(candidate.inventionMissionId),
      readinessLabel: stringValue(candidate.readinessLabel),
      score: isRecord(candidate.score) ? candidate.score : {},
      humanReviewRequired: candidate.humanReviewRequired === true,
      releasePath: stringValue(candidate.releasePath),
      publicationIntentPath: stringValue(candidate.publicationIntentPath),
    }));
  }

  private async publicQualityScores(
    index: CorpusIndex,
  ): Promise<Array<Record<string, unknown>>> {
    const leaderboard = await readJson<Record<string, unknown>>(
      join(this.root, ".sovryn", "quality", "quality-leaderboard.json"),
    ).catch(() => null);
    const entries = Array.isArray(leaderboard?.entries)
      ? leaderboard.entries.filter(isRecord).map((entry) => ({
          targetKind: stringValue(entry.targetKind),
          targetId: stringValue(entry.targetId),
          title: stringValue(entry.title),
          qualityScore: numberValue(entry.qualityScore),
          qualityLabel: stringValue(entry.qualityLabel),
          publishReady: entry.publishReady === true,
        }))
      : [];
    if (entries.length > 0) return entries;
    return index.factoryRuns.map((run) => ({
      targetKind: "factory",
      targetId: run.factoryId,
      title: run.researchGoal,
      qualityScore: run.qualityScore,
      qualityLabel:
        run.qualityScore >= 85
          ? "excellent"
          : run.qualityScore >= 70
            ? "good"
            : run.qualityScore >= 55
              ? "acceptable"
              : run.qualityScore > 0
                ? "weak"
                : "unacceptable",
      publishReady: run.qualityScore >= 70,
    }));
  }

  private async evaluatePublicExport(
    publicRoot: string,
    input: {
      qualityScores: Array<Record<string, unknown>>;
      releases: CorpusPublicReleaseEntry[];
    },
  ): Promise<
    Array<{
      code: string;
      passed: boolean;
      message: string;
      details: Record<string, unknown>;
    }>
  > {
    const text = await readDirectoryText(publicRoot);
    const files = await listFiles(publicRoot);
    const rawLogMatches =
      text.match(/command-journal|stdout|stderr|raw command log/gi) ?? [];
    const pathMatches =
      text.match(/\/Users\/|\/home\/|\/private\/tmp\/|[A-Z]:\\Users\\/gi) ?? [];
    const secretFindings = scanSecrets("public-corpus", text);
    const allowedFiles = new Set([
      "CORPUS_INDEX.md",
      "DUPLICATES.md",
      "INVENTIONS.md",
      "QUALITY.md",
      "SOURCES.md",
      "claim-features.json",
      "corpus-graph.json",
      "duplicate-map.public.json",
      "index.json",
      "inventions.json",
      "public-corpus-export.json",
      "quality-scores.json",
      "release-candidates.json",
      "source-cards.json",
      "sources.json",
    ]);
    return [
      corpusGate(
        "PUBLIC_CORPUS_EXPORT_PRESENT",
        await exists(join(publicRoot, "index.json")),
        "Public corpus index must exist.",
        {},
      ),
      corpusGate(
        "PUBLIC_CORPUS_CURATED_ONLY",
        files.every((file) => allowedFiles.has(file)),
        "Public corpus export must contain only curated files.",
        { files },
      ),
      corpusGate(
        "NO_PRIVATE_PATHS_IN_PUBLIC_CORPUS",
        pathMatches.length === 0,
        "Public corpus export must not contain local absolute paths.",
        { pathMatches: pathMatches.length },
      ),
      corpusGate(
        "NO_RAW_LOGS_IN_PUBLIC_CORPUS",
        rawLogMatches.length === 0,
        "Public corpus export must not contain unredacted execution transcripts.",
        { rawLogMatches: rawLogMatches.length },
      ),
      corpusGate(
        "NO_SECRET_LEAKS_IN_PUBLIC_CORPUS",
        secretFindings.length === 0,
        "Public corpus export must not contain secret-like values.",
        { findingCount: secretFindings.length },
      ),
      corpusGate(
        "QUALITY_LABELS_INCLUDED",
        input.qualityScores.every((entry) => stringValue(entry.qualityLabel)),
        "Public corpus export should include quality labels.",
        { qualityScoreCount: input.qualityScores.length },
      ),
      corpusGate(
        "RELEASE_STATUS_INCLUDED",
        input.releases.every((release) => release.status.length > 0),
        "Public corpus export should include release status.",
        { releaseCount: input.releases.length },
      ),
    ];
  }

  private async scanFactoryRuns(): Promise<CorpusFactoryEntry[]> {
    const factoryIndex = await readJson<FactoryIndex>(
      join(this.root, ".sovryn", "factory", "index.json"),
    ).catch(() => ({ factoryRuns: [] }));
    const entries: CorpusFactoryEntry[] = [];
    for (const item of factoryIndex.factoryRuns) {
      const factoryDir = join(this.root, ".sovryn", "factory", item.slug);
      const run = await readJson<ResearchFactoryRun>(
        join(factoryDir, "factory-run.json"),
      ).catch(() => null);
      const score = await readJson<FactoryScore>(
        join(factoryDir, "factory-score.json"),
      ).catch(() => null);
      entries.push({
        factoryId: item.id,
        slug: item.slug,
        researchGoal: run?.researchGoal ?? item.researchGoal,
        status: run?.status ?? item.status,
        readinessLabel: readinessLabel(score, run?.qualityScore ?? 0),
        qualityScore:
          score?.overallReadinessScore ??
          score?.factoryReadinessScore ??
          run?.qualityScore ??
          0,
        generatedInventionMissionIds: run?.generatedInventionMissionIds ?? [],
        selectedCandidateIds: run?.selectedCandidateIds ?? [],
        updatedAt: run?.updatedAt ?? item.updatedAt,
        evidenceRefs: [
          join(".sovryn", "factory", item.slug, "factory-run.json"),
          join(".sovryn", "factory", item.slug, "factory-score.json"),
        ],
      });
    }
    return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private async scanInventions(): Promise<CorpusInventionEntry[]> {
    const inventionIndex = await readJson<InventionIndex>(
      join(this.root, ".sovryn", "inventions", "index.json"),
    ).catch(() => ({ inventions: [] }));
    const entries: CorpusInventionEntry[] = [];
    for (const item of inventionIndex.inventions) {
      const inventionDir = join(this.root, ".sovryn", "inventions", item.slug);
      const mission = await readJson<OpenInventionMissionState>(
        join(inventionDir, "mission.json"),
      ).catch(() => null);
      const dossier = await readJson<
        InventionDossier & {
          factoryRunId?: string;
          selectedCandidateId?: string;
        }
      >(join(inventionDir, "dossier.json")).catch(() => null);
      entries.push({
        inventionId: item.id,
        slug: item.slug,
        title: dossier?.title ?? item.title,
        status: mission?.status ?? item.status,
        publicationMode: dossier?.publicationMode ?? "draft",
        license: dossier?.license ?? null,
        factoryRunId: dossier?.factoryRunId ?? null,
        selectedCandidateId: dossier?.selectedCandidateId ?? null,
        publicationUrl: mission?.publication.url ?? null,
        dryRunPublication: mission?.publication.dryRun ?? false,
        updatedAt: mission?.updatedAt ?? item.updatedAt,
        evidenceHashCount: Object.keys(dossier?.evidenceHashes ?? {}).length,
      });
    }
    return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private async scanSources(
    factoryRuns: CorpusFactoryEntry[],
    inventions: CorpusInventionEntry[],
  ): Promise<CorpusSourceEntry[]> {
    const byKey = new Map<string, CorpusSourceEntry>();
    for (const run of factoryRuns) {
      const sourceCards = await readJson<SourceCardIndex>(
        join(this.root, ".sovryn", "factory", run.slug, "source-cards.json"),
      ).catch(() => null);
      for (const card of sourceCards?.cards ?? []) {
        if (!card.concreteSource) continue;
        const key = sourceKey(card.sourceType, card.url, card.title);
        const linkedInventionIds = inventions
          .filter((invention) => invention.factoryRunId === run.factoryId)
          .map((invention) => invention.inventionId);
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, {
            sourceKey: key,
            sourceId: card.sourceId,
            sourceType: card.sourceType,
            title: card.title,
            url: card.url,
            citation: card.citation,
            evidenceStrength: card.evidenceStrength,
            confidence: card.confidence,
            readingDepth: card.readingDepth,
            factoryRunIds: [run.factoryId],
            inventionIds: linkedInventionIds,
            firstSeenAt: run.updatedAt,
            lastSeenAt: run.updatedAt,
          });
          continue;
        }
        existing.factoryRunIds = stableUnique([
          ...existing.factoryRunIds,
          run.factoryId,
        ]);
        existing.inventionIds = stableUnique([
          ...existing.inventionIds,
          ...linkedInventionIds,
        ]);
        existing.lastSeenAt =
          existing.lastSeenAt.localeCompare(run.updatedAt) > 0
            ? existing.lastSeenAt
            : run.updatedAt;
      }
    }
    return [...byKey.values()].sort(
      (a, b) =>
        b.factoryRunIds.length - a.factoryRunIds.length ||
        a.title.localeCompare(b.title),
    );
  }

  private async scanPublicReleases(
    factoryRuns: CorpusFactoryEntry[],
    inventions: CorpusInventionEntry[],
  ): Promise<CorpusPublicReleaseEntry[]> {
    const releases: CorpusPublicReleaseEntry[] = [];
    for (const invention of inventions) {
      const releasePath = join(
        ".sovryn",
        "inventions",
        invention.slug,
        "release",
        "repo",
      );
      const releaseExists = await exists(join(this.root, releasePath));
      if (
        invention.publicationMode === "published" ||
        invention.publicationMode === "open_source_release" ||
        invention.publicationUrl ||
        invention.dryRunPublication ||
        releaseExists
      ) {
        releases.push({
          releaseId: `invention-${invention.inventionId}`,
          inventionId: invention.inventionId,
          factoryRunId: invention.factoryRunId,
          slug: invention.slug,
          title: invention.title,
          status: invention.status,
          publicationMode: invention.publicationMode,
          url: invention.publicationUrl,
          dryRun: invention.dryRunPublication,
          releasePath: releaseExists ? releasePath : null,
          updatedAt: invention.updatedAt,
        });
      }
    }
    for (const run of factoryRuns) {
      const intent = await readJson<Record<string, unknown>>(
        join(
          this.root,
          ".sovryn",
          "factory",
          run.slug,
          "factory-publication-intent.json",
        ),
      ).catch(() => null);
      if (intent) {
        releases.push({
          releaseId: `factory-${run.factoryId}`,
          inventionId: null,
          factoryRunId: run.factoryId,
          slug: run.slug,
          title: run.researchGoal,
          status: run.status,
          publicationMode: "factory_dry_run",
          url: null,
          dryRun: true,
          releasePath: join(
            ".sovryn",
            "factory",
            run.slug,
            "release",
            "public",
          ),
          updatedAt: run.updatedAt,
        });
      }
    }
    return releases.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private async writeArtifacts(input: {
    index: CorpusIndex;
    quality: CorpusQualityReport;
  }): Promise<void> {
    const root = this.corpusRoot();
    await mkdir(root, { recursive: true });
    await writeJson(join(root, "corpus-index.json"), input.index);
    await writeJson(join(root, "invention-registry.json"), {
      kind: "corpus_invention_registry",
      generatedAt: input.index.generatedAt,
      inventions: input.index.inventions,
      evidenceHash: hashEvidence(input.index.inventions),
    });
    await writeJson(join(root, "source-registry.json"), {
      kind: "corpus_source_registry",
      generatedAt: input.index.generatedAt,
      sources: input.index.sources,
      reusedSourceCount: input.index.sources.filter(
        (source) => source.factoryRunIds.length > 1,
      ).length,
      evidenceHash: hashEvidence(input.index.sources),
    });
    await writeJson(join(root, "duplicate-map.json"), {
      kind: "corpus_duplicate_map",
      generatedAt: input.index.generatedAt,
      duplicates: input.index.duplicates,
      evidenceHash: hashEvidence(input.index.duplicates),
    });
    await writeJson(join(root, "feedback-index.json"), {
      kind: "corpus_feedback_index",
      generatedAt: input.index.generatedAt,
      feedback: [],
      limitations: [
        "Community feedback intake is reserved for a future release.",
        "No private feedback is published by default.",
      ],
      evidenceHash: hashEvidence([]),
    });
    await writeJson(join(root, "corpus-quality-report.json"), input.quality);
    await writeFile(
      join(root, "corpus-quality-report.md"),
      renderCorpusQualityReport(input.quality),
      "utf8",
    );
    await writeFile(
      join(root, "PUBLIC_RELEASES.md"),
      renderPublicReleases(input.index.publicReleases),
      "utf8",
    );
  }

  private async ensureInitialized(): Promise<void> {
    if (!(await configExists(this.root))) {
      throw new AppError("CONFIG_MISSING", "Run sovryn init first.");
    }
  }

  private corpusRoot(): string {
    return join(this.root, ".sovryn", "corpus");
  }

  private corpusRef(file: string): string {
    return join(".sovryn", "corpus", file);
  }
}

function buildQualityReport(input: {
  factoryRuns: CorpusFactoryEntry[];
  inventions: CorpusInventionEntry[];
  sources: CorpusSourceEntry[];
  duplicates: CorpusDuplicateEntry[];
  publicReleases: CorpusPublicReleaseEntry[];
}): CorpusQualityReport {
  const readinessCounts: Record<CorpusReadinessLabel, number> = {
    blocked: 0,
    weak: 0,
    moderate: 0,
    strong: 0,
  };
  for (const run of input.factoryRuns) readinessCounts[run.readinessLabel] += 1;
  const missingSourceCardFactoryRuns = input.factoryRuns
    .filter(
      (run) =>
        !input.sources.some((source) =>
          source.factoryRunIds.includes(run.factoryId),
        ),
    )
    .map((run) => run.factoryId);
  const averageFactoryQualityScore =
    input.factoryRuns.length === 0
      ? 0
      : Math.round(
          input.factoryRuns.reduce((sum, run) => sum + run.qualityScore, 0) /
            input.factoryRuns.length,
        );
  const recommendations = [
    ...(input.factoryRuns.length === 0
      ? ["Run at least one Factory cycle to seed corpus memory."]
      : []),
    ...(input.sources.length === 0
      ? ["Enable fixture or public source reading to seed reusable sources."]
      : []),
    ...(missingSourceCardFactoryRuns.length > 0
      ? ["Refresh older Factory runs so source cards can enter the corpus."]
      : []),
    ...(input.duplicates.some((entry) => entry.duplicateRisk === "high")
      ? [
          "Review high duplicate-risk entries before launching similar research.",
        ]
      : []),
    "Use the corpus as research memory; do not publish private memory by default.",
  ];
  return {
    kind: "corpus_quality_report",
    generatedAt: nowIso(),
    factoryRunCount: input.factoryRuns.length,
    inventionCount: input.inventions.length,
    sourceCount: input.sources.length,
    publicReleaseCount: input.publicReleases.length,
    duplicateCount: input.duplicates.length,
    highDuplicateRiskCount: input.duplicates.filter(
      (entry) => entry.duplicateRisk === "high",
    ).length,
    averageFactoryQualityScore,
    readinessCounts,
    missingSourceCardFactoryRuns,
    recommendations,
    evidenceHash: "",
  };
}

function buildDuplicateMap(
  factoryRuns: CorpusFactoryEntry[],
  inventions: CorpusInventionEntry[],
): CorpusDuplicateEntry[] {
  const items = [
    ...factoryRuns.map((run) => ({
      kind: "factory" as const,
      id: run.factoryId,
      title: run.researchGoal,
    })),
    ...inventions.map((invention) => ({
      kind: "invention" as const,
      id: invention.inventionId,
      title: invention.title,
    })),
  ];
  const duplicates: CorpusDuplicateEntry[] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      const similarityScore = similarity(left.title, right.title);
      if (similarityScore < 55) continue;
      const duplicateRisk =
        similarityScore >= 80
          ? "high"
          : similarityScore >= 65
            ? "medium"
            : "low";
      duplicates.push({
        duplicateId: `${left.kind}-${left.id}-${right.kind}-${right.id}`,
        leftKind: left.kind,
        leftId: left.id,
        leftTitle: left.title,
        rightKind: right.kind,
        rightId: right.id,
        rightTitle: right.title,
        similarityScore,
        duplicateRisk,
        recommendedAction:
          duplicateRisk === "high" ? "merge_or_defer" : "review",
        rationale:
          "Deterministic token overlap indicates related research. This is duplicate-risk evidence, not an automatic block.",
      });
    }
  }
  return duplicates.sort(
    (a, b) =>
      b.similarityScore - a.similarityScore ||
      a.duplicateId.localeCompare(b.duplicateId),
  );
}

function readinessLabel(
  score: FactoryScore | null,
  fallbackScore: number,
): CorpusReadinessLabel {
  if (score?.readinessLabel) return score.readinessLabel;
  if (fallbackScore >= 80) return "strong";
  if (fallbackScore >= 60) return "moderate";
  if (fallbackScore > 0) return "weak";
  return "blocked";
}

function sourceKey(
  sourceType: string,
  url: string | null,
  title: string,
): string {
  return `${sourceType}:${stableSlug(url ?? title)}`;
}

function stableSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

function withHash<T extends { evidenceHash: string }>(value: T): T {
  value.evidenceHash = hashEvidence({ ...value, evidenceHash: "" });
  return value;
}

function similarity(left: string, right: string): number {
  return similarityFromTerms(comparableTokens(left), right);
}

function similarityFromTerms(terms: string[], text: string): number {
  const other = comparableTokens(text);
  if (terms.length === 0 || other.length === 0) return 0;
  const set = new Set(other);
  const overlap = terms.filter((term) => set.has(term)).length;
  return Math.round((overlap / Math.max(terms.length, other.length)) * 100);
}

function comparableTokens(value: string): string[] {
  return stableUnique(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
      .filter(
        (token) =>
          ![
            "the",
            "and",
            "for",
            "with",
            "method",
            "system",
            "open",
            "source",
            "research",
          ].includes(token),
      ),
  );
}

function stableUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function renderCorpusQualityReport(report: CorpusQualityReport): string {
  return [
    "# Corpus Quality Report",
    "",
    `Factory runs: ${report.factoryRunCount}`,
    `Open Inventions: ${report.inventionCount}`,
    `Reusable sources: ${report.sourceCount}`,
    `Public release entries: ${report.publicReleaseCount}`,
    `Duplicate-risk entries: ${report.duplicateCount}`,
    `Average Factory quality score: ${report.averageFactoryQualityScore}`,
    "",
    "## Readiness",
    "",
    ...Object.entries(report.readinessCounts).map(
      ([label, count]) => `- ${label}: ${count}`,
    ),
    "",
    "## Recommendations",
    "",
    ...report.recommendations.map((item) => `- ${item}`),
    "",
    "This corpus is local research memory. It is not a legal patent filing, not a patentability opinion, and not a freedom-to-operate opinion.",
    "",
  ].join("\n");
}

function renderPublicReleases(releases: CorpusPublicReleaseEntry[]): string {
  return [
    "# Public Open Invention Registry",
    "",
    "This registry tracks Open Inventions, Defensive Publications, and dry-run release packages prepared by Sovryn. It is not a legal patent filing.",
    "",
    ...(releases.length === 0
      ? ["No public or dry-run releases recorded yet."]
      : releases.flatMap((release) => [
          `## ${release.title}`,
          "",
          `- Release ID: ${release.releaseId}`,
          `- Status: ${release.status}`,
          `- Publication mode: ${release.publicationMode}`,
          `- Dry run: ${String(release.dryRun)}`,
          `- URL: ${release.url ?? "not published"}`,
          `- Release path: ${release.releasePath ?? "not staged"}`,
          "",
        ])),
  ].join("\n");
}

function publicInvention(invention: CorpusInventionEntry) {
  return {
    inventionId: invention.inventionId,
    slug: invention.slug,
    title: invention.title,
    status: invention.status,
    publicationMode: invention.publicationMode,
    license: invention.license,
    factoryRunId: invention.factoryRunId,
    selectedCandidateId: invention.selectedCandidateId,
    publicationUrl: invention.publicationUrl,
    dryRunPublication: invention.dryRunPublication,
    updatedAt: invention.updatedAt,
    evidenceHashCount: invention.evidenceHashCount,
  };
}

function buildCorpusGraph(input: {
  index: CorpusIndex;
  claimFeatures: Array<Record<string, unknown>>;
  releaseCandidates: Array<Record<string, unknown>>;
  qualityScores: Array<Record<string, unknown>>;
}) {
  const nodes: Array<Record<string, unknown>> = [];
  const edges: Array<Record<string, unknown>> = [];
  for (const run of input.index.factoryRuns) {
    nodes.push({
      id: `factory:${run.factoryId}`,
      kind: "factory",
      title: run.researchGoal,
      readinessLabel: run.readinessLabel,
      qualityScore: run.qualityScore,
    });
    for (const missionId of run.generatedInventionMissionIds) {
      edges.push({
        from: `factory:${run.factoryId}`,
        to: `invention:${missionId}`,
        kind: "generated",
      });
    }
  }
  for (const invention of input.index.inventions) {
    nodes.push({
      id: `invention:${invention.inventionId}`,
      kind: "invention",
      title: invention.title,
      status: invention.status,
      publicationMode: invention.publicationMode,
    });
    if (invention.factoryRunId) {
      edges.push({
        from: `factory:${invention.factoryRunId}`,
        to: `invention:${invention.inventionId}`,
        kind: "dossier-bound",
      });
    }
  }
  for (const source of input.index.sources) {
    nodes.push({
      id: `source:${source.sourceKey}`,
      kind: "source",
      title: source.title,
      sourceType: source.sourceType,
      readingDepth: source.readingDepth,
    });
    for (const factoryId of source.factoryRunIds) {
      edges.push({
        from: `source:${source.sourceKey}`,
        to: `factory:${factoryId}`,
        kind: "supports",
      });
    }
  }
  for (const release of input.index.publicReleases) {
    nodes.push({
      id: `release:${release.releaseId}`,
      kind: "release",
      title: release.title,
      status: release.status,
      dryRun: release.dryRun,
    });
    if (release.factoryRunId) {
      edges.push({
        from: `factory:${release.factoryRunId}`,
        to: `release:${release.releaseId}`,
        kind: "release-package",
      });
    }
    if (release.inventionId) {
      edges.push({
        from: `invention:${release.inventionId}`,
        to: `release:${release.releaseId}`,
        kind: "release-package",
      });
    }
  }
  for (const duplicate of input.index.duplicates) {
    edges.push({
      from: `${duplicate.leftKind}:${duplicate.leftId}`,
      to: `${duplicate.rightKind}:${duplicate.rightId}`,
      kind: "duplicate-risk",
      risk: duplicate.duplicateRisk,
      similarityScore: duplicate.similarityScore,
    });
  }
  const graph = {
    kind: "public_corpus_graph",
    generatedAt: input.index.generatedAt,
    nodes: nodes.sort((a, b) =>
      stringValue(a.id).localeCompare(stringValue(b.id)),
    ),
    edges: edges.sort(
      (a, b) =>
        stringValue(a.from).localeCompare(stringValue(b.from)) ||
        stringValue(a.to).localeCompare(stringValue(b.to)) ||
        stringValue(a.kind).localeCompare(stringValue(b.kind)),
    ),
    summary: {
      factoryRunCount: input.index.factoryRuns.length,
      inventionCount: input.index.inventions.length,
      sourceCount: input.index.sources.length,
      claimFeatureCount: input.claimFeatures.length,
      releaseCandidateCount: input.releaseCandidates.length,
      qualityScoreCount: input.qualityScores.length,
    },
    evidenceHash: "",
  };
  graph.evidenceHash = hashEvidence({ ...graph, evidenceHash: "" });
  return graph;
}

function renderPublicCorpusIndex(index: Record<string, unknown>): string {
  return [
    "# Public Corpus Index",
    "",
    `Factory runs: ${index.factoryRunCount}`,
    `Open Inventions: ${index.inventionCount}`,
    `Sources: ${index.sourceCount}`,
    `Release candidates: ${index.releaseCandidateCount}`,
    `Public releases: ${index.publicReleaseCount}`,
    "",
    "This public corpus contains curated Open Invention and research metadata only. It is not a legal patent filing, patentability opinion, legal novelty opinion, or freedom-to-operate opinion.",
    "",
  ].join("\n");
}

function renderPublicInventions(inventions: CorpusInventionEntry[]): string {
  return [
    "# Open Inventions",
    "",
    ...(inventions.length === 0
      ? ["No Open Inventions indexed."]
      : inventions.flatMap((invention) => [
          `## ${invention.title}`,
          "",
          `- ID: ${invention.inventionId}`,
          `- Status: ${invention.status}`,
          `- Publication mode: ${invention.publicationMode}`,
          `- License: ${invention.license ?? "unknown"}`,
          "",
        ])),
  ].join("\n");
}

function renderPublicSources(sources: CorpusSourceEntry[]): string {
  return [
    "# Sources",
    "",
    ...(sources.length === 0
      ? ["No reusable concrete sources indexed."]
      : sources.flatMap((source) => [
          `## ${source.title}`,
          "",
          `- Type: ${source.sourceType}`,
          `- Reading depth: ${source.readingDepth}`,
          `- Evidence strength: ${source.evidenceStrength}`,
          `- Confidence: ${source.confidence}`,
          `- URL: ${source.url ?? "not recorded"}`,
          "",
        ])),
  ].join("\n");
}

function renderPublicQuality(scores: Array<Record<string, unknown>>): string {
  return [
    "# Quality Scores",
    "",
    ...(scores.length === 0
      ? ["No quality scores indexed."]
      : scores.map(
          (score) =>
            `- ${stringValue(score.title)}: ${numberValue(score.qualityScore)} (${stringValue(score.qualityLabel)})`,
        )),
    "",
  ].join("\n");
}

function renderPublicDuplicates(duplicates: CorpusDuplicateEntry[]): string {
  return [
    "# Duplicate Risk",
    "",
    ...(duplicates.length === 0
      ? ["No duplicate-risk clusters indexed."]
      : duplicates.map(
          (duplicate) =>
            `- ${duplicate.leftTitle} <-> ${duplicate.rightTitle}: ${duplicate.duplicateRisk} (${duplicate.similarityScore})`,
        )),
    "",
    "Duplicate-risk entries are deterministic similarity signals, not legal conclusions.",
    "",
  ].join("\n");
}

function renderStaticCorpusSite(index: Record<string, unknown>): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    '<meta charset="utf-8">',
    "<title>Sovryn Public Corpus</title>",
    "<body>",
    "<h1>Sovryn Public Corpus</h1>",
    `<p>Factory runs: ${index.factoryRunCount} | Open Inventions: ${index.inventionCount} | Sources: ${index.sourceCount}</p>`,
    "<p>This is a curated Open Invention corpus export. It is not a legal patent filing or patentability opinion.</p>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function explainSummary(input: {
  factory?: CorpusFactoryEntry;
  invention?: CorpusInventionEntry;
  source?: CorpusSourceEntry;
  release?: CorpusPublicReleaseEntry;
}): string {
  if (input.factory) {
    return `${input.factory.readinessLabel} Factory run with score ${input.factory.qualityScore}.`;
  }
  if (input.invention) {
    return `${input.invention.publicationMode} Open Invention with ${input.invention.evidenceHashCount} evidence hashes.`;
  }
  if (input.source) {
    return `${input.source.sourceType} source reused in ${input.source.factoryRunIds.length} Factory run(s).`;
  }
  if (input.release) {
    return input.release.dryRun
      ? "Dry-run public release package."
      : "Recorded public release.";
  }
  return "Corpus item.";
}

function publicEvidenceRefs(input: {
  factory?: CorpusFactoryEntry;
  invention?: CorpusInventionEntry;
  source?: CorpusSourceEntry;
  release?: CorpusPublicReleaseEntry;
}): string[] {
  if (input.factory) return input.factory.evidenceRefs;
  if (input.invention) {
    return [
      join(".sovryn", "inventions", input.invention.slug, "dossier.json"),
    ];
  }
  if (input.source) {
    return input.source.factoryRunIds.map(
      (factoryId) => `factory:${factoryId}`,
    );
  }
  if (input.release) {
    return [
      input.release.releasePath ?? input.release.url ?? input.release.slug,
    ];
  }
  return [];
}

async function readDirectoryText(root: string): Promise<string> {
  const chunks: string[] = [];
  for (const entry of await readdir(root)) {
    const path = join(root, entry);
    const info = await stat(path);
    if (info.isDirectory()) chunks.push(await readDirectoryText(path));
    else if (info.isFile()) chunks.push(await readFile(path, "utf8"));
  }
  return chunks.join("\n");
}

async function listFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(root)) {
    const path = join(root, entry);
    const info = await stat(path);
    if (info.isFile()) files.push(entry);
  }
  return files.sort();
}

function corpusGate(
  code: string,
  passed: boolean,
  message: string,
  details: Record<string, unknown>,
) {
  return { code, passed, message, details };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? sanitizePublicText(value) : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function sanitizePublicText(value: string): string {
  return value
    .replace(/raw command logs?/gi, "unredacted execution transcripts")
    .replace(/raw logs?/gi, "unredacted transcripts")
    .replace(/\bstdout\b/gi, "redacted output")
    .replace(/\bstderr\b/gi, "redacted error output")
    .replace(/command-journal/gi, "redacted command metadata");
}
