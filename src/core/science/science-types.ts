export type ScientificStudyStatus =
  | "planned"
  | "hypothesized"
  | "designed"
  | "blocked"
  | "reviewed";

export type ScienceGateCode =
  | "SCIENCE_QUESTION_PRESENT"
  | "HYPOTHESIS_PRESENT"
  | "NULL_HYPOTHESIS_PRESENT"
  | "EXPERIMENT_DESIGN_PRESENT"
  | "BASELINE_PRESENT"
  | "METRICS_PRESENT"
  | "FALSIFICATION_CRITERIA_PRESENT"
  | "SAFETY_SCOPE_PRESENT"
  | "NO_UNSAFE_DOMAIN_CONTENT"
  | "NO_UNSUPPORTED_SCIENTIFIC_CLAIMS";

export type SafetyScope = {
  domain: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  allowedMethods: string[];
  blockedMethods: string[];
  safetyNotes: string[];
  blocked: boolean;
  blockedReasons: string[];
};

export type ScientificStudy = {
  studyId: string;
  slug: string;
  status: ScientificStudyStatus;
  createdAt: string;
  updatedAt: string;
  questionId: string | null;
  hypothesisIds: string[];
  experimentIds: string[];
  safetyScope: SafetyScope | null;
  artifactRefs: string[];
};

export type ScientificQuestion = {
  questionId: string;
  studyId: string;
  field: string;
  problemStatement: string;
  whyItMatters: string;
  measurableOutcome: string;
  requiredData: string[];
  expectedExperimentType: string;
  safetyScope: SafetyScope;
  publicSourceNeeds: string[];
  priorCorpusResultsUsed: string[];
  openQuestions: string[];
  evidenceHash: string;
};

export type ScientificHypothesis = {
  hypothesisId: string;
  questionId: string;
  hypothesisStatement: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  measurablePrediction: string;
  falsificationCriteria: string[];
  requiredData: string[];
  baselineMethod: string;
  expectedEffect: string;
  possibleConfounders: string[];
  safetyScope: SafetyScope;
  confidenceBeforeExperiment: number;
  evidenceHash: string;
};

export type ScientificHypotheses = {
  studyId: string;
  questionId: string;
  hypotheses: ScientificHypothesis[];
  evidenceHash: string;
};

export type ExperimentDesign = {
  experimentId: string;
  studyId: string;
  hypothesisId: string;
  datasetPlan: string;
  syntheticDataPlan: string;
  publicDataPlan: string;
  variables: string[];
  controls: string[];
  baseline: string;
  metrics: string[];
  successCriteria: string[];
  failureCriteria: string[];
  ablationPlan: string[];
  sensitivityPlan: string[];
  replicationPlan: string;
  statisticalPlan: string;
  instrumentRequirements: string[];
  workerProfile: "sandbox-local" | "container-netoff";
  safetyReview: SafetyScope;
  evidenceHash: string;
};

export type ScienceGateResult = {
  code: ScienceGateCode;
  passed: boolean;
  severity: "info" | "warning" | "blocking";
  message: string;
  evidencePath: string | null;
  expectedFix: string | null;
};

export type ScienceReview = {
  studyId: string;
  slug: string;
  status: "passed" | "blocked";
  reviewedAt: string;
  gates: ScienceGateResult[];
  blockingReasons: string[];
  limitations: string[];
  evidenceHash: string;
  artifactRefs: string[];
};
