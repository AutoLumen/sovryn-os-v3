import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { runCommand } from "../../adapters/shell/command.js";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { hashEvidence } from "../invention/pipeline.js";
import {
  isAllowedCorpusRemote,
  scanCorpusPublicHygiene,
} from "../corpus/corpus-autopublisher.js";
import { CorpusProductService } from "../corpus/corpus-product-service.js";

const TARGET_REPO_URL = "https://github.com/n57d30top/sovryn-open-inventions";
const DISCLAIMER =
  "This is an independent falsification and review artifact. It is not a patent filing, patentability opinion, legal novelty opinion, or freedom-to-operate opinion.";

type FalsificationLabel =
  | "passes_falsification"
  | "needs_revision"
  | "overclaims"
  | "insufficient_tests"
  | "blocked";

type NegativeTest = {
  testId: string;
  purpose: string;
  inputCase: string;
  expectedBehavior: string;
  falsificationTarget: string;
  safeSyntheticOnly: true;
};

type FalsificationCheck = {
  checkId: string;
  passed: boolean;
  severity: "info" | "warn" | "block";
  finding: string;
  recommendedAction: string;
};

type FalsificationResult = {
  kind: "public_corpus_result_falsification";
  evaluatedAt: string;
  slug: string;
  title: string;
  domain: string;
  qualityLabel: string;
  lifecycleStatus: string;
  label: FalsificationLabel;
  score: number;
  checks: FalsificationCheck[];
  negativeTests: NegativeTest[];
  overclaimFindings: string[];
  counterEvidenceSummary: string;
  recommendedAction: string;
  publicHygienePassed: boolean;
  disclaimer: string;
  evidenceHash: string;
};

export class FalsificationService {
  constructor(private readonly root: string) {}

  async falsify(input: {
    targetRepo: string;
    slug: string;
  }): Promise<Record<string, unknown>> {
    const target = resolve(input.targetRepo);
    await assertTargetRepo(target);
    const slug = stableSlug(input.slug);
    const result = await this.evaluateResult(target, slug);
    await writeResultArtifacts(target, result);
    const aggregate = await this.writeAggregate(target, [result], {
      rebuildSite: true,
    });
    return {
      falsification: result,
      aggregate,
      artifactRefs: [
        `results/${slug}/FALSIFICATION.md`,
        `results/${slug}/negative-tests/negative-tests.json`,
        "aggregate/falsification-report.json",
        "aggregate/FALSIFICATION_REPORT.md",
      ],
    };
  }

  async falsifyAll(input: {
    targetRepo: string;
  }): Promise<Record<string, unknown>> {
    const target = resolve(input.targetRepo);
    await assertTargetRepo(target);
    const slugs = await listResultSlugs(target);
    const results: FalsificationResult[] = [];
    for (const slug of slugs) {
      const result = await this.evaluateResult(target, slug);
      await writeResultArtifacts(target, result);
      results.push(result);
    }
    const aggregate = await this.writeAggregate(target, results, {
      rebuildSite: true,
    });
    return {
      aggregate,
      artifactRefs: [
        "aggregate/falsification-report.json",
        "aggregate/FALSIFICATION_REPORT.md",
      ],
    };
  }

  private async evaluateResult(
    targetRepo: string,
    slug: string,
  ): Promise<FalsificationResult> {
    const resultRoot = join(targetRepo, "results", slug);
    if (!(await pathExists(resultRoot))) {
      throw new AppError(
        "FALSIFICATION_RESULT_NOT_FOUND",
        `Public corpus result not found: ${slug}.`,
        { slug },
      );
    }
    const summary = await readJson<Record<string, unknown>>(
      join(resultRoot, "SUMMARY.json"),
    ).catch((): Record<string, unknown> => ({}));
    const record = await readJson<Record<string, unknown>>(
      join(resultRoot, "AUTOPUBLISH_RECORD.json"),
    ).catch((): Record<string, unknown> => ({}));
    const textContent = await readDirectoryText(resultRoot);
    const title = text(summary.title, text(record.title, titleFromSlug(slug)));
    const domain = inferDomain(slug, `${title} ${textContent}`);
    const negativeTests = negativeTestsForDomain(domain, slug);
    const overclaimFindings = findOverclaims(textContent, domain);
    const hygiene = await scanCorpusPublicHygiene(resultRoot);
    const checks = buildChecks({
      textContent,
      domain,
      negativeTests,
      overclaimFindings,
      hygienePassed: hygiene.passed,
      qualityLabel: text(record.qualityLabel, text(summary.qualityLabel, "")),
    });
    const label = labelForChecks(checks);
    const score = scoreForChecks(checks, negativeTests);
    return withHash({
      kind: "public_corpus_result_falsification" as const,
      evaluatedAt: nowIso(),
      slug,
      title,
      domain,
      qualityLabel: text(record.qualityLabel, text(summary.qualityLabel, "")),
      lifecycleStatus: text(summary.lifecycleStatus, "public_result"),
      label,
      score,
      checks,
      negativeTests,
      overclaimFindings,
      counterEvidenceSummary: counterEvidenceSummary(domain, label),
      recommendedAction: recommendedAction(label),
      publicHygienePassed: hygiene.passed,
      disclaimer: DISCLAIMER,
      evidenceHash: "",
    });
  }

  private async writeAggregate(
    targetRepo: string,
    results: FalsificationResult[],
    input: { rebuildSite: boolean },
  ): Promise<Record<string, unknown>> {
    const aggregateRoot = join(targetRepo, "aggregate");
    await mkdir(aggregateRoot, { recursive: true });
    const existing = await readJson<Record<string, unknown>>(
      join(aggregateRoot, "falsification-report.json"),
    ).catch((): Record<string, unknown> => ({ results: [] }));
    const existingResults = Array.isArray(existing.results)
      ? existing.results.filter(isRecord)
      : [];
    const merged = new Map<string, Record<string, unknown>>();
    for (const item of existingResults) merged.set(text(item.slug, ""), item);
    for (const result of results) merged.set(result.slug, result);
    const sorted = Array.from(merged.values()).sort((left, right) =>
      text(left.slug, "").localeCompare(text(right.slug, "")),
    );
    const report = withHash({
      kind: "public_corpus_falsification_report" as const,
      updatedAt: nowIso(),
      resultCount: sorted.length,
      labelCounts: countBy(sorted, (item) => text(item.label, "unknown")),
      results: sorted,
      disclaimer: DISCLAIMER,
      evidenceHash: "",
    });
    await writeJson(join(aggregateRoot, "falsification-report.json"), report);
    await writeFile(
      join(aggregateRoot, "FALSIFICATION_REPORT.md"),
      renderAggregateReport(report),
      "utf8",
    );
    if (input.rebuildSite) {
      await new CorpusProductService(this.root).buildSite({ targetRepo });
    }
    return report;
  }
}

async function writeResultArtifacts(
  targetRepo: string,
  result: FalsificationResult,
): Promise<void> {
  const resultRoot = join(targetRepo, "results", result.slug);
  const negativeRoot = join(resultRoot, "negative-tests");
  await mkdir(negativeRoot, { recursive: true });
  await writeJson(join(negativeRoot, "negative-tests.json"), {
    kind: "public_corpus_negative_tests",
    slug: result.slug,
    tests: result.negativeTests,
    evidenceHash: hashEvidence(result.negativeTests),
  });
  for (const test of result.negativeTests) {
    await writeJson(join(negativeRoot, `${test.testId}.json`), {
      kind: "public_corpus_negative_test_case",
      slug: result.slug,
      ...test,
      evidenceHash: hashEvidence(test),
    });
  }
  await writeFile(
    join(resultRoot, "FALSIFICATION.md"),
    renderResultReport(result),
    "utf8",
  );
}

function buildChecks(input: {
  textContent: string;
  domain: string;
  negativeTests: NegativeTest[];
  overclaimFindings: string[];
  hygienePassed: boolean;
  qualityLabel: string;
}): FalsificationCheck[] {
  return [
    check(
      "PUBLIC_HYGIENE_PASSED",
      input.hygienePassed,
      "block",
      "Public hygiene must pass before falsification can accept a result.",
      "Remove leaks, raw logs, unsafe text, private paths, or secret-like values.",
    ),
    check(
      "NO_OVERCLAIMS",
      input.overclaimFindings.length === 0,
      "block",
      input.overclaimFindings.length === 0
        ? "No overclaiming language found."
        : `Overclaiming language found: ${input.overclaimFindings.join("; ")}`,
      "Rewrite public docs with bounded, evidence-backed claims.",
    ),
    check(
      "NEGATIVE_TESTS_PRESENT",
      input.negativeTests.length >= 3,
      "warn",
      "Domain-specific negative tests should exist.",
      "Add negative tests for false positives, false negatives, malformed inputs, and edge cases.",
    ),
    check(
      "BENIGN_CASES_NOT_OVERFLAGGED",
      hasBenignCase(input.negativeTests),
      "warn",
      "Falsification should include benign cases that should not be overflagged.",
      "Add benign cases that exercise false-positive risk.",
    ),
    check(
      "ADVERSARIAL_SAFE_CASES_FLAGGED",
      hasFlaggedCase(input.negativeTests),
      "warn",
      "Falsification should include safe synthetic cases that should be flagged.",
      "Add safe synthetic edge cases for likely false negatives.",
    ),
    check(
      "README_CLAIMS_GROUNDED",
      /source evidence|verification|limitations|tests/i.test(input.textContent),
      "warn",
      "README and public docs should ground claims in evidence, tests, and limitations.",
      "Add source evidence, test, and limitation sections.",
    ),
    check(
      "QUALITY_NOT_WEAK",
      !/^(weak|unacceptable)$/i.test(input.qualityLabel),
      "block",
      "Weak quality labels cannot pass falsification.",
      "Revise the result or keep it out of showcase.",
    ),
  ];
}

function labelForChecks(checks: FalsificationCheck[]): FalsificationLabel {
  if (
    checks.some((item) => item.severity === "block" && !item.passed) &&
    checks.some((item) => item.checkId === "NO_OVERCLAIMS" && !item.passed)
  ) {
    return "overclaims";
  }
  if (checks.some((item) => item.severity === "block" && !item.passed)) {
    return "blocked";
  }
  if (
    checks.some(
      (item) => item.checkId === "NEGATIVE_TESTS_PRESENT" && !item.passed,
    )
  ) {
    return "insufficient_tests";
  }
  if (checks.some((item) => !item.passed)) return "needs_revision";
  return "passes_falsification";
}

function scoreForChecks(
  checks: FalsificationCheck[],
  negativeTests: NegativeTest[],
): number {
  const passed = checks.filter((item) => item.passed).length;
  const base = Math.round((passed / Math.max(1, checks.length)) * 80);
  const testBonus = Math.min(20, negativeTests.length * 4);
  return Math.max(0, Math.min(100, base + testBonus));
}

function negativeTestsForDomain(domain: string, slug: string): NegativeTest[] {
  if (domain === "software-supply-chain") {
    return [
      negativeTest(
        "benign-dependency-update",
        "Benign dependency update should not be scored as high risk without other suspicious signals.",
        "synthetic package patch with a version bump and matching tests",
        "low or medium risk, not high risk",
        "false-positive risk",
      ),
      negativeTest(
        "suspicious-install-script",
        "Suspicious install-script addition should be flagged for review.",
        "synthetic package patch adds a postinstall script and weak provenance",
        "high review priority",
        "false-negative risk",
      ),
      negativeTest(
        "harmless-refactor",
        "Harmless refactor should not be labeled dangerous.",
        "synthetic code-only refactor with no dependency or script changes",
        "low risk",
        "false-positive risk",
      ),
      negativeTest(
        "test-impact-mismatch",
        "Patch touching behavior without matching tests should be flagged.",
        "synthetic behavior change with unchanged tests",
        "test-impact mismatch",
        "coverage risk",
      ),
    ];
  }
  if (domain === "energy-data-quality") {
    return [
      negativeTest(
        "seasonal-normal-high-use",
        "Seasonal normal high usage should not be flagged as anomalous when weather explains it.",
        "synthetic winter usage with low temperature and expected heating load",
        "not anomalous after baseline normalization",
        "false-positive risk",
      ),
      negativeTest(
        "missing-interval",
        "Missing interval should be detected.",
        "synthetic hourly sequence skips one interval",
        "missing interval flag",
        "false-negative risk",
      ),
      negativeTest(
        "duplicate-record",
        "Duplicate timestamp should be detected.",
        "two records share anonymized meter and timestamp",
        "duplicate flag",
        "data integrity risk",
      ),
      negativeTest(
        "weather-normalized-anomaly",
        "Usage spike unexplained by weather should be detected.",
        "synthetic mild-weather record has extreme usage",
        "weather-normalized anomaly flag",
        "false-negative risk",
      ),
    ];
  }
  if (domain === "chemistry-data-quality") {
    return [
      negativeTest(
        "consistent-unit-conversion",
        "Consistent Celsius/Kelvin records should not be flagged as conflicts.",
        "toy water boiling point appears as 100 C and 373.15 K",
        "no conflict after unit normalization",
        "false-positive risk",
      ),
      negativeTest(
        "suspicious-acetone-record",
        "Suspicious acetone toy record should be flagged.",
        "toy acetone boiling point appears as 999 C",
        "outlier flag",
        "false-negative risk",
      ),
      negativeTest(
        "unknown-identifier",
        "Unknown identifier should be low confidence rather than silently canonicalized.",
        "toy molecule record has an unknown identifier",
        "low confidence equivalence",
        "identifier-confidence risk",
      ),
      negativeTest(
        "malformed-unit",
        "Malformed unit should be rejected or flagged.",
        "toy record uses unsupported temperature unit text",
        "invalid unit flag",
        "input validation risk",
      ),
    ];
  }
  return [
    negativeTest(
      `${stableSlug(slug)}-malformed-input`,
      "Malformed input should be rejected or marked low confidence.",
      "synthetic malformed record",
      "validation failure",
      "input validation risk",
    ),
    negativeTest(
      `${stableSlug(slug)}-benign-case`,
      "Benign input should not be overflagged.",
      "synthetic benign record",
      "low risk",
      "false-positive risk",
    ),
  ];
}

function negativeTest(
  testId: string,
  purpose: string,
  inputCase: string,
  expectedBehavior: string,
  falsificationTarget: string,
): NegativeTest {
  return {
    testId: stableSlug(testId),
    purpose,
    inputCase,
    expectedBehavior,
    falsificationTarget,
    safeSyntheticOnly: true,
  };
}

function findOverclaims(textContent: string, domain: string): string[] {
  const findings = [];
  const normalized = textContent.replace(/\s+/g, " ");
  const checks: Array<{ code: string; pattern: RegExp }> = [
    { code: "production-ready-claim", pattern: /\bproduction[- ]ready\b/i },
    { code: "guarantee-claim", pattern: /\bguaranteed\b/i },
    {
      code: "proves-risk-claim",
      pattern: /\bproves? (?:that )?.{0,120}\b(?:malicious|novel|safe)\b/i,
    },
    { code: "patentability-claim", pattern: /\bis patentable\b/i },
    { code: "legal-novelty-claim", pattern: /\blegally novel\b/i },
    {
      code: "freedom-to-operate-cleared-claim",
      pattern: /\bfreedom to operate (?:is )?cleared\b/i,
    },
  ];
  for (const check of checks) {
    if (!check.pattern.test(normalized)) continue;
    if (
      check.code === "guarantee-claim" &&
      /\b(?:not guaranteed|not a guarantee|no guarantee|does not guarantee|cannot guarantee)\b/i.test(
        normalized,
      )
    ) {
      continue;
    }
    if (
      check.code === "proves-risk-claim" &&
      /\b(?:does not|doesn't|cannot|can not|must not|should not|not)\s+prove.{0,120}\b(?:malicious|novel|safe)\b/i.test(
        normalized,
      )
    ) {
      continue;
    }
    findings.push(check.code);
  }
  if (
    domain === "chemistry-data-quality" &&
    /general smiles canonicali[sz]er|full cheminformatics toolkit/i.test(
      textContent,
    ) &&
    !/\b(?:not|never|does not|is not|isn't)\s+(?:a\s+)?(?:general smiles canonicali[sz]er|full cheminformatics toolkit)\b/i.test(
      normalized,
    )
  ) {
    findings.push("chemistry-generalization-overclaim");
  }
  return findings.sort();
}

function hasBenignCase(tests: NegativeTest[]): boolean {
  return tests.some((item) =>
    /benign|consistent|normal|harmless|not anomalous|low risk/i.test(
      `${item.testId} ${item.purpose} ${item.expectedBehavior}`,
    ),
  );
}

function hasFlaggedCase(tests: NegativeTest[]): boolean {
  return tests.some((item) =>
    /flag|high|missing|outlier|mismatch|invalid|anomaly/i.test(
      `${item.testId} ${item.purpose} ${item.expectedBehavior}`,
    ),
  );
}

function recommendedAction(label: FalsificationLabel): string {
  if (label === "passes_falsification") {
    return "Keep as reviewable public corpus evidence; continue human interpretation before use.";
  }
  if (label === "overclaims") {
    return "Rewrite public docs to remove overclaims and rerun falsification.";
  }
  if (label === "insufficient_tests") {
    return "Add negative tests and rerun falsification before showcase promotion.";
  }
  if (label === "blocked") {
    return "Fix blocking hygiene or quality failures before public promotion.";
  }
  return "Revise weak evidence, add counter-examples, and rerun falsification.";
}

function counterEvidenceSummary(
  domain: string,
  label: FalsificationLabel,
): string {
  const prefix =
    label === "passes_falsification"
      ? "No blocking falsification finding was detected."
      : "Falsification found a weakness that needs review.";
  if (domain === "software-supply-chain") {
    return `${prefix} The review still requires benign patch, suspicious-script, harmless-refactor, and test-impact mismatch checks.`;
  }
  if (domain === "energy-data-quality") {
    return `${prefix} The review still requires seasonal-normal, missing-interval, duplicate, and weather-normalized anomaly checks.`;
  }
  if (domain === "chemistry-data-quality") {
    return `${prefix} The review still requires consistent-unit, suspicious outlier, unknown identifier, and malformed-unit checks.`;
  }
  return `${prefix} Domain-specific negative tests should be expanded before stronger claims are made.`;
}

function renderResultReport(result: FalsificationResult): string {
  return `# Falsification: ${result.title}

Evaluation label: ${result.label}
Score: ${result.score}

## Purpose

This report tries to weaken or falsify the public result before it remains a
showcase or reviewable corpus artifact.

## Checks

${result.checks
  .map(
    (item) =>
      `- ${item.checkId}: ${item.passed ? "passed" : "failed"} (${item.severity}). ${item.finding}`,
  )
  .join("\n")}

## Negative Tests

${result.negativeTests
  .map(
    (item) => `### ${item.testId}

- Purpose: ${item.purpose}
- Input case: ${item.inputCase}
- Expected behavior: ${item.expectedBehavior}
- Falsification target: ${item.falsificationTarget}
- Safe synthetic only: ${String(item.safeSyntheticOnly)}
`,
  )
  .join("\n")}

## Overclaim Findings

${result.overclaimFindings.length === 0 ? "No blocking overclaim findings." : result.overclaimFindings.map((item) => `- ${item}`).join("\n")}

## Recommended Action

${result.recommendedAction}

${DISCLAIMER}
`;
}

function renderAggregateReport(report: Record<string, unknown>): string {
  const results = Array.isArray(report.results)
    ? report.results.filter(isRecord)
    : [];
  return `# Falsification Report

Results evaluated: ${String(report.resultCount)}

## Label Counts

${Object.entries(isRecord(report.labelCounts) ? report.labelCounts : {})
  .map(([label, count]) => `- ${label}: ${String(count)}`)
  .join("\n")}

## Results

${results
  .map(
    (item) =>
      `- ${text(item.slug, "result")}: ${text(item.label, "unknown")} (${String(item.score ?? 0)})`,
  )
  .join("\n")}

${DISCLAIMER}
`;
}

async function assertTargetRepo(target: string): Promise<void> {
  if (
    !(await pathExists(target)) ||
    !(await pathExists(join(target, ".git")))
  ) {
    throw new AppError(
      "FALSIFICATION_TARGET_REPO_REQUIRED",
      "Falsification requires the existing sovryn-open-inventions target repository.",
      { target },
    );
  }
  const remote = (
    await runCommand("git remote get-url origin", target, {
      allowNetwork: false,
    }).catch(() => ({ stdout: "" }))
  ).stdout.trim();
  if (!isAllowedCorpusRemote(remote)) {
    throw new AppError(
      "FALSIFICATION_TARGET_REPO_BLOCKED",
      "Falsification target repo must be n57d30top/sovryn-open-inventions.",
      { remote, allowed: TARGET_REPO_URL },
    );
  }
}

async function listResultSlugs(targetRepo: string): Promise<string[]> {
  const root = join(targetRepo, "results");
  const entries = await readdir(root).catch(() => []);
  const slugs: string[] = [];
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const path = join(root, entry);
    const info = await stat(path).catch(() => null);
    if (info?.isDirectory()) slugs.push(entry);
  }
  return slugs.sort();
}

async function readDirectoryText(root: string): Promise<string> {
  const files = await listFiles(root);
  const chunks: string[] = [];
  for (const file of files) {
    const local = relative(root, file);
    if (local === "FALSIFICATION.md" || local.startsWith(`negative-tests/`)) {
      continue;
    }
    const info = await stat(file).catch(() => null);
    if (!info || info.size > 250_000) continue;
    const buffer = await readFile(file);
    if (buffer.includes(0)) continue;
    chunks.push(buffer.toString("utf8"));
  }
  return chunks.join("\n");
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root).catch(() => []);
  const out: string[] = [];
  for (const entry of entries) {
    if (entry === ".git") continue;
    const path = join(root, entry);
    const info = await stat(path).catch(() => null);
    if (!info) continue;
    if (info.isDirectory()) out.push(...(await listFiles(path)));
    else if (info.isFile()) out.push(path);
  }
  return out.sort();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function inferDomain(slug: string, textContent: string): string {
  const haystack = `${slug} ${textContent}`.toLowerCase();
  if (/chem|molecular|mol-record|smiles/.test(haystack)) {
    return "chemistry-data-quality";
  }
  if (/energy|meter|weather|kwh/.test(haystack)) return "energy-data-quality";
  if (/patch|dependency|supply-chain|pull request/.test(haystack)) {
    return "software-supply-chain";
  }
  if (/corpus|dedup/.test(haystack)) return "open-invention-corpus";
  if (/evidence-chain|source-card/.test(haystack)) return "research-evidence";
  return "open-research";
}

function check(
  checkId: string,
  passed: boolean,
  severity: "info" | "warn" | "block",
  finding: string,
  recommendedAction: string,
): FalsificationCheck {
  return { checkId, passed, severity, finding, recommendedAction };
}

function withHash<T extends { evidenceHash: string }>(value: T): T {
  return {
    ...value,
    evidenceHash: hashEvidence({ ...value, evidenceHash: "" }),
  };
}

function countBy<T>(
  items: T[],
  selector: (item: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function stableSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "result"
  );
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
