export type ReleaseCandidateScore = {
  releaseReadinessScore: number;
  publicEvidenceScore: number;
  reproducibilityScore: number;
  sourceStrengthScore: number;
  noveltyRiskScore: number;
  safetyRiskScore: number;
  corpusDuplicateRisk: number;
  humanReviewPriority: "low" | "medium" | "high";
};

export type ReleaseCandidateGate = {
  code: string;
  passed: boolean;
  message: string;
  details: Record<string, unknown>;
};

export type ReleaseCandidate = {
  candidateId: string;
  title: string;
  researchGoal: string;
  factoryId: string;
  factorySlug: string;
  inventionMissionId: string;
  inventionSlug: string;
  readinessLabel: string;
  score: ReleaseCandidateScore;
  gates: ReleaseCandidateGate[];
  releasePath: string;
  publicationIntentPath: string;
  corpusDuplicateRiskReviewed: boolean;
  humanReviewRequired: boolean;
  limitations: string[];
  evidenceHash: string;
};

export type ReleaseCandidateBuild = {
  kind: "release_candidate_build";
  builtAt: string;
  requestedMax: number;
  candidates: ReleaseCandidate[];
  corpusIndexHash: string | null;
  evidenceHash: string;
};

export type ReleaseCandidateReview = {
  kind: "release_candidate_review";
  reviewedAt: string;
  allowed: boolean;
  candidates: ReleaseCandidate[];
  checks: ReleaseCandidateGate[];
  blockingReasons: string[];
  evidenceHash: string;
};

export type PublicationQueue = {
  kind: "publication_queue";
  createdAt: string;
  candidates: Array<{
    candidateId: string;
    title: string;
    factoryId: string;
    inventionMissionId: string;
    releaseReadinessScore: number;
    humanReviewPriority: "low" | "medium" | "high";
    recommendedAction: "human_review" | "improve_first" | "block";
  }>;
  evidenceHash: string;
};
