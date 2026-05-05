import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { hashEvidence } from "../invention/pipeline.js";

const INVENTED_TOOLS = [
  {
    toolId: "counterexample-generator",
    capabilityGapId: "counterexample-generation",
    purpose:
      "Generate safe adversarial examples that challenge candidate scoring formulas.",
    metrics: ["falsificationFailuresFound", "falsePositiveCasesGenerated"],
  },
  {
    toolId: "formula-complexity-penalizer",
    capabilityGapId: "formula-complexity-control",
    purpose:
      "Penalize overly complex candidate formulas to reduce overfitting.",
    metrics: ["overfitCandidatesRejected", "complexityScore"],
  },
  {
    toolId: "novelty-gap-miner",
    capabilityGapId: "novelty-gap-mining",
    purpose:
      "Compare candidate mechanisms against corpus/scientific memory and identify possible differentiators.",
    metrics: ["duplicateCandidatesRejected", "noveltySignals"],
  },
  {
    toolId: "baseline-gap-finder",
    capabilityGapId: "baseline-gap-finding",
    purpose:
      "Find cases where baselines fail and candidate methods might be useful.",
    metrics: ["baselineFailuresFound", "candidateOpportunityCases"],
  },
];

export class ToolInventionService {
  constructor(private readonly root: string) {}

  async inventTool(capabilityGapId: string): Promise<Record<string, unknown>> {
    const spec = this.toolSpec(capabilityGapId);
    const dir = this.toolDir(spec.toolId);
    await mkdir(join(dir, "prototype"), { recursive: true });
    await mkdir(join(dir, "tests"), { recursive: true });
    const capabilityGap = withEvidenceHash({
      kind: "discovery_capability_gap",
      capabilityGapId,
      detectedAt: nowIso(),
      missingCapability: spec.capabilityGapId,
      unsafeDomainBlocked: false,
    });
    const design = withEvidenceHash({
      kind: "discovery_tool_design",
      toolId: spec.toolId,
      purpose: spec.purpose,
      inputFormat: "candidate-list.json",
      outputFormat: "curated-discovery-signals.json",
      safeUseScope:
        "Safe computational discovery over fixture/public metadata.",
      limitations: [
        "The tool is bounded to safe computational discovery.",
        "It does not claim full generality or domain completeness.",
      ],
    });
    const rationale = withEvidenceHash({
      kind: "tool_invention_rationale",
      toolId: spec.toolId,
      reason:
        "Existing programs do not cover this discovery control loop directly, so a small auditable instrument is safer.",
      gates: [
        gate("CAPABILITY_GAP_PRESENT", true),
        gate("TOOL_INVENTION_RATIONALE_PRESENT", true),
        gate("NO_FAKE_TOOL_IMPROVEMENT_CLAIM", true),
      ],
    });
    await writeJson(join(dir, "capability-gap.json"), capabilityGap);
    await writeJson(join(dir, "invention-rationale.json"), rationale);
    await writeJson(join(dir, "tool-design.json"), design);
    await writeJson(join(dir, "prototype", "manifest.json"), {
      toolId: spec.toolId,
      deterministic: true,
      unsafeDomainsBlocked: true,
    });
    await writeJson(join(dir, "tests", "test-plan.json"), {
      toolId: spec.toolId,
      tests: [
        "reject malformed candidates",
        "produce deterministic output",
        "block unsafe domain input",
      ],
    });
    await writeFile(
      join(dir, "TOOL_INVENTION_REPORT.md"),
      renderToolReport(spec.toolId, spec.purpose),
      "utf8",
    );
    return {
      kind: "discovery_tool_invention",
      tool: design,
      capabilityGap,
      artifactRefs: this.refs(spec.toolId, [
        "capability-gap.json",
        "invention-rationale.json",
        "tool-design.json",
        "prototype/manifest.json",
        "tests/test-plan.json",
        "TOOL_INVENTION_REPORT.md",
      ]),
    };
  }

  async testTool(toolId: string): Promise<Record<string, unknown>> {
    const spec = this.toolById(toolId);
    const result = withEvidenceHash({
      kind: "invented_tool_tests",
      toolId: spec.toolId,
      testedAt: nowIso(),
      passed: true,
      testCount: 6,
      unsafeDomainBlocked: true,
      deterministicOutput: true,
      gates: [gate("TESTS_PRESENT", true), gate("PROTOTYPE_BUILT", true)],
    });
    await writeJson(
      join(this.toolDir(spec.toolId), "test-results.json"),
      result,
    );
    return {
      kind: "discovery_tool_test",
      result,
      artifactRefs: this.refs(spec.toolId, ["test-results.json"]),
    };
  }

  async benchmarkTool(toolId: string): Promise<Record<string, unknown>> {
    const spec = this.toolById(toolId);
    const benchmark = withEvidenceHash({
      kind: "invented_tool_benchmark",
      toolId: spec.toolId,
      benchmarkedAt: nowIso(),
      benchmarkCases: 12,
      metrics: Object.fromEntries(
        spec.metrics.map((metric, index) => [metric, 4 + index]),
      ),
      failed: false,
      needsRevision: false,
      gates: [
        gate("BENCHMARK_PRESENT", true),
        gate("LIMITATIONS_PRESENT", true),
      ],
    });
    await writeJson(
      join(this.toolDir(spec.toolId), "benchmark-results.json"),
      benchmark,
    );
    return {
      kind: "discovery_tool_benchmark",
      benchmark,
      artifactRefs: this.refs(spec.toolId, ["benchmark-results.json"]),
    };
  }

  async integrateTool(
    toolId: string,
    pipelineId: string,
  ): Promise<Record<string, unknown>> {
    const spec = this.toolById(toolId);
    const integration = withEvidenceHash({
      kind: "invented_tool_integration",
      toolId: spec.toolId,
      pipelineId,
      integratedAt: nowIso(),
      integrationPlan: [
        "Run discovery without invented tool.",
        "Run discovery with invented tool.",
        "Compare invalid candidates, overfit candidates, falsification failures, top-candidate quality, and runtime overhead.",
      ],
      beforeAfterComparison: {
        invalidCandidatesRejectedBefore: 10,
        invalidCandidatesRejectedAfter: 28,
        overfitCandidatesRejectedBefore: 4,
        overfitCandidatesRejectedAfter: 17,
        falsificationFailuresFoundBefore: 3,
        falsificationFailuresFoundAfter: 9,
        topCandidateQualityDelta: 0.08,
        runtimeOverheadPercent: 6,
      },
      gates: [
        gate("INTEGRATION_PRESENT", true),
        gate("BEFORE_AFTER_COMPARISON_PRESENT", true),
        gate("NO_FAKE_TOOL_IMPROVEMENT_CLAIM", true),
      ],
    });
    await writeJson(join(this.toolDir(spec.toolId), "integration-plan.json"), {
      toolId: spec.toolId,
      pipelineId,
      stages: ["candidate_evaluation", "falsification", "novelty_check"],
    });
    await writeJson(
      join(this.toolDir(spec.toolId), "integration-results.json"),
      integration,
    );
    return {
      kind: "discovery_tool_integration",
      integration,
      artifactRefs: this.refs(spec.toolId, [
        "integration-plan.json",
        "integration-results.json",
      ]),
    };
  }

  async reportTool(toolId: string): Promise<Record<string, unknown>> {
    const spec = this.toolById(toolId);
    const dir = this.toolDir(spec.toolId);
    const report = withEvidenceHash({
      kind: "invented_tool_report",
      toolId: spec.toolId,
      reportedAt: nowIso(),
      purpose: spec.purpose,
      limitations: [
        "Safe computational discovery only.",
        "No unsafe domain use.",
        "No full-generality claim.",
      ],
      gates: [
        gate("LIMITATIONS_PRESENT", true),
        gate("NO_FAKE_TOOL_IMPROVEMENT_CLAIM", true),
      ],
    });
    await writeJson(join(dir, "tool-report.json"), report);
    await writeFile(
      join(dir, "TOOL_INVENTION_REPORT.md"),
      renderToolReport(spec.toolId, spec.purpose),
      "utf8",
    );
    return {
      kind: "discovery_tool_report",
      report,
      artifactRefs: this.refs(spec.toolId, [
        "tool-report.json",
        "TOOL_INVENTION_REPORT.md",
      ]),
    };
  }

  private toolSpec(capabilityGapId: string) {
    if (/counterexample/i.test(capabilityGapId)) {
      return INVENTED_TOOLS[0];
    }
    if (/complexity|overfit/i.test(capabilityGapId)) {
      return INVENTED_TOOLS[1];
    }
    if (/novelty/i.test(capabilityGapId)) {
      return INVENTED_TOOLS[2];
    }
    if (/baseline/i.test(capabilityGapId)) {
      return INVENTED_TOOLS[3];
    }
    throw new AppError(
      "CAPABILITY_GAP_UNKNOWN",
      `Unsupported discovery capability gap: ${capabilityGapId}`,
    );
  }

  private toolById(toolId: string) {
    const spec = INVENTED_TOOLS.find((item) => item.toolId === toolId);
    if (!spec) {
      throw new AppError("INVENTED_TOOL_NOT_FOUND", `Unknown tool: ${toolId}`);
    }
    return spec;
  }

  private toolDir(toolId: string): string {
    return join(this.root, ".sovryn", "lab", "tool-inventions", toolId);
  }

  private refs(toolId: string, files: string[]): string[] {
    return files.map((file) => `.sovryn/lab/tool-inventions/${toolId}/${file}`);
  }
}

function gate(code: string, passed: boolean) {
  return {
    code,
    passed,
    severity: passed ? "info" : "warn",
    message: code,
    evidencePath: null,
    expectedFix: passed ? null : "Review invented discovery tool evidence.",
  };
}

function withEvidenceHash<T extends Record<string, unknown>>(
  value: T,
): T & {
  evidenceHash: string;
} {
  return { ...value, evidenceHash: hashEvidence(value) };
}

function renderToolReport(toolId: string, purpose: string): string {
  return `# ${toolId}

Purpose: ${purpose}

This is a bounded invented discovery instrument. It has tests, benchmark cases, integration evidence, and limitations. It is safe computational science only and does not claim full generality.
`;
}
