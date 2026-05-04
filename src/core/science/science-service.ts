import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  runCommand,
  type CommandResult,
} from "../../adapters/shell/command.js";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { hashEvidence } from "../invention/pipeline.js";
import { workerDoctor } from "../worker/worker-doctor.js";
import type {
  ExperimentDesign,
  NodeAlphaScienceExecution,
  ScienceDataPlan,
  SafetyScope,
  ScienceExperimentRun,
  ScienceGateCode,
  ScienceGateResult,
  ScienceInstrumentPlan,
  ScienceReview,
  ScienceToolchainPlan,
  ScienceToolchainPolicyReview,
  SyntheticEnergyDataset,
  SyntheticEnergyRecord,
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

type DataGenerateResult = {
  study: ScientificStudy;
  dataPlan: ScienceDataPlan;
  datasets: SyntheticEnergyDataset[];
  artifactRefs: string[];
};

type InstrumentBuildResult = {
  study: ScientificStudy;
  instrumentPlan: ScienceInstrumentPlan;
  toolchainPlan: ScienceToolchainPlan;
  policyReview: ScienceToolchainPolicyReview;
  artifactRefs: string[];
};

type ExperimentRunResult = {
  study: ScientificStudy;
  experimentId: string;
  runs: ScienceExperimentRun[];
  nodeAlphaExecution: NodeAlphaScienceExecution;
  gates: ScienceGateResult[];
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

  async generateData(studyId: string): Promise<DataGenerateResult> {
    const { study, dir } = await this.findStudy(studyId);
    const design = await readOptionalJson<ExperimentDesign>(
      join(dir, "experiment-design.json"),
    );
    if (!design) {
      throw new AppError(
        "SCIENCE_EXPERIMENT_DESIGN_REQUIRED",
        "science data generate requires an experiment design.",
        { studyId },
      );
    }
    const dataPlan: ScienceDataPlan = withEvidenceHash({
      dataPlanId: stableId(
        "sci-data",
        `${study.studyId}:${design.experimentId}`,
      ),
      studyId: study.studyId,
      experimentId: design.experimentId,
      datasetKind: "synthetic_energy_usage" as const,
      seeds: [1, 2, 3],
      requiredPatterns: [
        "normal seasonal usage",
        "weather-related high usage that should not be a false positive",
        "missing intervals",
        "duplicate records",
        "weak-provenance records",
        "true anomaly spikes",
        "provenance labels",
      ],
      schema: [
        "recordId",
        "meterId",
        "timestamp",
        "season",
        "outdoorTempC",
        "kwh",
        "provenance",
        "expectedAnomaly",
        "expectedQualityIssues",
      ],
      privacyScope:
        "Synthetic toy records only; no private meter data, household identity, surveillance use case, or personal data publication.",
      limitations: [
        "Synthetic data may encode cleaner labels than real energy datasets.",
        "Weather normalization is represented by bounded toy temperature cases.",
        "Later phases must test public non-sensitive datasets before broader claims.",
      ],
    });
    const datasets = dataPlan.seeds.map((seed) =>
      withEvidenceHash(
        buildEnergyDataset(study.studyId, design.experimentId, seed),
      ),
    );
    await writeJson(join(dir, "data-plan.json"), dataPlan);
    await mkdir(join(dir, "synthetic-datasets"), { recursive: true });
    for (const dataset of datasets) {
      await writeJson(
        join(dir, "synthetic-datasets", `dataset-seed-${dataset.seed}.json`),
        dataset,
      );
    }
    const updated: ScientificStudy = {
      ...study,
      status: "data_generated",
      updatedAt: nowIso(),
      artifactRefs: uniqueRefs([
        ...study.artifactRefs,
        rel(dir, this.root, "data-plan.json"),
        ...datasets.map((dataset) =>
          rel(
            dir,
            this.root,
            join("synthetic-datasets", `dataset-seed-${dataset.seed}.json`),
          ),
        ),
      ]),
    };
    await writeJson(join(dir, "study.json"), updated);
    await writeFile(
      join(dir, "STUDY_STATUS.md"),
      renderStatus(updated),
      "utf8",
    );
    await this.updateIndex(updated);
    return {
      study: updated,
      dataPlan,
      datasets,
      artifactRefs: updated.artifactRefs,
    };
  }

  async buildInstruments(studyId: string): Promise<InstrumentBuildResult> {
    const { study, dir } = await this.findStudy(studyId);
    const design = await readOptionalJson<ExperimentDesign>(
      join(dir, "experiment-design.json"),
    );
    if (!design) {
      throw new AppError(
        "SCIENCE_EXPERIMENT_DESIGN_REQUIRED",
        "science instrument build requires an experiment design.",
        { studyId },
      );
    }
    const dataPlan = await readOptionalJson<ScienceDataPlan>(
      join(dir, "data-plan.json"),
    );
    if (!dataPlan) {
      throw new AppError(
        "SCIENCE_DATA_PLAN_REQUIRED",
        "science instrument build requires generated data. Run science data generate first.",
        { studyId },
      );
    }
    const toolchainPlan: ScienceToolchainPlan = withEvidenceHash({
      toolchainPlanId: stableId("sci-toolchain", study.studyId),
      studyId: study.studyId,
      packages: [
        {
          name: "node",
          manager: "node-builtin" as const,
          required: true,
          policy:
            "Use the local Node.js runtime or container runtime only for deterministic generated instruments.",
        },
      ],
      installRequired: false,
      installCommands: [],
    });
    const policyReview: ScienceToolchainPolicyReview = withEvidenceHash({
      reviewId: stableId("sci-toolchain-review", study.studyId),
      studyId: study.studyId,
      passed: true,
      rules: [
        "No sudo is allowed.",
        "No curl-pipe-shell installer is allowed.",
        "No package installation is required for the alpha.2 generated JavaScript instruments.",
        "Final experiment execution must prefer container-netoff and record degraded evidence if unavailable.",
      ],
      blockedCommands: [
        "sudo apt install",
        "curl https://example.invalid/install.sh | sh",
      ],
      approvedCommands: [
        "node tests/prototype.test.js",
        "node src/index.js <dataset> <output>",
      ],
    });
    const instrumentsRoot = join(dir, "instruments");
    const instrumentSpecs = [
      {
        name: "threshold-baseline-detector",
        purpose: "Flag usage records above a simple threshold baseline.",
        source: thresholdDetectorSource(),
        test: thresholdDetectorTest(),
      },
      {
        name: "provenance-aware-energy-detector",
        purpose:
          "Flag true usage spikes while separating weather-related high usage and data-quality defects.",
        source: provenanceDetectorSource(),
        test: provenanceDetectorTest(),
      },
      {
        name: "experiment-runner",
        purpose:
          "Run baseline and provenance-aware detectors over seeded datasets and write metric summaries.",
        source: experimentRunnerSource(),
        test: experimentRunnerTest(),
      },
    ];
    for (const spec of instrumentSpecs) {
      await writeInstrument(instrumentsRoot, spec);
    }
    const instrumentPlan: ScienceInstrumentPlan = withEvidenceHash({
      instrumentPlanId: stableId("sci-instrument", study.studyId),
      studyId: study.studyId,
      experimentId: design.experimentId,
      instruments: instrumentSpecs.map((spec) => ({
        name: spec.name,
        purpose: spec.purpose,
        path: join("instruments", spec.name),
        testCommand: "node tests/prototype.test.js",
      })),
      externalPackages: [],
      toolchainPlanPath: rel(dir, this.root, "toolchain-plan.json"),
      policyReviewPath: rel(dir, this.root, "toolchain-policy-review.json"),
    });
    await writeJson(join(dir, "toolchain-plan.json"), toolchainPlan);
    await writeJson(join(dir, "toolchain-policy-review.json"), policyReview);
    await writeJson(join(dir, "instrument-plan.json"), instrumentPlan);
    const updated: ScientificStudy = {
      ...study,
      status: "instruments_built",
      updatedAt: nowIso(),
      artifactRefs: uniqueRefs([
        ...study.artifactRefs,
        rel(dir, this.root, "instrument-plan.json"),
        rel(dir, this.root, "toolchain-plan.json"),
        rel(dir, this.root, "toolchain-policy-review.json"),
        ...instrumentSpecs.flatMap((spec) => [
          rel(dir, this.root, join("instruments", spec.name, "README.md")),
          rel(
            dir,
            this.root,
            join("instruments", spec.name, "src", "index.js"),
          ),
          rel(
            dir,
            this.root,
            join("instruments", spec.name, "tests", "prototype.test.js"),
          ),
        ]),
      ]),
    };
    await writeJson(join(dir, "study.json"), updated);
    await writeFile(
      join(dir, "STUDY_STATUS.md"),
      renderStatus(updated),
      "utf8",
    );
    await this.updateIndex(updated);
    return {
      study: updated,
      instrumentPlan,
      toolchainPlan,
      policyReview,
      artifactRefs: updated.artifactRefs,
    };
  }

  async runExperiment(experimentId: string): Promise<ExperimentRunResult> {
    const { study, dir } = await this.findStudyByExperimentId(experimentId);
    const instrumentPlan = await readOptionalJson<ScienceInstrumentPlan>(
      join(dir, "instrument-plan.json"),
    );
    const policyReview = await readOptionalJson<ScienceToolchainPolicyReview>(
      join(dir, "toolchain-policy-review.json"),
    );
    if (!instrumentPlan || !policyReview) {
      throw new AppError(
        "SCIENCE_INSTRUMENTS_REQUIRED",
        "science experiment run requires built instruments. Run science instrument build first.",
        { experimentId },
      );
    }
    await mkdir(join(dir, "experiment-runs"), { recursive: true });
    const doctor = await workerDoctor(this.root, "container-netoff");
    const commands: NodeAlphaScienceExecution["commands"] = [];
    const profileUse = await chooseScienceExecutionProfile(
      this.root,
      dir,
      doctor,
    );
    const instrumentDirs = instrumentPlan.instruments.map((instrument) =>
      join(dir, instrument.path),
    );
    for (const instrument of instrumentPlan.instruments) {
      const instrumentDir = join(dir, instrument.path);
      const result = await runScienceCommand({
        root: this.root,
        studyDir: dir,
        hostCwd: instrumentDir,
        containerCwd: join("/work", instrument.path),
        command: "node tests/prototype.test.js",
        profileUse,
        runtime: typeof doctor.runtime === "string" ? doctor.runtime : null,
      });
      commands.push(commandSummary(result, this.root));
      if (result.exitCode !== 0) {
        break;
      }
    }
    const testPassed = commands.every((command) => command.exitCode === 0);
    const runs: ScienceExperimentRun[] = [];
    if (testPassed) {
      const runnerDir = join(dir, "instruments", "experiment-runner");
      for (const seed of [1, 2, 3]) {
        const command = `node src/index.js ../../synthetic-datasets/dataset-seed-${seed}.json ../../experiment-runs/run-${seed}.json`;
        const result = await runScienceCommand({
          root: this.root,
          studyDir: dir,
          hostCwd: runnerDir,
          containerCwd: "/work/instruments/experiment-runner",
          command,
          profileUse,
          runtime: typeof doctor.runtime === "string" ? doctor.runtime : null,
        });
        commands.push(commandSummary(result, this.root));
        if (result.exitCode !== 0) break;
        const run = await readJson<ScienceExperimentRun>(
          join(dir, "experiment-runs", `run-${seed}.json`),
        );
        runs.push(run);
      }
    }
    const nodeAlphaExecution: NodeAlphaScienceExecution = withEvidenceHash({
      executionId: stableId(
        "sci-node-alpha",
        `${study.studyId}:${experimentId}`,
      ),
      studyId: study.studyId,
      experimentId,
      requestedProfile: "container-netoff" as const,
      usedProfile: profileUse.usedProfile,
      containerNetoffAvailable:
        doctor.available === true && doctor.canRun === true,
      containerRuntime:
        typeof doctor.runtime === "string" ? doctor.runtime : null,
      noSilentFallback: true,
      degraded: profileUse.degraded,
      degradedReason: profileUse.degradedReason,
      commands,
      passed:
        testPassed &&
        runs.length === 3 &&
        commands.every((command) => command.exitCode === 0),
    });
    await writeJson(join(dir, "node-alpha-execution.json"), nodeAlphaExecution);
    await writeFile(
      join(dir, "NODE_ALPHA_EXECUTION.md"),
      renderNodeAlphaExecution(nodeAlphaExecution),
      "utf8",
    );
    const gates = buildRuntimeGates({
      dir,
      root: this.root,
      dataPlan: await readOptionalJson<ScienceDataPlan>(
        join(dir, "data-plan.json"),
      ),
      syntheticDatasetCount: await countSyntheticDatasets(dir),
      runs,
      instrumentPlan,
      policyReview,
      nodeAlphaExecution,
    });
    await writeJson(join(dir, "experiment-status.json"), {
      kind: "science_experiment_status",
      studyId: study.studyId,
      experimentId,
      runCount: runs.length,
      passed: gates.every((gate) => gate.passed),
      gates,
      evidenceHash: hashEvidence({ experimentId, runs, gates }),
    });
    const updated: ScientificStudy = {
      ...study,
      status: nodeAlphaExecution.passed ? "experiment_completed" : "blocked",
      updatedAt: nowIso(),
      artifactRefs: uniqueRefs([
        ...study.artifactRefs,
        rel(dir, this.root, "node-alpha-execution.json"),
        rel(dir, this.root, "NODE_ALPHA_EXECUTION.md"),
        rel(dir, this.root, "experiment-status.json"),
        ...runs.map((run) =>
          rel(dir, this.root, join("experiment-runs", `${run.runId}.json`)),
        ),
      ]),
    };
    await writeJson(join(dir, "study.json"), updated);
    await writeFile(
      join(dir, "STUDY_STATUS.md"),
      renderStatus(updated),
      "utf8",
    );
    await this.updateIndex(updated);
    return {
      study: updated,
      experimentId,
      runs,
      nodeAlphaExecution,
      gates,
      artifactRefs: updated.artifactRefs,
    };
  }

  async experimentStatus(
    experimentId: string,
  ): Promise<Record<string, unknown>> {
    const { study, dir } = await this.findStudyByExperimentId(experimentId);
    const status = await readOptionalJson<Record<string, unknown>>(
      join(dir, "experiment-status.json"),
    );
    const runs = await readExperimentRuns(dir);
    const nodeAlphaExecution =
      await readOptionalJson<NodeAlphaScienceExecution>(
        join(dir, "node-alpha-execution.json"),
      );
    return {
      studyId: study.studyId,
      slug: study.slug,
      experimentId,
      status: study.status,
      runCount: runs.length,
      passed: status?.passed ?? false,
      workerProfileUsed: nodeAlphaExecution?.usedProfile ?? null,
      noSilentFallback: nodeAlphaExecution?.noSilentFallback ?? false,
      degraded: nodeAlphaExecution?.degraded ?? null,
      gates: status?.gates ?? [],
      artifactRefs: study.artifactRefs,
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
    const instrumentPlan = await readOptionalJson<ScienceInstrumentPlan>(
      join(dir, "instrument-plan.json"),
    );
    const policyReview = await readOptionalJson<ScienceToolchainPolicyReview>(
      join(dir, "toolchain-policy-review.json"),
    );
    const nodeAlphaExecution =
      await readOptionalJson<NodeAlphaScienceExecution>(
        join(dir, "node-alpha-execution.json"),
      );
    const runs = await readExperimentRuns(dir);
    const dataPlan = await readOptionalJson<ScienceDataPlan>(
      join(dir, "data-plan.json"),
    );
    const syntheticDatasetCount = await countSyntheticDatasets(dir);
    const gates = buildReviewGates({
      dir,
      root: this.root,
      question,
      hypotheses,
      experimentDesign,
      runtime:
        instrumentPlan || nodeAlphaExecution || runs.length > 0
          ? {
              runs,
              dataPlan,
              syntheticDatasetCount,
              instrumentPlan,
              policyReview,
              nodeAlphaExecution,
            }
          : null,
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

  private async findStudyByExperimentId(experimentId: string): Promise<{
    study: ScientificStudy;
    dir: string;
    experimentDesign: ExperimentDesign;
  }> {
    const studiesRoot = this.studiesRoot();
    const candidates = await listStudyDirs(studiesRoot);
    for (const slug of candidates) {
      const dir = join(studiesRoot, slug);
      const experimentDesign = await readOptionalJson<ExperimentDesign>(
        join(dir, "experiment-design.json"),
      );
      const study = await readOptionalJson<ScientificStudy>(
        join(dir, "study.json"),
      );
      if (experimentDesign?.experimentId === experimentId && study) {
        return { study, dir, experimentDesign };
      }
    }
    throw new AppError(
      "SCIENCE_EXPERIMENT_NOT_FOUND",
      `Science experiment not found: ${experimentId}`,
      { experimentId },
    );
  }
}

function buildEnergyDataset(
  studyId: string,
  experimentId: string,
  seed: number,
): Omit<SyntheticEnergyDataset, "evidenceHash"> {
  const meter = `toy-meter-${seed}`;
  const offset = seed * 0.1;
  const records: SyntheticEnergyRecord[] = [
    record(
      seed,
      "normal-winter",
      meter,
      "2026-01-01T00:00:00Z",
      "winter",
      -4,
      3.2 + offset,
      "trusted_sensor",
      false,
      [],
    ),
    record(
      seed,
      "weather-high",
      meter,
      "2026-01-01T01:00:00Z",
      "winter",
      -8,
      9.4 + offset,
      "weather_adjusted",
      false,
      [],
    ),
    record(
      seed,
      "true-spike",
      meter,
      "2026-01-01T02:00:00Z",
      "winter",
      -2,
      18.5 + offset,
      "trusted_sensor",
      true,
      [],
    ),
    record(
      seed,
      "normal-summer",
      meter,
      "2026-07-01T00:00:00Z",
      "summer",
      26,
      4.1 + offset,
      "trusted_sensor",
      false,
      [],
    ),
    record(
      seed,
      "weak-provenance",
      meter,
      "2026-07-01T01:00:00Z",
      "summer",
      27,
      4.3 + offset,
      "weak_estimate",
      false,
      ["weak_provenance"],
    ),
    record(
      seed,
      "duplicate-a",
      `toy-meter-dup-${seed}`,
      "2026-02-01T00:00:00Z",
      "winter",
      1,
      2.8 + offset,
      "trusted_sensor",
      false,
      [],
    ),
    record(
      seed,
      "duplicate-b",
      `toy-meter-dup-${seed}`,
      "2026-02-01T00:00:00Z",
      "winter",
      1,
      2.8 + offset,
      "trusted_sensor",
      false,
      ["duplicate_record"],
    ),
    record(
      seed,
      "missing-start",
      `toy-meter-gap-${seed}`,
      "2026-03-01T00:00:00Z",
      "spring",
      12,
      2.5 + offset,
      "trusted_sensor",
      false,
      [],
    ),
    record(
      seed,
      "missing-end",
      `toy-meter-gap-${seed}`,
      "2026-03-01T02:00:00Z",
      "spring",
      13,
      2.6 + offset,
      "trusted_sensor",
      false,
      ["missing_interval"],
    ),
  ];
  return {
    datasetId: `synthetic-energy-seed-${seed}`,
    studyId,
    experimentId,
    seed,
    records,
    labels: {
      trueAnomalyRecordIds: records
        .filter((item) => item.expectedAnomaly)
        .map((item) => item.recordId),
      normalHighUsageRecordIds: records
        .filter((item) => item.recordId.includes("weather-high"))
        .map((item) => item.recordId),
      duplicateRecordIds: records
        .filter((item) =>
          item.expectedQualityIssues.includes("duplicate_record"),
        )
        .map((item) => item.recordId),
      missingIntervalMeterIds: [`toy-meter-gap-${seed}`],
      weakProvenanceRecordIds: records
        .filter((item) => item.provenance === "weak_estimate")
        .map((item) => item.recordId),
    },
  };
}

function record(
  seed: number,
  suffix: string,
  meterId: string,
  timestamp: string,
  season: SyntheticEnergyRecord["season"],
  outdoorTempC: number,
  kwh: number,
  provenance: SyntheticEnergyRecord["provenance"],
  expectedAnomaly: boolean,
  expectedQualityIssues: string[],
): SyntheticEnergyRecord {
  return {
    recordId: `seed-${seed}-${suffix}`,
    meterId,
    timestamp,
    season,
    outdoorTempC,
    kwh: Number(kwh.toFixed(2)),
    provenance,
    expectedAnomaly,
    expectedQualityIssues,
  };
}

async function writeInstrument(
  instrumentsRoot: string,
  spec: { name: string; purpose: string; source: string; test: string },
): Promise<void> {
  const root = join(instrumentsRoot, spec.name);
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeJson(join(root, "package.json"), {
    name: spec.name,
    version: "0.1.0",
    type: "module",
    private: true,
    scripts: {
      test: "node tests/prototype.test.js",
    },
  });
  await writeFile(
    join(root, "README.md"),
    `# ${spec.name}\n\n${spec.purpose}\n\nThis generated instrument is deterministic and uses only toy synthetic energy records.\n`,
    "utf8",
  );
  await writeFile(join(root, "src", "index.js"), spec.source, "utf8");
  await writeFile(join(root, "tests", "prototype.test.js"), spec.test, "utf8");
}

async function chooseScienceExecutionProfile(
  root: string,
  studyDir: string,
  doctor: { canRun?: boolean; runtime?: string | null },
): Promise<{
  usedProfile: "container-netoff" | "sandbox-local";
  degraded: boolean;
  degradedReason: string | null;
}> {
  if (doctor.canRun === true && typeof doctor.runtime === "string") {
    const image = await runCommand(
      `${doctor.runtime} image inspect node:22-alpine`,
      root,
      { allowNetwork: false, truncateOutputChars: 1000 },
    ).catch(() => null);
    if (image?.exitCode === 0) {
      const probe = await runCommand(
        `${doctor.runtime} run --rm --network none -v ${shellQuote(
          `${studyDir}:/work:rw`,
        )} -w /work node:22-alpine node -e "process.exit(require('fs').existsSync('/work/study.json') ? 0 : 1)"`,
        root,
        { allowNetwork: false, truncateOutputChars: 1000 },
      ).catch(() => null);
      if (probe?.exitCode !== 0) {
        return {
          usedProfile: "sandbox-local",
          degraded: true,
          degradedReason:
            "container-netoff runtime and image are present, but the study directory mount probe failed; sandbox-local was recorded explicitly.",
        };
      }
      return {
        usedProfile: "container-netoff",
        degraded: false,
        degradedReason: null,
      };
    }
    return {
      usedProfile: "sandbox-local",
      degraded: true,
      degradedReason:
        "container-netoff runtime is present, but node:22-alpine is not available locally; no image pull was attempted.",
    };
  }
  return {
    usedProfile: "sandbox-local",
    degraded: true,
    degradedReason:
      "container-netoff is unavailable; sandbox-local execution was recorded explicitly as lower assurance.",
  };
}

async function runScienceCommand(input: {
  root: string;
  studyDir: string;
  hostCwd: string;
  containerCwd: string;
  command: string;
  profileUse: {
    usedProfile: "container-netoff" | "sandbox-local";
    degraded: boolean;
    degradedReason: string | null;
  };
  runtime: string | null;
}): Promise<CommandResult> {
  if (input.profileUse.usedProfile === "container-netoff" && input.runtime) {
    const containerCommand = [
      input.runtime,
      "run",
      "--rm",
      "--network",
      "none",
      "--cpus",
      "1",
      "--memory",
      "512m",
      "-v",
      shellQuote(`${input.studyDir}:/work:rw`),
      "-w",
      shellQuote(input.containerCwd),
      "node:22-alpine",
      input.command,
    ].join(" ");
    return runCommand(containerCommand, input.root, {
      allowNetwork: false,
      truncateOutputChars: 2000,
    });
  }
  return runCommand(input.command, input.hostCwd, {
    allowNetwork: false,
    truncateOutputChars: 2000,
  });
}

function commandSummary(
  result: CommandResult,
  root: string,
): NodeAlphaScienceExecution["commands"][number] {
  return {
    command: result.command,
    cwd: relative(root, result.cwd) || ".",
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    stdoutRedactedPreview: result.stdout.slice(0, 500),
    stderrRedactedPreview: result.stderr.slice(0, 500),
  };
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

async function readExperimentRuns(
  dir: string,
): Promise<ScienceExperimentRun[]> {
  const runsRoot = join(dir, "experiment-runs");
  try {
    const files = (await readdir(runsRoot))
      .filter((file) => /^run-\d+\.json$/.test(file))
      .sort();
    const runs = [];
    for (const file of files) {
      runs.push(await readJson<ScienceExperimentRun>(join(runsRoot, file)));
    }
    return runs;
  } catch {
    return [];
  }
}

async function countSyntheticDatasets(dir: string): Promise<number> {
  try {
    return (await readdir(join(dir, "synthetic-datasets"))).filter((file) =>
      /^dataset-seed-\d+\.json$/.test(file),
    ).length;
  } catch {
    return 0;
  }
}

function renderNodeAlphaExecution(
  execution: NodeAlphaScienceExecution,
): string {
  return `# Node Alpha Science Execution

- Experiment: ${execution.experimentId}
- Requested profile: ${execution.requestedProfile}
- Used profile: ${execution.usedProfile}
- Container runtime: ${execution.containerRuntime ?? "unavailable"}
- Container-netoff available: ${String(execution.containerNetoffAvailable)}
- No silent fallback: ${String(execution.noSilentFallback)}
- Degraded: ${String(execution.degraded)}
- Passed: ${String(execution.passed)}

${execution.degradedReason ? `Degraded reason: ${execution.degradedReason}\n` : ""}
## Commands
${execution.commands
  .map(
    (command) =>
      `- ${command.command} (${command.cwd}) exit ${command.exitCode}`,
  )
  .join("\n")}

Raw stdout/stderr logs are not published by this evidence file; only redacted bounded previews are stored in JSON.
`;
}

function thresholdDetectorSource(): string {
  return `export function detect(records, threshold = 8) {
  const flaggedRecordIds = records.filter((record) => record.kwh >= threshold).map((record) => record.recordId);
  return {
    detector: "threshold-baseline-detector",
    flaggedRecordIds,
    qualityIssueRecordIds: []
  };
}

export function detectDataset(dataset) {
  return detect(dataset.records);
}
`;
}

function provenanceDetectorSource(): string {
  return `export function detect(records) {
  const flaggedRecordIds = [];
  const qualityIssueRecordIds = new Set();
  const seen = new Map();
  const byMeter = new Map();
  for (const record of records) {
    const weatherExplainsHighUse = record.season === "winter" && record.outdoorTempC <= 0 && record.provenance === "weather_adjusted";
    if (record.kwh >= 12 || (record.kwh >= 8 && !weatherExplainsHighUse)) {
      flaggedRecordIds.push(record.recordId);
    }
    if (record.provenance === "weak_estimate") qualityIssueRecordIds.add(record.recordId);
    const key = record.meterId + "::" + record.timestamp;
    if (seen.has(key)) {
      qualityIssueRecordIds.add(record.recordId);
      qualityIssueRecordIds.add(seen.get(key));
    }
    seen.set(key, record.recordId);
    const list = byMeter.get(record.meterId) ?? [];
    list.push(record);
    byMeter.set(record.meterId, list);
  }
  for (const list of byMeter.values()) {
    const sorted = [...list].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = Date.parse(sorted[index - 1].timestamp);
      const current = Date.parse(sorted[index].timestamp);
      if (current - previous > 60 * 60 * 1000) {
        qualityIssueRecordIds.add(sorted[index].recordId);
      }
    }
  }
  return {
    detector: "provenance-aware-energy-detector",
    flaggedRecordIds,
    qualityIssueRecordIds: [...qualityIssueRecordIds].sort()
  };
}

export function detectDataset(dataset) {
  return detect(dataset.records);
}
`;
}

function experimentRunnerSource(): string {
  return `import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

function threshold(records, thresholdValue = 8) {
  return records.filter((record) => record.kwh >= thresholdValue).map((record) => record.recordId);
}

function provenanceAware(records) {
  const flagged = [];
  const quality = new Set();
  const seen = new Map();
  const byMeter = new Map();
  for (const record of records) {
    const weatherExplainsHighUse = record.season === "winter" && record.outdoorTempC <= 0 && record.provenance === "weather_adjusted";
    if (record.kwh >= 12 || (record.kwh >= 8 && !weatherExplainsHighUse)) flagged.push(record.recordId);
    if (record.provenance === "weak_estimate") quality.add(record.recordId);
    const key = record.meterId + "::" + record.timestamp;
    if (seen.has(key)) {
      quality.add(record.recordId);
      quality.add(seen.get(key));
    }
    seen.set(key, record.recordId);
    const list = byMeter.get(record.meterId) ?? [];
    list.push(record);
    byMeter.set(record.meterId, list);
  }
  for (const list of byMeter.values()) {
    const sorted = [...list].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = Date.parse(sorted[index - 1].timestamp);
      const current = Date.parse(sorted[index].timestamp);
      if (current - previous > 60 * 60 * 1000) quality.add(sorted[index].recordId);
    }
  }
  return { flaggedRecordIds: flagged, qualityIssueRecordIds: [...quality].sort() };
}

function metrics(detector, flaggedRecordIds, labels, records, qualityIssueRecordIds = []) {
  const flagged = new Set(flaggedRecordIds);
  const positives = new Set(labels.trueAnomalyRecordIds);
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  for (const record of records) {
    const isPositive = positives.has(record.recordId);
    const isFlagged = flagged.has(record.recordId);
    if (isPositive && isFlagged) truePositives += 1;
    else if (!isPositive && isFlagged) falsePositives += 1;
    else if (!isPositive && !isFlagged) trueNegatives += 1;
    else falseNegatives += 1;
  }
  const precision = truePositives + falsePositives === 0 ? 1 : truePositives / (truePositives + falsePositives);
  const recall = truePositives + falseNegatives === 0 ? 1 : truePositives / (truePositives + falseNegatives);
  const falsePositiveRate = falsePositives + trueNegatives === 0 ? 0 : falsePositives / (falsePositives + trueNegatives);
  const falseNegativeRate = falseNegatives + truePositives === 0 ? 0 : falseNegatives / (falseNegatives + truePositives);
  return {
    detector,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    falsePositiveRate: Number(falsePositiveRate.toFixed(4)),
    falseNegativeRate: Number(falseNegativeRate.toFixed(4)),
    flaggedRecordIds,
    qualityIssueRecordIds
  };
}

function stableHash(value) {
  let hash = 0;
  const text = JSON.stringify(value);
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return hash.toString(16).padStart(8, "0");
}

const [datasetPath, outputPath] = process.argv.slice(2);
if (!datasetPath || !outputPath) {
  console.error("usage: node src/index.js <dataset> <output>");
  process.exit(2);
}
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const baseline = metrics("threshold-baseline-detector", threshold(dataset.records), dataset.labels, dataset.records);
const candidateDetection = provenanceAware(dataset.records);
const candidate = metrics("provenance-aware-energy-detector", candidateDetection.flaggedRecordIds, dataset.labels, dataset.records, candidateDetection.qualityIssueRecordIds);
const run = {
  runId: "run-" + dataset.seed,
  studyId: dataset.studyId,
  experimentId: dataset.experimentId,
  datasetId: dataset.datasetId,
  seed: dataset.seed,
  baseline,
  candidate,
  comparison: {
    falsePositiveReduction: Number((baseline.falsePositiveRate - candidate.falsePositiveRate).toFixed(4)),
    recallDelta: Number((candidate.recall - baseline.recall).toFixed(4)),
    candidateBetterOnFalsePositives: candidate.falsePositiveRate < baseline.falsePositiveRate
  },
  passed: candidate.falsePositiveRate < baseline.falsePositiveRate && candidate.recall >= baseline.recall,
  evidenceHash: ""
};
run.evidenceHash = stableHash({ ...run, evidenceHash: "" });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(run, null, 2) + "\\n", "utf8");
`;
}

function thresholdDetectorTest(): string {
  return `import assert from "node:assert/strict";
import { detect } from "../src/index.js";

const result = detect([
  { recordId: "normal", kwh: 3 },
  { recordId: "high", kwh: 9 }
]);
assert.deepEqual(result.flaggedRecordIds, ["high"]);
console.log("threshold-baseline-detector tests passed");
`;
}

function provenanceDetectorTest(): string {
  return `import assert from "node:assert/strict";
import { detect } from "../src/index.js";

const records = [
  { recordId: "weather", meterId: "m1", timestamp: "2026-01-01T00:00:00Z", season: "winter", outdoorTempC: -7, kwh: 9.5, provenance: "weather_adjusted" },
  { recordId: "spike", meterId: "m1", timestamp: "2026-01-01T01:00:00Z", season: "winter", outdoorTempC: -3, kwh: 18, provenance: "trusted_sensor" },
  { recordId: "weak", meterId: "m1", timestamp: "2026-01-01T02:00:00Z", season: "winter", outdoorTempC: -1, kwh: 3, provenance: "weak_estimate" }
];
const result = detect(records);
assert.deepEqual(result.flaggedRecordIds, ["spike"]);
assert.ok(result.qualityIssueRecordIds.includes("weak"));
console.log("provenance-aware-energy-detector tests passed");
`;
}

function experimentRunnerTest(): string {
  return `import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "science-runner-"));
const dataset = {
  datasetId: "test",
  studyId: "study",
  experimentId: "experiment",
  seed: 1,
  records: [
    { recordId: "weather", meterId: "m1", timestamp: "2026-01-01T00:00:00Z", season: "winter", outdoorTempC: -7, kwh: 9.5, provenance: "weather_adjusted", expectedAnomaly: false, expectedQualityIssues: [] },
    { recordId: "spike", meterId: "m1", timestamp: "2026-01-01T01:00:00Z", season: "winter", outdoorTempC: -3, kwh: 18, provenance: "trusted_sensor", expectedAnomaly: true, expectedQualityIssues: [] }
  ],
  labels: { trueAnomalyRecordIds: ["spike"], normalHighUsageRecordIds: ["weather"], duplicateRecordIds: [], missingIntervalMeterIds: [], weakProvenanceRecordIds: [] }
};
const input = join(dir, "dataset.json");
const output = join(dir, "run.json");
await writeFile(input, JSON.stringify(dataset), "utf8");
const result = spawnSync(process.execPath, ["src/index.js", input, output], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
assert.equal(result.status, 0, result.stderr);
const run = JSON.parse(await readFile(output, "utf8"));
assert.equal(run.baseline.falsePositives, 1);
assert.equal(run.candidate.falsePositives, 0);
assert.equal(run.passed, true);
console.log("experiment-runner tests passed");
`;
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
  runtime: {
    runs: ScienceExperimentRun[];
    dataPlan: ScienceDataPlan | null;
    syntheticDatasetCount: number;
    instrumentPlan: ScienceInstrumentPlan | null;
    policyReview: ScienceToolchainPolicyReview | null;
    nodeAlphaExecution: NodeAlphaScienceExecution | null;
  } | null;
}): ScienceGateResult[] {
  const questionPath = rel(input.dir, input.root, "question.json");
  const hypothesesPath = rel(input.dir, input.root, "hypotheses.json");
  const designPath = rel(input.dir, input.root, "experiment-design.json");
  const question = input.question;
  const hypotheses = input.hypotheses?.hypotheses ?? [];
  const experimentDesign = input.experimentDesign;
  const methodGates = [
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
  return input.runtime
    ? [
        ...methodGates,
        ...buildRuntimeGates({
          dir: input.dir,
          root: input.root,
          runs: input.runtime.runs,
          dataPlan: input.runtime.dataPlan,
          syntheticDatasetCount: input.runtime.syntheticDatasetCount,
          instrumentPlan: input.runtime.instrumentPlan,
          policyReview: input.runtime.policyReview,
          nodeAlphaExecution: input.runtime.nodeAlphaExecution,
        }),
      ]
    : methodGates;
}

function buildRuntimeGates(input: {
  dir: string;
  root: string;
  dataPlan: ScienceDataPlan | null;
  syntheticDatasetCount: number;
  runs: ScienceExperimentRun[];
  instrumentPlan: ScienceInstrumentPlan | null;
  policyReview: ScienceToolchainPolicyReview | null;
  nodeAlphaExecution: NodeAlphaScienceExecution | null;
}): ScienceGateResult[] {
  return [
    gate(
      "DATA_PLAN_PRESENT",
      input.dataPlan !== null,
      "A data plan must be present before runtime review.",
      rel(input.dir, input.root, "data-plan.json"),
      "Run `sovryn science data generate <study-id> --json`.",
    ),
    gate(
      "SYNTHETIC_DATA_PRESENT",
      input.syntheticDatasetCount >= 3,
      "Synthetic datasets must be generated for experiment execution.",
      rel(input.dir, input.root, "synthetic-datasets"),
      "Run `sovryn science data generate <study-id> --json`.",
    ),
    gate(
      "INSTRUMENT_PLAN_PRESENT",
      input.instrumentPlan !== null,
      "An instrument plan must be present.",
      rel(input.dir, input.root, "instrument-plan.json"),
      "Run `sovryn science instrument build <study-id> --json`.",
    ),
    gate(
      "INSTRUMENT_BUILT",
      (input.instrumentPlan?.instruments.length ?? 0) >= 3,
      "All required instruments must be scaffolded.",
      rel(input.dir, input.root, "instruments"),
      "Build threshold, provenance-aware, and experiment-runner instruments.",
    ),
    gate(
      "INSTRUMENT_TESTED",
      input.nodeAlphaExecution?.commands
        .filter((command) => command.command === "node tests/prototype.test.js")
        .every((command) => command.exitCode === 0) === true,
      "Instrument tests must pass.",
      rel(input.dir, input.root, "node-alpha-execution.json"),
      "Run `sovryn science experiment run <experiment-id> --json`.",
    ),
    gate(
      "TOOLCHAIN_POLICY_PASSED",
      input.policyReview?.passed === true,
      "Toolchain policy review must pass.",
      rel(input.dir, input.root, "toolchain-policy-review.json"),
      "Create a policy-reviewed toolchain plan with no sudo or curl-pipe-shell.",
    ),
    gate(
      "NODE_ALPHA_EXECUTION_PRESENT",
      input.nodeAlphaExecution !== null,
      "Node Alpha execution evidence must be present.",
      rel(input.dir, input.root, "node-alpha-execution.json"),
      "Run `sovryn science experiment run <experiment-id> --json`.",
    ),
    gate(
      "NO_SILENT_FALLBACK",
      input.nodeAlphaExecution?.noSilentFallback === true,
      "Worker profile fallback must be explicit and evidence-bound.",
      rel(input.dir, input.root, "node-alpha-execution.json"),
      "Record degraded/unavailable container evidence if container-netoff cannot be used.",
    ),
    gate(
      "EXPERIMENT_RUN_PRESENT",
      input.runs.length >= 3 && input.runs.every((run) => run.passed),
      "At least three deterministic experiment runs must pass.",
      rel(input.dir, input.root, "experiment-runs"),
      "Run all seeded experiment datasets.",
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
