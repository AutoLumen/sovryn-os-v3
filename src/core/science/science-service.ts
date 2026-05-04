import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { hashEvidence } from "../invention/pipeline.js";
import type {
  ExperimentDesign,
  SafetyScope,
  ScienceGateCode,
  ScienceGateResult,
  ScienceReview,
  ScientificHypotheses,
  ScientificHypothesis,
  ScientificQuestion,
  ScientificStudy,
} from "./science-types.js";

type StudyIndex = {
  kind: "science_study_index";
  updatedAt: string;
  studies: Array<{
    studyId: string;
    slug: string;
    questionId: string | null;
    status: string;
    updatedAt: string;
  }>;
};

type QuestionResult = {
  study: ScientificStudy;
  question: ScientificQuestion;
  artifactRefs: string[];
};

type HypothesizeResult = {
  study: ScientificStudy;
  hypotheses: ScientificHypotheses;
  artifactRefs: string[];
};

type ExperimentDesignResult = {
  study: ScientificStudy;
  experimentDesign: ExperimentDesign;
  artifactRefs: string[];
};

export class ScienceService {
  constructor(private readonly root: string) {}

  async question(problem: string): Promise<QuestionResult> {
    const problemStatement = normalizedProblem(problem);
    const safetyScope = analyzeSafety(problemStatement);
    if (safetyScope.blocked) {
      throw new AppError(
        "SCIENCE_UNSAFE_DOMAIN_BLOCKED",
        "Science question was blocked by the computational-science safety scope.",
        {
          blockedReasons: safetyScope.blockedReasons,
          safetyScope,
        },
      );
    }

    await mkdir(this.scienceRoot(), { recursive: true });
    const field = inferField(problemStatement);
    const slug = slugify(`${field} ${problemStatement}`);
    const studyId = stableId("sci", problemStatement);
    const questionId = stableId("sci-q", problemStatement);
    const now = nowIso();
    const studyDir = this.studyDir(slug);
    await mkdir(studyDir, { recursive: true });

    const question: ScientificQuestion = withEvidenceHash({
      questionId,
      studyId,
      field,
      problemStatement,
      whyItMatters: whyItMattersFor(problemStatement, field),
      measurableOutcome: measurableOutcomeFor(problemStatement),
      requiredData: requiredDataFor(problemStatement),
      expectedExperimentType:
        "bounded computational experiment with synthetic data, baseline comparison, replication plan, and falsification criteria",
      safetyScope,
      publicSourceNeeds: [
        "Prior methods for anomaly detection and provenance-aware data quality scoring.",
        "Public documentation for reproducible benchmark design and error analysis.",
        "Corpus evidence from related Sovryn data-quality results when available.",
      ],
      priorCorpusResultsUsed: priorCorpusHints(problemStatement),
      openQuestions: [
        "How much does provenance scoring reduce false positives on controlled synthetic data?",
        "Which confounders make the provenance-aware method fail?",
        "Does the method still work when provenance labels are noisy or incomplete?",
      ],
    });

    const artifactRefs = [
      rel(studyDir, this.root, "study.json"),
      rel(studyDir, this.root, "question.json"),
      rel(studyDir, this.root, "safety-scope.json"),
      rel(studyDir, this.root, "SCIENCE_PLAN.md"),
      rel(studyDir, this.root, "STUDY_STATUS.md"),
    ];
    const study: ScientificStudy = {
      studyId,
      slug,
      status: "planned",
      createdAt: now,
      updatedAt: now,
      questionId,
      hypothesisIds: [],
      experimentIds: [],
      safetyScope,
      artifactRefs,
    };

    await this.writeStudyArtifacts(study, question, null, null);
    await this.updateIndex(study);
    return {
      study,
      question,
      artifactRefs,
    };
  }

  async hypothesize(questionId: string): Promise<HypothesizeResult> {
    const { study, dir } = await this.findStudyByQuestionId(questionId);
    const question = await readJson<ScientificQuestion>(
      join(dir, "question.json"),
    );
    assertSafeScope(question.safetyScope);

    const hypothesesList = [
      buildPrimaryHypothesis(study.studyId, question),
      buildRobustnessHypothesis(study.studyId, question),
    ];
    const hypotheses: ScientificHypotheses = withEvidenceHash({
      studyId: study.studyId,
      questionId,
      hypotheses: hypothesesList,
    });

    const updated: ScientificStudy = {
      ...study,
      status: "hypothesized",
      updatedAt: nowIso(),
      hypothesisIds: hypothesesList.map(
        (hypothesis) => hypothesis.hypothesisId,
      ),
      artifactRefs: uniqueRefs([
        ...study.artifactRefs,
        rel(dir, this.root, "hypotheses.json"),
      ]),
    };
    await this.writeStudyArtifacts(updated, question, hypotheses, null);
    await this.updateIndex(updated);
    return {
      study: updated,
      hypotheses,
      artifactRefs: updated.artifactRefs,
    };
  }

  async designExperiment(
    hypothesisId: string,
  ): Promise<ExperimentDesignResult> {
    const { study, dir, hypotheses } =
      await this.findStudyByHypothesisId(hypothesisId);
    const question = await readJson<ScientificQuestion>(
      join(dir, "question.json"),
    );
    assertSafeScope(question.safetyScope);
    const hypothesis = hypotheses.hypotheses.find(
      (candidate) => candidate.hypothesisId === hypothesisId,
    );
    if (!hypothesis) {
      throw new AppError(
        "SCIENCE_HYPOTHESIS_NOT_FOUND",
        `Hypothesis not found: ${hypothesisId}`,
        { hypothesisId },
      );
    }

    const design: ExperimentDesign = withEvidenceHash({
      experimentId: stableId("sci-exp", `${study.studyId}:${hypothesisId}`),
      studyId: study.studyId,
      hypothesisId,
      datasetPlan:
        "Use three deterministic synthetic energy-usage datasets with labeled normal cases, weather-related high usage, missing intervals, duplicates, weak provenance records, and true anomaly spikes.",
      syntheticDataPlan:
        "Generate seeded toy meter records only; no private smart-meter data, household identity, or surveillance use case is allowed.",
      publicDataPlan:
        "Public data is optional for this alpha step. If used later, only aggregate non-personal energy benchmark data may be read and source-carded.",
      variables: [
        "provenance reliability label",
        "weather-normalized usage residual",
        "simple usage threshold",
        "missing interval indicator",
        "duplicate record indicator",
      ],
      controls: [
        "same seeded datasets for baseline and candidate detector",
        "same anomaly labels for both methods",
        "same threshold sweep for sensitivity analysis",
      ],
      baseline: hypothesis.baselineMethod,
      metrics: [
        "true positives",
        "false positives",
        "true negatives",
        "false negatives",
        "precision",
        "recall",
        "false positive rate",
        "false negative rate",
      ],
      successCriteria: [
        "candidate false-positive rate is lower than baseline on weather-related normal high-usage cases",
        "candidate recall does not drop by more than 0.05 compared with baseline",
        "result remains stable across at least three seeded replications",
      ],
      failureCriteria: [
        "baseline has equal or lower false-positive rate with comparable recall",
        "candidate fails on normal high-usage weather cases",
        "candidate relies on unsupported causal or production-readiness claims",
      ],
      ablationPlan: [
        "remove provenance score",
        "remove weather-normalization feature",
        "remove missing-interval feature",
      ],
      sensitivityPlan: [
        "sweep anomaly threshold from 1.5 to 3.0 standard deviations",
        "sweep provenance penalty weight from 0.0 to 1.0",
        "sweep weather-normalization weight from 0.0 to 1.0",
      ],
      replicationPlan:
        "Run the same experiment on at least three deterministic seeds, record dataset hashes, and mark the hypothesis inconclusive if metrics vary materially.",
      statisticalPlan:
        "Compute confusion metrics, false-positive reduction, effect size, and a bootstrap confidence interval where feasible.",
      instrumentRequirements: [
        "threshold-baseline-detector",
        "provenance-aware-energy-detector",
        "experiment-runner",
      ],
      workerProfile: "container-netoff",
      safetyReview: question.safetyScope,
    });

    const updated: ScientificStudy = {
      ...study,
      status: "designed",
      updatedAt: nowIso(),
      experimentIds: uniqueRefs([...study.experimentIds, design.experimentId]),
      artifactRefs: uniqueRefs([
        ...study.artifactRefs,
        rel(dir, this.root, "experiment-design.json"),
      ]),
    };
    await this.writeStudyArtifacts(updated, question, hypotheses, design);
    await this.updateIndex(updated);
    return {
      study: updated,
      experimentDesign: design,
      artifactRefs: updated.artifactRefs,
    };
  }

  async status(studyId: string): Promise<Record<string, unknown>> {
    const { study, dir } = await this.findStudy(studyId);
    const question = await readOptionalJson<ScientificQuestion>(
      join(dir, "question.json"),
    );
    const hypotheses = await readOptionalJson<ScientificHypotheses>(
      join(dir, "hypotheses.json"),
    );
    const experimentDesign = await readOptionalJson<ExperimentDesign>(
      join(dir, "experiment-design.json"),
    );
    return {
      studyId: study.studyId,
      slug: study.slug,
      status: study.status,
      questionId: study.questionId,
      hypothesisCount: hypotheses?.hypotheses.length ?? 0,
      experimentCount: experimentDesign ? 1 : 0,
      safetyBlocked: question?.safetyScope.blocked ?? false,
      artifactRefs: study.artifactRefs,
    };
  }

  async review(studyId: string): Promise<ScienceReview> {
    const { study, dir } = await this.findStudy(studyId);
    const question = await readOptionalJson<ScientificQuestion>(
      join(dir, "question.json"),
    );
    const hypotheses = await readOptionalJson<ScientificHypotheses>(
      join(dir, "hypotheses.json"),
    );
    const experimentDesign = await readOptionalJson<ExperimentDesign>(
      join(dir, "experiment-design.json"),
    );
    const gates = buildReviewGates({
      dir,
      root: this.root,
      question,
      hypotheses,
      experimentDesign,
    });
    const blockingReasons = gates
      .filter((gate) => !gate.passed && gate.severity === "blocking")
      .map((gate) => `${gate.code}: ${gate.message}`);
    const review: ScienceReview = {
      studyId: study.studyId,
      slug: study.slug,
      status: blockingReasons.length === 0 ? "passed" : "blocked",
      reviewedAt: nowIso(),
      gates,
      blockingReasons,
      limitations: [
        "This alpha scientific-method layer plans a computational study; it does not yet execute experiments or compute statistics.",
        "No legal patentability, legal novelty, or freedom-to-operate conclusion is made.",
        "Scientific support requires later experiment execution, baseline comparison, replication, and falsification.",
      ],
      evidenceHash: "",
      artifactRefs: uniqueRefs([
        ...study.artifactRefs,
        rel(dir, this.root, "science-review.json"),
        rel(dir, this.root, "SCIENCE_REVIEW.md"),
      ]),
    };
    review.evidenceHash = hashEvidence({
      ...review,
      evidenceHash: "",
    });
    await writeJson(join(dir, "science-review.json"), review);
    await writeFile(join(dir, "SCIENCE_REVIEW.md"), renderReview(review));
    const updated: ScientificStudy = {
      ...study,
      status: review.status === "passed" ? "reviewed" : "blocked",
      updatedAt: nowIso(),
      artifactRefs: review.artifactRefs,
    };
    await writeJson(join(dir, "study.json"), updated);
    await writeFile(join(dir, "STUDY_STATUS.md"), renderStatus(updated));
    await this.updateIndex(updated);
    return review;
  }

  private scienceRoot(): string {
    return join(this.root, ".sovryn", "science");
  }

  private studiesRoot(): string {
    return join(this.scienceRoot(), "studies");
  }

  private studyDir(slug: string): string {
    return join(this.studiesRoot(), slug);
  }

  private async writeStudyArtifacts(
    study: ScientificStudy,
    question: ScientificQuestion,
    hypotheses: ScientificHypotheses | null,
    experimentDesign: ExperimentDesign | null,
  ): Promise<void> {
    const dir = this.studyDir(study.slug);
    await mkdir(dir, { recursive: true });
    await writeJson(join(dir, "study.json"), study);
    await writeJson(join(dir, "question.json"), question);
    await writeJson(join(dir, "safety-scope.json"), question.safetyScope);
    if (hypotheses) await writeJson(join(dir, "hypotheses.json"), hypotheses);
    if (experimentDesign) {
      await writeJson(join(dir, "experiment-design.json"), experimentDesign);
    }
    await writeFile(
      join(dir, "SCIENCE_PLAN.md"),
      renderSciencePlan(study, question, hypotheses, experimentDesign),
      "utf8",
    );
    await writeFile(join(dir, "STUDY_STATUS.md"), renderStatus(study), "utf8");
  }

  private async updateIndex(study: ScientificStudy): Promise<void> {
    await mkdir(this.scienceRoot(), { recursive: true });
    const path = join(this.scienceRoot(), "index.json");
    const existing = await readOptionalJson<StudyIndex>(path);
    const studies = [
      ...(existing?.studies ?? []).filter(
        (candidate) => candidate.studyId !== study.studyId,
      ),
      {
        studyId: study.studyId,
        slug: study.slug,
        questionId: study.questionId,
        status: study.status,
        updatedAt: study.updatedAt,
      },
    ].sort((left, right) => left.studyId.localeCompare(right.studyId));
    await writeJson(path, {
      kind: "science_study_index",
      updatedAt: nowIso(),
      studies,
    } satisfies StudyIndex);
  }

  private async findStudy(
    idOrSlug: string,
  ): Promise<{ study: ScientificStudy; dir: string }> {
    const studiesRoot = this.studiesRoot();
    const candidates = await listStudyDirs(studiesRoot);
    for (const slug of candidates) {
      const dir = join(studiesRoot, slug);
      const study = await readOptionalJson<ScientificStudy>(
        join(dir, "study.json"),
      );
      if (study && (study.studyId === idOrSlug || study.slug === idOrSlug)) {
        return { study, dir };
      }
    }
    throw new AppError(
      "SCIENCE_STUDY_NOT_FOUND",
      `Study not found: ${idOrSlug}`,
      {
        studyId: idOrSlug,
      },
    );
  }

  private async findStudyByQuestionId(
    questionId: string,
  ): Promise<{ study: ScientificStudy; dir: string }> {
    const studiesRoot = this.studiesRoot();
    const candidates = await listStudyDirs(studiesRoot);
    for (const slug of candidates) {
      const dir = join(studiesRoot, slug);
      const question = await readOptionalJson<ScientificQuestion>(
        join(dir, "question.json"),
      );
      const study = await readOptionalJson<ScientificStudy>(
        join(dir, "study.json"),
      );
      if (question?.questionId === questionId && study) return { study, dir };
    }
    throw new AppError(
      "SCIENCE_QUESTION_NOT_FOUND",
      `Science question not found: ${questionId}`,
      { questionId },
    );
  }

  private async findStudyByHypothesisId(hypothesisId: string): Promise<{
    study: ScientificStudy;
    dir: string;
    hypotheses: ScientificHypotheses;
  }> {
    const studiesRoot = this.studiesRoot();
    const candidates = await listStudyDirs(studiesRoot);
    for (const slug of candidates) {
      const dir = join(studiesRoot, slug);
      const hypotheses = await readOptionalJson<ScientificHypotheses>(
        join(dir, "hypotheses.json"),
      );
      const study = await readOptionalJson<ScientificStudy>(
        join(dir, "study.json"),
      );
      if (
        hypotheses?.hypotheses.some(
          (candidate) => candidate.hypothesisId === hypothesisId,
        ) &&
        study
      ) {
        return { study, dir, hypotheses };
      }
    }
    throw new AppError(
      "SCIENCE_HYPOTHESIS_NOT_FOUND",
      `Science hypothesis not found: ${hypothesisId}`,
      { hypothesisId },
    );
  }
}

function buildPrimaryHypothesis(
  studyId: string,
  question: ScientificQuestion,
): ScientificHypothesis {
  return withEvidenceHash({
    hypothesisId: stableId("sci-h", `${studyId}:primary`),
    questionId: question.questionId,
    hypothesisStatement:
      "A provenance-aware anomaly scoring method will reduce false positives on weather-related normal high-usage records compared with a simple threshold baseline.",
    nullHypothesis:
      "A provenance-aware anomaly scoring method will not reduce the false-positive rate compared with a simple threshold baseline on the same synthetic energy-usage records.",
    alternativeHypothesis:
      "Provenance-aware scoring reduces false positives while preserving materially similar recall for true anomaly spikes.",
    measurablePrediction:
      "The candidate detector has a lower false-positive rate than the threshold baseline across at least three deterministic synthetic dataset seeds, while recall decreases by no more than 0.05.",
    falsificationCriteria: [
      "The threshold baseline has equal or lower false-positive rate with comparable recall.",
      "Normal high usage caused by weather is still flagged as anomalous by the candidate method.",
      "Performance improvement disappears when provenance labels are noisy but non-adversarial.",
    ],
    requiredData: question.requiredData,
    baselineMethod: "simple threshold baseline over energy usage residuals",
    expectedEffect:
      "Lower false-positive rate on normal but high-usage weather cases without hiding true anomaly spikes.",
    possibleConfounders: [
      "synthetic provenance labels may be too clean",
      "weather normalization may explain more variance than provenance scoring",
      "threshold tuning may change the apparent effect size",
    ],
    safetyScope: question.safetyScope,
    confidenceBeforeExperiment: 55,
  });
}

function buildRobustnessHypothesis(
  studyId: string,
  question: ScientificQuestion,
): ScientificHypothesis {
  return withEvidenceHash({
    hypothesisId: stableId("sci-h", `${studyId}:robustness`),
    questionId: question.questionId,
    hypothesisStatement:
      "Combining provenance scoring with missing-interval and duplicate-record checks will improve dataset-quality triage compared with anomaly scoring alone.",
    nullHypothesis:
      "Adding provenance, missing-interval, and duplicate-record checks will not improve dataset-quality triage compared with anomaly scoring alone.",
    alternativeHypothesis:
      "A combined detector better separates true anomalies, data-quality defects, and benign high-usage records than an anomaly-only baseline.",
    measurablePrediction:
      "The combined detector records fewer misclassified benign records and separately reports missing intervals and duplicate records across deterministic seeds.",
    falsificationCriteria: [
      "Missing intervals or duplicate records are not detected reliably.",
      "Weak provenance alone causes normal records to be falsely marked as anomalies.",
      "An anomaly-only baseline produces equal or better triage labels under the same metrics.",
    ],
    requiredData: question.requiredData,
    baselineMethod:
      "anomaly-only threshold baseline without provenance features",
    expectedEffect:
      "More specific error categories and lower conflation between measurement anomalies and metadata quality issues.",
    possibleConfounders: [
      "duplicate records may be too easy in a synthetic dataset",
      "missing interval cadence may encode labels too directly",
      "quality triage may improve without improving anomaly detection",
    ],
    safetyScope: question.safetyScope,
    confidenceBeforeExperiment: 50,
  });
}

function buildReviewGates(input: {
  dir: string;
  root: string;
  question: ScientificQuestion | null;
  hypotheses: ScientificHypotheses | null;
  experimentDesign: ExperimentDesign | null;
}): ScienceGateResult[] {
  const questionPath = rel(input.dir, input.root, "question.json");
  const hypothesesPath = rel(input.dir, input.root, "hypotheses.json");
  const designPath = rel(input.dir, input.root, "experiment-design.json");
  const question = input.question;
  const hypotheses = input.hypotheses?.hypotheses ?? [];
  const experimentDesign = input.experimentDesign;
  return [
    gate(
      "SCIENCE_QUESTION_PRESENT",
      Boolean(question?.problemStatement),
      "A scientific question artifact must be present.",
      questionPath,
      'Run `sovryn science question "<field-or-problem>" --json`.',
    ),
    gate(
      "HYPOTHESIS_PRESENT",
      hypotheses.length > 0,
      "At least one hypothesis must be present.",
      hypothesesPath,
      "Run `sovryn science hypothesize <question-id> --json`.",
    ),
    gate(
      "NULL_HYPOTHESIS_PRESENT",
      hypotheses.length > 0 &&
        hypotheses.every((hypothesis) => hypothesis.nullHypothesis.trim()),
      "Every hypothesis must include a null hypothesis.",
      hypothesesPath,
      "Add a nullHypothesis to every hypothesis.",
    ),
    gate(
      "EXPERIMENT_DESIGN_PRESENT",
      Boolean(experimentDesign),
      "An experiment design artifact must be present.",
      designPath,
      "Run `sovryn science experiment design <hypothesis-id> --json`.",
    ),
    gate(
      "BASELINE_PRESENT",
      Boolean(experimentDesign?.baseline?.trim()) &&
        hypotheses.every((hypothesis) => hypothesis.baselineMethod.trim()),
      "The study must define a baseline method.",
      experimentDesign ? designPath : hypothesesPath,
      "Add a baseline method to the hypothesis and experiment design.",
    ),
    gate(
      "METRICS_PRESENT",
      Array.isArray(experimentDesign?.metrics) &&
        experimentDesign.metrics.length >= 2 &&
        experimentDesign.metrics.every((metric) => metric.trim().length > 0),
      "The experiment design must include measurable metrics.",
      designPath,
      "Add precision, recall, false-positive rate, or other measurable metrics.",
    ),
    gate(
      "FALSIFICATION_CRITERIA_PRESENT",
      hypotheses.length > 0 &&
        hypotheses.every(
          (hypothesis) => hypothesis.falsificationCriteria.length > 0,
        ),
      "Hypotheses must define falsification criteria.",
      hypothesesPath,
      "Add explicit criteria that would weaken or reject the hypothesis.",
    ),
    gate(
      "SAFETY_SCOPE_PRESENT",
      Boolean(question?.safetyScope) && question?.safetyScope.blocked === false,
      "The study must include a non-blocked safety scope.",
      rel(input.dir, input.root, "safety-scope.json"),
      "Add a computational-science safety scope and remove unsafe domain content.",
    ),
    gate(
      "NO_UNSAFE_DOMAIN_CONTENT",
      !containsUnsafeText(
        reviewableStudyText(question, hypotheses, experimentDesign),
      ),
      "The study must not contain unsafe wet-lab, hazardous chemistry, exploit, or medical-treatment content.",
      null,
      "Rewrite the study as safe computational analysis over synthetic or public non-sensitive data.",
    ),
    gate(
      "NO_UNSUPPORTED_SCIENTIFIC_CLAIMS",
      !containsUnsupportedClaimLanguage(
        reviewableStudyText(question, hypotheses, experimentDesign),
      ),
      "The alpha plan must not claim proven support before experiments, statistics, replication, and falsification exist.",
      null,
      "Use planned, testable, or candidate language until evidence is produced.",
    ),
  ];
}

function reviewableStudyText(
  question: ScientificQuestion | null,
  hypotheses: ScientificHypothesis[],
  experimentDesign: ExperimentDesign | null,
): string {
  return JSON.stringify({
    problemStatement: question?.problemStatement,
    whyItMatters: question?.whyItMatters,
    measurableOutcome: question?.measurableOutcome,
    openQuestions: question?.openQuestions,
    hypotheses: hypotheses.map((hypothesis) => ({
      hypothesisStatement: hypothesis.hypothesisStatement,
      nullHypothesis: hypothesis.nullHypothesis,
      alternativeHypothesis: hypothesis.alternativeHypothesis,
      measurablePrediction: hypothesis.measurablePrediction,
      falsificationCriteria: hypothesis.falsificationCriteria,
      baselineMethod: hypothesis.baselineMethod,
      expectedEffect: hypothesis.expectedEffect,
      possibleConfounders: hypothesis.possibleConfounders,
    })),
    experimentDesign: experimentDesign
      ? {
          datasetPlan: experimentDesign.datasetPlan,
          syntheticDataPlan: experimentDesign.syntheticDataPlan,
          publicDataPlan: experimentDesign.publicDataPlan,
          variables: experimentDesign.variables,
          controls: experimentDesign.controls,
          baseline: experimentDesign.baseline,
          metrics: experimentDesign.metrics,
          successCriteria: experimentDesign.successCriteria,
          failureCriteria: experimentDesign.failureCriteria,
          ablationPlan: experimentDesign.ablationPlan,
          sensitivityPlan: experimentDesign.sensitivityPlan,
          replicationPlan: experimentDesign.replicationPlan,
          statisticalPlan: experimentDesign.statisticalPlan,
          instrumentRequirements: experimentDesign.instrumentRequirements,
        }
      : null,
  });
}

function gate(
  code: ScienceGateCode,
  passed: boolean,
  message: string,
  evidencePath: string | null,
  expectedFix: string,
): ScienceGateResult {
  return {
    code,
    passed,
    severity: passed ? "info" : "blocking",
    message,
    evidencePath,
    expectedFix: passed ? null : expectedFix,
  };
}

function analyzeSafety(problem: string): SafetyScope {
  const lower = problem.toLowerCase();
  const blockedReasons: string[] = [];
  if (/\b(wet[- ]?lab|protocol|bench protocol|lab protocol)\b/i.test(lower)) {
    blockedReasons.push("wet-lab protocol generation is out of scope");
  }
  if (
    /\b(synthesi[sz]e|synthesis route|explosive|toxic|hazardous substance|controlled substance|weapon)\b/i.test(
      lower,
    )
  ) {
    blockedReasons.push(
      "hazardous chemistry or harmful-substance optimization is out of scope",
    );
  }
  if (/\b(biological optimization|gain of function|pathogen)\b/i.test(lower)) {
    blockedReasons.push("biological optimization is out of scope");
  }
  if (
    /\b(exploit|malware|attack live systems|credential theft)\b/i.test(lower)
  ) {
    blockedReasons.push(
      "exploit development or live-system attack guidance is out of scope",
    );
  }
  if (
    /\b(treatment recommendation|diagnose patients|medical treatment)\b/i.test(
      lower,
    )
  ) {
    blockedReasons.push("medical treatment recommendations are out of scope");
  }
  return {
    domain: inferField(problem),
    riskLevel: blockedReasons.length > 0 ? "critical" : "low",
    allowedMethods: [
      "synthetic data generation",
      "public non-sensitive data analysis",
      "simulation",
      "statistics",
      "software instrument benchmarking",
      "replication and falsification",
    ],
    blockedMethods: [
      "wet-lab protocols",
      "hazardous synthesis guidance",
      "biological optimization",
      "exploit development",
      "medical treatment recommendations",
    ],
    safetyNotes: [
      "The study is limited to safe computational science.",
      "Results must remain hypothesis-bound until experiments, statistics, replication, and falsification support them.",
      "No patentability, legal novelty, or freedom-to-operate conclusion is made.",
    ],
    blocked: blockedReasons.length > 0,
    blockedReasons,
  };
}

function assertSafeScope(scope: SafetyScope): void {
  if (scope.blocked) {
    throw new AppError(
      "SCIENCE_UNSAFE_DOMAIN_BLOCKED",
      "Science workflow cannot continue for a blocked safety scope.",
      { blockedReasons: scope.blockedReasons, safetyScope: scope },
    );
  }
}

function inferField(problem: string): string {
  const lower = problem.toLowerCase();
  if (lower.includes("energy")) return "energy-data-quality";
  if (lower.includes("chem")) return "chemistry-data-quality";
  if (lower.includes("software") || lower.includes("dependency")) {
    return "software-supply-chain-assurance";
  }
  if (lower.includes("reproduc")) return "reproducible-computational-science";
  return "safe-computational-science";
}

function whyItMattersFor(problem: string, field: string): string {
  if (field === "energy-data-quality") {
    return "Energy-data anomaly detectors can produce noisy false positives when weather, seasonality, provenance, and missing data are not separated. A bounded computational study can test whether provenance-aware scoring improves triage without using private meter data.";
  }
  return `The question matters because ${problem.toLowerCase()} should be evaluated with measurable evidence, baselines, replication, and falsification instead of unsupported research claims.`;
}

function measurableOutcomeFor(problem: string): string {
  if (problem.toLowerCase().includes("false positive")) {
    return "Difference in false-positive rate, recall, precision, and error categories between a provenance-aware method and a simple threshold baseline.";
  }
  return "Evidence-bound comparison against a baseline using measurable metrics, replication stability, and falsification outcomes.";
}

function requiredDataFor(problem: string): string[] {
  if (problem.toLowerCase().includes("energy")) {
    return [
      "seeded synthetic energy-usage records",
      "weather and season labels",
      "provenance labels",
      "known true anomaly labels",
      "known benign high-usage cases",
    ];
  }
  return [
    "seeded synthetic data",
    "baseline labels",
    "candidate method outputs",
    "negative examples",
  ];
}

function priorCorpusHints(problem: string): string[] {
  const lower = problem.toLowerCase();
  if (lower.includes("energy")) return ["energy-usage-anomaly-auditor"];
  if (lower.includes("chem")) return ["chemistry-record-auditor-tool"];
  if (lower.includes("dependency") || lower.includes("pull request")) {
    return ["patch-risk-auditor"];
  }
  return [];
}

function normalizedProblem(problem: string): string {
  const trimmed = problem.trim();
  if (!trimmed) {
    throw new AppError(
      "SCIENCE_QUESTION_REQUIRED",
      "science question requires a field or problem statement.",
    );
  }
  return trimmed;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}-${createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex")
    .slice(0, 12)}`;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "science-study"
  );
}

function withEvidenceHash<T extends Record<string, unknown>>(
  value: T,
): T & { evidenceHash: string } {
  const evidenceHash = hashEvidence({ ...value, evidenceHash: "" });
  return { ...value, evidenceHash };
}

async function listStudyDirs(studiesRoot: string): Promise<string[]> {
  try {
    return (await readdir(studiesRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  try {
    await access(path);
    return await readJson<T>(path);
  } catch {
    return null;
  }
}

function rel(dir: string, root: string, file: string): string {
  const full = join(dir, file);
  return full.startsWith(`${root}/`) ? full.slice(root.length + 1) : full;
}

function uniqueRefs(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function containsUnsafeText(text: string): boolean {
  return /\b(wet[- ]?lab|synthesis route|hazardous substance|controlled substance|gain of function|exploit live systems|credential theft|medical treatment)\b/i.test(
    text,
  );
}

function containsUnsupportedClaimLanguage(text: string): boolean {
  return /\b(proves|proven|guarantees|scientifically established|causally proves|patentable|legally novel|freedom to operate)\b/i.test(
    text,
  );
}

function renderSciencePlan(
  study: ScientificStudy,
  question: ScientificQuestion,
  hypotheses: ScientificHypotheses | null,
  experimentDesign: ExperimentDesign | null,
): string {
  return `# Science Plan

## Question
${question.problemStatement}

## Safety Scope
- Domain: ${question.safetyScope.domain}
- Risk: ${question.safetyScope.riskLevel}
- Allowed: ${question.safetyScope.allowedMethods.join(", ")}
- Blocked: ${question.safetyScope.blockedMethods.join(", ")}

## Hypotheses
${
  hypotheses
    ? hypotheses.hypotheses
        .map(
          (hypothesis) =>
            `- ${hypothesis.hypothesisId}: ${hypothesis.hypothesisStatement}\n  - Null: ${hypothesis.nullHypothesis}`,
        )
        .join("\n")
    : "- Not generated yet."
}

## Experiment Design
${
  experimentDesign
    ? `- Baseline: ${experimentDesign.baseline}
- Metrics: ${experimentDesign.metrics.join(", ")}
- Replication: ${experimentDesign.replicationPlan}`
    : "- Not generated yet."
}

## Caution
This is a computational-science study plan. It does not claim support until experiments, statistics, replication, and falsification exist. It is not a patent filing, patentability opinion, legal novelty opinion, or freedom-to-operate opinion.

## Status
- Study: ${study.studyId}
- State: ${study.status}
`;
}

function renderStatus(study: ScientificStudy): string {
  return `# Study Status

- Study ID: ${study.studyId}
- Slug: ${study.slug}
- Status: ${study.status}
- Question ID: ${study.questionId ?? "not-created"}
- Hypotheses: ${study.hypothesisIds.length}
- Experiments: ${study.experimentIds.length}
- Updated: ${study.updatedAt}
`;
}

function renderReview(review: ScienceReview): string {
  return `# Science Review

- Study ID: ${review.studyId}
- Status: ${review.status}

## Gates
${review.gates
  .map(
    (gate) =>
      `- ${gate.passed ? "PASS" : "FAIL"} ${gate.code}: ${gate.message}`,
  )
  .join("\n")}

## Blocking Reasons
${
  review.blockingReasons.length > 0
    ? review.blockingReasons.map((reason) => `- ${reason}`).join("\n")
    : "- None."
}

## Limitations
${review.limitations.map((limitation) => `- ${limitation}`).join("\n")}
`;
}
