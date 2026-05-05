import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { readJson } from "../src/shared/fs.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

async function initExternalProductionFixture() {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  return repo;
}

function gatePassed(gates: any[], code: string): boolean {
  return gates.find((gate) => gate.code === code)?.passed === true;
}

test("help lists external scientific production commands", async () => {
  const response = await executeCli(["--help", "--json"]);
  assert.equal(response.ok, true);
  const help = String((response.data as any).help);
  assert.match(help, /sovryn external-production problem tournament/);
  assert.match(help, /sovryn external-production baseline reproduce/);
  assert.match(help, /sovryn external-production methods search/);
  assert.match(help, /sovryn external-production kill-week run/);
  assert.match(help, /sovryn external-production rebuild replicate/);
  assert.match(help, /sovryn external-production publish result/);
});

test("external problem tournament selects and preregisters an external problem", async () => {
  const repo = await initExternalProductionFixture();
  const response = await executeCli(
    ["external-production", "problem", "tournament", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const tournament = (response.data as any).tournament;
  assert.equal(tournament.kind, "external_problem_tournament");
  assert.equal(tournament.scannedProblemCount, 10);
  assert.equal(tournament.shortlistedProblemCount, 5);
  assert.equal(tournament.selectedProblemId.includes("sovryn"), false);
  assert.ok(tournament.selectedProblem.publicDatasetsOrBenchmarks.length >= 3);
  assert.ok(tournament.preregistration.metrics.length >= 4);
  assert.ok(tournament.preregistration.killCriteria.length >= 3);
  assert.equal(gatePassed(tournament.gates, "SELECTED_PROBLEM_EXTERNAL"), true);
  assert.equal(
    gatePassed(tournament.gates, "NO_SELF_REFERENTIAL_ONLY_PROBLEM"),
    true,
  );
  for (const file of [
    "PROBLEM_TOURNAMENT_REPORT.md",
    "SELECTED_PROBLEM.md",
    "BACKUP_PROBLEM.md",
    "PREREGISTRATION.md",
    "TOOL_NEEDS.md",
    "SAFETY_SCOPE.md",
    "KILL_CRITERIA.md",
  ]) {
    await access(
      join(
        repo.root,
        ".sovryn",
        "external-production",
        "problem-tournament",
        file,
      ),
    );
  }
});

test("baseline reproduction operates external environment before method search", async () => {
  const repo = await initExternalProductionFixture();
  const response = await executeCli(
    ["external-production", "baseline", "reproduce", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.kind, "external_baseline_reproduction_run");
  assert.equal(run.candidateGenerationBlockedUntilBaselineComplete, true);
  assert.ok(run.tools.length >= 2);
  assert.ok(run.datasets.length >= 3);
  assert.ok(
    new Set(run.baselineResults.map((item: any) => item.baseline)).size >= 3,
  );
  assert.ok(run.baselineFailures.length >= 1);
  assert.equal(run.nodeAlphaExecution.noSilentFallback, true);
  assert.equal(gatePassed(run.gates, "NODE_ALPHA_EXECUTION_PRESENT"), true);
  assert.equal(gatePassed(run.gates, "NO_HOST_SUDO"), true);
  assert.equal(gatePassed(run.gates, "NO_UNSAFE_INSTALL_PATTERN"), true);
  for (const file of [
    "TOOLCHAIN_INSTALL_REPORT.md",
    "TOOL_VALIDATION_REPORT.md",
    "DATASET_ADAPTERS.md",
    "METRIC_IMPLEMENTATION.md",
    "BASELINE_REPRODUCTION_REPORT.md",
    "BASELINE_FAILURES.md",
    "LIMITATIONS.md",
  ]) {
    await access(
      join(
        repo.root,
        ".sovryn",
        "external-production",
        "baseline-reproduction",
        file,
      ),
    );
  }
});

test("new method search creates diverse runnable candidates without holdout leakage", async () => {
  const repo = await initExternalProductionFixture();
  const response = await executeCli(
    ["external-production", "methods", "search", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.generatedIdeaCount, 2000);
  assert.ok(run.rejectedIdeaCount > 1900);
  assert.equal(run.selectedDesignCount, 50);
  assert.equal(run.implementedCandidateCount, 25);
  assert.equal(run.trainingCalibrationOnly, true);
  assert.equal(run.holdoutEvaluationPerformed, false);
  assert.equal(
    run.methodFamilies.filter((family: any) => family.implementedCount > 0)
      .length >= 6,
    true,
  );
  assert.equal(gatePassed(run.gates, "NO_HOLDOUT_LEAKAGE"), true);
  const card = await readJson<Record<string, any>>(
    join(
      repo.root,
      ".sovryn",
      "external-production",
      "method-search",
      "method-cards",
      "external-candidate-0002.json",
    ),
  );
  assert.equal(card.implementation.runnablePrototype, true);
  assert.equal(card.implementation.holdoutLeakage, false);
});

test("Kill Week freezes candidates, runs challengers, records losses and limits survivors", async () => {
  const repo = await initExternalProductionFixture();
  const response = await executeCli(
    ["external-production", "kill-week", "run", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.equal(run.candidatesFrozenBeforeHoldout, true);
  assert.equal(run.candidateCount, 25);
  assert.equal(run.challengerCount, 8);
  assert.ok(run.adversarialCases.includes("incomplete sources"));
  assert.ok(run.lossesRecorded > 0);
  assert.ok(run.tiesRecorded > 0);
  assert.ok(run.rejectedCandidates.length > 0);
  assert.ok(run.survivingCandidates.length <= 3);
  assert.equal(gatePassed(run.gates, "NEGATIVE_RESULT_ALLOWED"), true);
  for (const file of [
    "HOLDOUT_RESULTS.md",
    "BASELINE_CHALLENGER_REPORT.md",
    "ADVERSARIAL_STRESS_REPORT.md",
    "WIN_LOSS_TIE_MATRIX.md",
    "REJECTED_CANDIDATES.md",
    "SURVIVING_CANDIDATES.md",
    "NEGATIVE_RESULT_DRAFT.md",
    "LIMITATIONS.md",
  ]) {
    await access(
      join(repo.root, ".sovryn", "external-production", "kill-week", file),
    );
  }
});

test("independent rebuild uses method specs only and downgrades ambiguous candidates", async () => {
  const repo = await initExternalProductionFixture();
  const response = await executeCli(
    ["external-production", "rebuild", "replicate", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const run = (response.data as any).run;
  assert.ok(run.selectedCandidateIds.length <= 3);
  assert.equal(run.replicationVariants.length, 5);
  assert.equal(
    run.implementations.every((item: any) => item.originalCodeReused === false),
    true,
  );
  assert.ok(
    run.candidateResults.some(
      (item: any) => item.finalStatus === "replication_supported_candidate",
    ),
  );
  assert.ok(
    run.candidateResults.some(
      (item: any) => item.finalStatus === "unstable_candidate",
    ),
  );
  assert.equal(gatePassed(run.gates, "ORIGINAL_CODE_NOT_REUSED"), true);
  assert.equal(gatePassed(run.gates, "AMBIGUOUS_METHODS_DOWNGRADED"), true);
  await access(
    join(
      repo.root,
      ".sovryn",
      "external-production",
      "independent-rebuild",
      "independent-implementations",
      `${run.selectedCandidateIds[0]}.json`,
    ),
  );
});

test("external scientific production result publishes local paper-grade package and passes audit", async () => {
  const repo = await initExternalProductionFixture();
  const response = await executeCli(
    ["external-production", "publish", "result", "--json"],
    repo.root,
  );
  assert.equal(response.ok, true, JSON.stringify(response.errors));
  const summary = (response.data as any).summary;
  assert.equal(summary.resultKind, "external_scientific_production_result");
  assert.equal(summary.finalResult, "replication_supported_external_candidate");
  assert.equal(summary.generatedIdeas, 2000);
  assert.equal(summary.implementedCandidates, 25);
  assert.equal(summary.challengers, 8);
  assert.equal(summary.replicationVariants, 5);
  assert.equal(summary.noFakeBenchmarkWin, true);
  assert.equal(summary.noFakeBreakthroughClaims, true);
  assert.equal(summary.noUnsupportedScientificClaims, true);
  for (const gate of [
    "EXTERNAL_PROBLEM_BOUND",
    "PREREGISTRATION_BOUND",
    "BASELINE_REPRODUCTION_PRESENT",
    "METHOD_SEARCH_PRESENT",
    "KILL_WEEK_PRESENT",
    "INDEPENDENT_REBUILD_PRESENT",
    "REPLICATION_PRESENT",
    "FAILURES_AND_LOSSES_RECORDED",
    "FINAL_STATUS_PRESENT",
    "KNOWLEDGE_UPDATED",
    "PUBLIC_HYGIENE_PASSED",
  ]) {
    assert.equal(gatePassed(summary.gates, gate), true, gate);
  }
  const audit = await executeCli(
    ["external-production", "audit", "--json"],
    repo.root,
  );
  assert.equal(audit.ok, true, JSON.stringify(audit.errors));
  assert.equal((audit.data as any).audit.passed, true);
  const dir = join(repo.root, ".sovryn", "external-production", "publication");
  for (const file of [
    "README.md",
    "SUMMARY.json",
    "PAPER.md",
    "PREREGISTRATION.md",
    "BASELINE_REPRODUCTION.md",
    "METHOD_SEARCH.md",
    "KILL_WEEK.md",
    "RESULTS.md",
    "NEGATIVE_RESULTS.md",
    "REPLICATION.md",
    "INDEPENDENT_REBUILD.md",
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
