import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { readJson } from "../src/shared/fs.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

async function initExternalReproductionFixture() {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  return repo;
}

function gatePassed(gates: any[], code: string): boolean {
  return gates.find((gate) => gate.code === code)?.passed === true;
}

test("help lists external reproduction and extension commands", async () => {
  const response = await executeCli(["--help", "--json"]);
  assert.equal(response.ok, true);
  const help = String((response.data as any).help);
  assert.match(help, /sovryn external-reproduction target select/);
  assert.match(help, /sovryn external-reproduction baseline reproduce/);
  assert.match(help, /sovryn external-reproduction gaps analyze/);
  assert.match(help, /sovryn external-reproduction improvements evaluate/);
  assert.match(help, /sovryn external-reproduction reviewer attack/);
  assert.match(help, /sovryn external-reproduction publish result/);
});

test("external target selection scans, shortlists, and preregisters a real target", async () => {
  const repo = await initExternalReproductionFixture();
  const response = await executeCli(
    ["external-reproduction", "target", "select", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const scan = (response.data as any).scan;
  assert.equal(scan.kind, "external_target_scan");
  assert.equal(scan.scannedTargetCount, 20);
  assert.equal(scan.shortlistedTargetCount, 5);
  assert.equal(scan.selectedTargetId, "external-target-scifact");
  assert.equal(scan.selectedTarget.title.includes("Sovryn"), false);
  assert.ok(
    scan.selectedTarget.publicDataset || scan.selectedTarget.publicCode,
  );
  assert.ok(scan.preregistration.metrics.length >= 5);
  assert.equal(gatePassed(scan.gates, "PREREGISTRATION_PRESENT"), true);
  assert.equal(gatePassed(scan.gates, "NO_SELF_REFERENTIAL_TARGET"), true);
  for (const file of [
    "external-target-scan.json",
    "EXTERNAL_TARGET_SCAN.md",
    "SELECTED_EXTERNAL_TARGET.md",
    "BACKUP_EXTERNAL_TARGET.md",
    "REPRODUCTION_PREREGISTRATION.md",
    "REPRODUCTION_RISK_ASSESSMENT.md",
    "TOOL_NEEDS.md",
    "SAFETY_SCOPE.md",
  ]) {
    await access(
      join(
        repo.root,
        ".sovryn",
        "external-reproduction",
        "target-selection",
        file,
      ),
    );
  }
});

test("baseline reproduction prepares environment and records deviations before improvements", async () => {
  const repo = await initExternalReproductionFixture();
  const response = await executeCli(
    ["external-reproduction", "baseline", "reproduce", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.kind, "external_baseline_reproduction");
  assert.equal(run.nodeAlphaExecution.profile, "container-netoff");
  assert.equal(run.nodeAlphaExecution.noSilentFallback, true);
  assert.ok(run.tools.length >= 2);
  assert.ok(run.datasets.length >= 2);
  assert.ok(run.baselineResults.length >= 1);
  assert.ok(run.deviations.length >= 1);
  assert.equal(gatePassed(run.gates, "NODE_ALPHA_EXECUTION_PRESENT"), true);
  assert.equal(gatePassed(run.gates, "REPRODUCTION_DEVIATIONS_RECORDED"), true);
  assert.equal(gatePassed(run.gates, "NO_FAKE_REPRODUCTION_CLAIMS"), true);
  for (const file of [
    "reproduction-environment.json",
    "TOOLCHAIN_REPORT.md",
    "DATASET_PREPARATION.md",
    "BASELINE_REPRODUCTION.md",
    "REPRODUCTION_DEVIATIONS.md",
    "REPRODUCIBILITY_SCORE.md",
    "LIMITATIONS.md",
  ]) {
    await access(
      join(
        repo.root,
        ".sovryn",
        "external-reproduction",
        "baseline-reproduction",
        file,
      ),
    );
  }
});

test("gap analysis binds to reproduction and selects targeted improvement hypotheses", async () => {
  const repo = await initExternalReproductionFixture();
  const response = await executeCli(
    ["external-reproduction", "gaps", "analyze", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.kind, "external_gap_analysis");
  assert.ok(run.failureModes.length >= 10);
  assert.ok(run.improvementHypotheses.length >= 30);
  assert.ok(run.selectedHypotheses.length > 0);
  assert.ok(run.selectedHypotheses.length <= 5);
  assert.equal(gatePassed(run.gates, "BASELINE_REPRODUCTION_BOUND"), true);
  assert.equal(gatePassed(run.gates, "KILL_CRITERIA_PRESENT"), true);
  for (const file of [
    "GAP_ANALYSIS.md",
    "FAILURE_MODES.md",
    "IMPROVEMENT_HYPOTHESES.json",
    "HYPOTHESIS_FAMILY_MAP.md",
    "SELECTED_IMPROVEMENTS.md",
    "IMPROVEMENT_PREREGISTRATION.md",
    "KILL_CRITERIA.md",
  ]) {
    await access(
      join(repo.root, ".sovryn", "external-reproduction", "gap-analysis", file),
    );
  }
});

test("improvement evaluation freezes methods, records holdout losses, and rejects weak improvements", async () => {
  const repo = await initExternalReproductionFixture();
  const response = await executeCli(
    ["external-reproduction", "improvements", "evaluate", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.kind, "external_improvement_holdout_evaluation");
  assert.equal(run.methodsFrozenBeforeHoldout, true);
  assert.equal(run.methods.length, 5);
  assert.ok(run.losses > 0);
  assert.ok(run.rejectedImprovements.length > 0);
  assert.ok(run.survivingImprovements.length <= 2);
  assert.equal(gatePassed(run.gates, "NO_HOLDOUT_LEAKAGE"), true);
  assert.equal(gatePassed(run.gates, "NO_FAKE_IMPROVEMENT_CLAIMS"), true);
  await access(
    join(
      repo.root,
      ".sovryn",
      "external-reproduction",
      "improvements",
      "method-cards",
      "external-improvement-1.json",
    ),
  );
});

test("reviewer attack independently rebuilds survivors and records skeptical reviews", async () => {
  const repo = await initExternalReproductionFixture();
  const response = await executeCli(
    ["external-reproduction", "reviewer", "attack", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.kind, "external_independent_rebuild_and_reviewer_attack");
  assert.equal(run.replicationVariants.length, 5);
  assert.equal(run.reviewerAttacks.length, 5);
  assert.equal(
    run.independentImplementations.every(
      (item: any) => item.originalCodeReused === false,
    ),
    true,
  );
  assert.ok(
    run.replicationRows.some(
      (row: any) => row.finalStatus === "external_extension_supported",
    ),
  );
  assert.equal(gatePassed(run.gates, "LEAKAGE_REVIEW_PRESENT"), true);
  assert.equal(gatePassed(run.gates, "NO_FAKE_PEER_REVIEW_CLAIMS"), true);
});

test("external reproduction extension publishes paper-grade local package and passes audit", async () => {
  const repo = await initExternalReproductionFixture();
  const response = await executeCli(
    ["external-reproduction", "publish", "result", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const summary = (response.data as any).summary;
  assert.equal(summary.resultKind, "external_reproduction_extension_result");
  assert.equal(summary.finalResult, "external_extension_supported");
  assert.equal(summary.baselinesExecuted >= 4, true);
  assert.equal(summary.failureModes >= 10, true);
  assert.equal(summary.improvementHypotheses, 30);
  assert.equal(summary.implementedImprovements, 5);
  assert.equal(summary.replicationVariants, 5);
  assert.equal(summary.reviewerAttacks, 5);
  assert.equal(summary.noFakeReproductionClaims, true);
  assert.equal(summary.noFakeImprovementClaims, true);
  assert.equal(summary.noFakeBreakthroughClaims, true);
  for (const gate of [
    "EXTERNAL_TARGET_BOUND",
    "PREREGISTRATION_BOUND",
    "BASELINE_REPRODUCTION_PRESENT",
    "REPRODUCTION_DEVIATIONS_RECORDED",
    "GAP_ANALYSIS_PRESENT",
    "HOLDOUT_EVALUATION_PRESENT",
    "INDEPENDENT_REBUILD_PRESENT",
    "REVIEWER_ATTACKS_PRESENT",
    "FAILURES_AND_LOSSES_RECORDED",
    "FINAL_RESULT_LABEL_PRESENT",
    "KNOWLEDGE_UPDATED",
    "PUBLIC_HYGIENE_PASSED",
  ]) {
    assert.equal(gatePassed(summary.gates, gate), true, gate);
  }
  const audit = await executeCli(
    ["external-reproduction", "audit", "--json"],
    repo.root,
  );
  assert.equal(audit.ok, true, JSON.stringify(audit.errors));
  assert.equal((audit.data as any).audit.passed, true);
  const dir = join(
    repo.root,
    ".sovryn",
    "external-reproduction",
    "publication",
  );
  for (const file of [
    "README.md",
    "SUMMARY.json",
    "PAPER.md",
    "SELECTED_EXTERNAL_TARGET.md",
    "REPRODUCTION_PREREGISTRATION.md",
    "BASELINE_REPRODUCTION.md",
    "REPRODUCTION_DEVIATIONS.md",
    "GAP_ANALYSIS.md",
    "IMPROVEMENT_HYPOTHESES.md",
    "HOLDOUT_EVALUATION.md",
    "ABLATION_RESULTS.md",
    "SENSITIVITY_RESULTS.md",
    "INDEPENDENT_REBUILD.md",
    "REVIEWER_ATTACKS.md",
    "CLAIM_EVIDENCE_BINDINGS.json",
    "CONFIDENCE_UPDATE.md",
    "NEXT_RESEARCH_DIRECTION.md",
    "LIMITATIONS.md",
    "REPRODUCE.md",
  ]) {
    await access(join(dir, file));
  }
  const bindings = await readJson<Record<string, any>>(
    join(dir, "CLAIM_EVIDENCE_BINDINGS.json"),
  );
  assert.ok(bindings.bindingCount >= 6);
});
