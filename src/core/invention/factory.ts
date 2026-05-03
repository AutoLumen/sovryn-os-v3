import type { InventionDossier } from "./invention-types.js";
import { hashEvidence } from "./pipeline.js";

export type FactoryFeature = {
  id: string;
  title: string;
  source: string;
  sourceType: string;
  evidenceStrength: "low" | "medium" | "high";
  summary: string;
  mechanism: string;
};

export type NoveltyGap = {
  id: string;
  title: string;
  gapType: "architecture" | "workflow" | "verification" | "publication";
  evidenceBasis: string[];
  opportunity: string;
  risk: "low" | "medium" | "high";
};

export type InventionCandidate = {
  id: string;
  title: string;
  summary: string;
  proposedSolution: string;
  gapsAddressed: string[];
  prototypeScope: string;
  risk: "low" | "medium" | "high";
  score: number;
};

export type FactorySelection = {
  selectedCandidateId: string;
  selectedTitle: string;
  reason: string;
  rejectedCandidateIds: string[];
};

export type FactoryScore = {
  scoreType: "factory_readiness";
  score: number;
  strength: "weak" | "moderate" | "strong";
  canPublishStrongly: boolean;
  featureCount: number;
  highStrengthFeatures: number;
  noveltyGapCount: number;
  candidateCount: number;
  selectedCandidateScore: number;
  concreteSourcesRead: number;
  needsMoreResearch: boolean;
  blockers: string[];
  evidenceHash: string;
};

export type FactoryResult = {
  features: {
    kind: "factory_features";
    features: FactoryFeature[];
    evidenceHash: string;
  };
  gaps: {
    kind: "novelty_gaps";
    gaps: NoveltyGap[];
    evidenceHash: string;
  };
  candidates: {
    kind: "invention_candidates";
    candidates: InventionCandidate[];
    evidenceHash: string;
  };
  selection: {
    kind: "factory_selection";
    selection: FactorySelection;
    selectedCandidate: InventionCandidate;
    evidenceHash: string;
  };
  score: FactoryScore;
  reportMarkdown: string;
};

export function buildFactoryMode(input: {
  goal: string;
  dossier: InventionDossier;
  publicSourceSearch: Record<string, unknown>;
  sourceReadings: Record<string, unknown>;
}): FactoryResult {
  const readings = arrayOfRecords(input.sourceReadings.readings);
  const sourceResults = arrayOfRecords(input.publicSourceSearch.results);
  const features = hashObject({
    kind: "factory_features" as const,
    features: extractFeatures(input.goal, sourceResults, readings),
    evidenceHash: "",
  });
  const gaps = hashObject({
    kind: "novelty_gaps" as const,
    gaps: extractNoveltyGaps(input.goal, input.dossier, features.features),
    evidenceHash: "",
  });
  const candidates = hashObject({
    kind: "invention_candidates" as const,
    candidates: generateCandidates(input.goal, input.dossier, gaps.gaps),
    evidenceHash: "",
  });
  const selectedCandidate = [...candidates.candidates].sort(
    (a, b) => b.score - a.score,
  )[0];
  const selection = hashObject({
    kind: "factory_selection" as const,
    selection: {
      selectedCandidateId: selectedCandidate.id,
      selectedTitle: selectedCandidate.title,
      reason:
        "Selected highest-scoring candidate balancing novelty gaps, prototype scope, and publication-gate fit.",
      rejectedCandidateIds: candidates.candidates
        .filter((candidate) => candidate.id !== selectedCandidate.id)
        .map((candidate) => candidate.id),
    },
    selectedCandidate,
    evidenceHash: "",
  });
  const score = scoreFactory({
    features: features.features,
    gaps: gaps.gaps,
    candidates: candidates.candidates,
    selectedCandidate,
    concreteSourcesRead: readings.filter(
      (reading) =>
        reading.kind === "concrete_source" && reading.readStatus === "read",
    ).length,
  });
  return {
    features,
    gaps,
    candidates,
    selection,
    score,
    reportMarkdown: renderFactoryReport({
      goal: input.goal,
      dossier: input.dossier,
      features: features.features,
      gaps: gaps.gaps,
      candidates: candidates.candidates,
      selection: selection.selection,
      selectedCandidate,
      score,
    }),
  };
}

function extractFeatures(
  goal: string,
  sourceResults: Record<string, unknown>[],
  readings: Record<string, unknown>[],
): FactoryFeature[] {
  const sourceFeatures = readings.flatMap((reading, index) => {
    const title = stringValue(reading.title, `Source reading ${index + 1}`);
    const readStatus = stringValue(reading.readStatus, "unknown");
    if (readStatus !== "read") return [];
    return [
      {
        id: `read-${index + 1}`,
        title: `Deep reading signal: ${title}`,
        source: title,
        sourceType: stringValue(reading.sourceType, "unknown"),
        evidenceStrength: "high" as const,
        summary: stringValue(reading.summary, "No summary available."),
        mechanism: stringValue(
          reading.keyTechnicalMechanism,
          "No mechanism extracted.",
        ),
      },
    ];
  });
  const metadataFeatures = sourceResults.flatMap((source, index) => {
    if (stringValue(source.kind, "") !== "concrete_source") return [];
    const title = stringValue(source.title, `Source ${index + 1}`);
    return [
      {
        id: `metadata-${index + 1}`,
        title: `Concrete source lead: ${title}`,
        source: title,
        sourceType: stringValue(source.sourceType, "unknown"),
        evidenceStrength: "medium" as const,
        summary: stringValue(source.overlap, "Metadata source lead."),
        mechanism: stringValue(
          source.difference,
          "Mechanism requires source reading.",
        ),
      },
    ];
  });
  const baseline: FactoryFeature[] = [
    {
      id: "sovryn-evidence-bound-research",
      title: "Evidence-bound research workflow",
      source: "Sovryn generated mission artifacts",
      sourceType: "system",
      evidenceStrength: "medium",
      summary: `Factory Mode binds source discovery, source reading, candidate synthesis, verification, and publication gates for: ${goal}.`,
      mechanism:
        "Use evidence hashes and publication policy checks to keep autonomous invention work auditable.",
    },
    {
      id: "sovryn-publication-gated-release",
      title: "Publication-gated open invention release",
      source: "Sovryn publication policy",
      sourceType: "system",
      evidenceStrength: "medium",
      summary:
        "Sovryn Controller controls final publication while Node Alpha prepares research artifacts.",
      mechanism:
        "Separate autonomous preparation from final GitHub credential handling and release gating.",
    },
  ];
  return dedupeFeatures([...sourceFeatures, ...metadataFeatures, ...baseline]);
}

function extractNoveltyGaps(
  goal: string,
  dossier: InventionDossier,
  features: FactoryFeature[],
): NoveltyGap[] {
  const hasDeepReading = features.some(
    (feature) => feature.evidenceStrength === "high",
  );
  return [
    {
      id: "evidence-to-candidate-loop",
      title: "Evidence-to-candidate invention loop",
      gapType: "workflow",
      evidenceBasis: features.slice(0, 3).map((feature) => feature.id),
      opportunity: `Turn rough research goal "${goal}" into candidate inventions selected from source-derived features and novelty gaps.`,
      risk: hasDeepReading ? "medium" : "high",
    },
    {
      id: "publication-strength-gate",
      title: "Factory strength gate before real publication",
      gapType: "publication",
      evidenceBasis: ["sovryn-publication-gated-release"],
      opportunity:
        "Block real publication when the factory evidence score is weak, even if a dossier scaffold exists.",
      risk: "low",
    },
    {
      id: "prototype-bound-defensive-publication",
      title: "Prototype-bound defensive publication",
      gapType: "verification",
      evidenceBasis: ["sovryn-evidence-bound-research"],
      opportunity: `Connect the selected invention candidate to ${dossier.prototypePath} and ${dossier.testsPath} before release.`,
      risk: "medium",
    },
  ];
}

function generateCandidates(
  goal: string,
  dossier: InventionDossier,
  gaps: NoveltyGap[],
): InventionCandidate[] {
  return [
    {
      id: "factory-evidence-loop",
      title: `Evidence-bound factory loop for ${dossier.title}`,
      summary:
        "A deterministic invention factory that converts source readings into feature evidence, novelty gaps, candidates, selected dossier text, prototype scope, and publication-strength gates.",
      proposedSolution:
        "Implement a Factory Mode pipeline that reads public-source evidence, extracts reusable technical features, maps novelty gaps, synthesizes candidate open inventions, selects the strongest candidate, updates the dossier, and blocks weak real publication through Sovryn policy.",
      gapsAddressed: gaps.map((gap) => gap.id),
      prototypeScope:
        "Prototype demonstrates prompt-to-artifact factory metadata and validation gates in the generated Node.js scaffold.",
      risk: "medium",
      score: 86,
    },
    {
      id: "source-reading-gap-scorer",
      title: "Source-reading novelty-gap scorer",
      summary:
        "A focused scorer that ranks novelty risks from deep source readings and source-type diversity.",
      proposedSolution:
        "Score source readings by read depth, source type, overlap, difference, and prototype relevance before producing novelty notes.",
      gapsAddressed: ["evidence-to-candidate-loop"],
      prototypeScope:
        "Prototype exposes scoring inputs and emits a deterministic novelty-risk summary.",
      risk: "low",
      score: 74,
    },
    {
      id: "public-evidence-release-packager",
      title: "Curated public evidence release packager",
      summary:
        "A release packager that publishes curated evidence summaries while keeping raw logs and local execution paths private.",
      proposedSolution:
        "Package source-search, source-reading, source-review, final-verify, and publication-intent summaries as public evidence while excluding raw logs and controller-only metadata.",
      gapsAddressed: ["publication-strength-gate"],
      prototypeScope:
        "Prototype validates public evidence manifest generation and scanner coverage.",
      risk: "low",
      score: 68,
    },
  ];
}

function scoreFactory(input: {
  features: FactoryFeature[];
  gaps: NoveltyGap[];
  candidates: InventionCandidate[];
  selectedCandidate: InventionCandidate;
  concreteSourcesRead: number;
}): FactoryScore {
  const highStrengthFeatures = input.features.filter(
    (feature) => feature.evidenceStrength === "high",
  ).length;
  const blockers = [
    ...(input.concreteSourcesRead === 0
      ? ["No concrete source was deeply read."]
      : []),
    ...(input.features.length < 3 ? ["Too few extracted features."] : []),
    ...(input.gaps.length < 2 ? ["Too few novelty gaps."] : []),
    ...(input.candidates.length < 2 ? ["Too few invention candidates."] : []),
  ];
  const score = Math.max(
    0,
    Math.min(
      100,
      30 +
        Math.min(25, input.features.length * 5) +
        Math.min(20, highStrengthFeatures * 10) +
        Math.min(15, input.gaps.length * 5) +
        Math.min(10, input.candidates.length * 3) -
        blockers.length * 12,
    ),
  );
  const value = {
    scoreType: "factory_readiness" as const,
    score,
    strength:
      score >= 80
        ? ("strong" as const)
        : score >= 60
          ? ("moderate" as const)
          : ("weak" as const),
    canPublishStrongly: score >= 60 && blockers.length === 0,
    featureCount: input.features.length,
    highStrengthFeatures,
    noveltyGapCount: input.gaps.length,
    candidateCount: input.candidates.length,
    selectedCandidateScore: input.selectedCandidate.score,
    concreteSourcesRead: input.concreteSourcesRead,
    needsMoreResearch: blockers.length > 0,
    blockers,
    evidenceHash: "",
  };
  value.evidenceHash = hashEvidence(value);
  return value;
}

function renderFactoryReport(input: {
  goal: string;
  dossier: InventionDossier;
  features: FactoryFeature[];
  gaps: NoveltyGap[];
  candidates: InventionCandidate[];
  selection: FactorySelection;
  selectedCandidate: InventionCandidate;
  score: FactoryScore;
}): string {
  return [
    "# Factory Mode Report",
    "",
    `Goal: ${input.goal}`,
    `Mission: ${input.dossier.title}`,
    "",
    "## Selected Candidate",
    "",
    `Selected: ${input.selection.selectedTitle}`,
    "",
    input.selectedCandidate.summary,
    "",
    "## Factory Score",
    "",
    `Score: ${input.score.score}`,
    `Strength: ${input.score.strength}`,
    `Can publish strongly: ${String(input.score.canPublishStrongly)}`,
    "",
    "## Extracted Features",
    "",
    ...input.features.map(
      (feature) =>
        `- ${feature.title} (${feature.evidenceStrength}): ${feature.summary}`,
    ),
    "",
    "## Novelty Gaps",
    "",
    ...input.gaps.map((gap) => `- ${gap.title}: ${gap.opportunity}`),
    "",
    "## Candidate Inventions",
    "",
    ...input.candidates.map(
      (candidate) =>
        `- ${candidate.title} (${candidate.score}): ${candidate.summary}`,
    ),
    "",
    "This report is an open research artifact and does not make legal novelty, patentability, or freedom-to-operate conclusions.",
    "",
  ].join("\n");
}

function hashObject<T extends { evidenceHash: string }>(value: T): T {
  value.evidenceHash = hashEvidence(value);
  return value;
}

function dedupeFeatures(features: FactoryFeature[]): FactoryFeature[] {
  const seen = new Set<string>();
  const out: FactoryFeature[] = [];
  for (const feature of features) {
    if (seen.has(feature.id)) continue;
    seen.add(feature.id);
    out.push(feature);
  }
  return out;
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object",
      )
    : [];
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}
