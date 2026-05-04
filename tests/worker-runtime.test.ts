import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import {
  workerDoctor,
  workerDoctorAll,
  workerPolicyCheck,
} from "../src/core/worker/worker-doctor.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

test("worker doctor supports sandbox-local profile", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "sandbox-local");
  assert.equal(result.profile, "sandbox-local");
  assert.equal(result.available, true);
  assert.equal(result.assurance, "low");
});

test("worker doctor supports container-local profile", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "container-local");
  assert.equal(result.profile, "container-local");
  assert.equal(["docker", "podman", null].includes(result.runtime), true);
});

test("worker doctor supports container-netoff profile", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "container-netoff");
  assert.equal(result.profile, "container-netoff");
  assert.equal(result.networkPolicy === "off" || !result.available, true);
});

test("worker doctor reports vm-local unavailable without fallback", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "vm-local");
  assert.equal(result.available, false);
  assert.match(result.limitations.join(" "), /must not silently fall back/i);
});

test("worker doctor reports ci-isolated unavailable without fallback", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "ci-isolated");
  assert.equal(result.available, false);
  assert.match(result.warnings.join(" "), /unavailable/i);
});

test("worker doctor writes profile evidence", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  await workerDoctor(repo.root, "container-netoff");
  await access(
    join(repo.root, ".sovryn", "workers", "doctor-container-netoff.json"),
  );
});

test("worker doctor --all returns all profiles", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctorAll(repo.root);
  assert.deepEqual(result.profiles.map((profile) => profile.profile).sort(), [
    "ci-isolated",
    "container-local",
    "container-netoff",
    "sandbox-local",
    "vm-local",
  ]);
});

test("worker doctor --all writes sandbox and policy reports", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  await workerDoctorAll(repo.root);
  await access(
    join(repo.root, ".sovryn", "workers", "worker-sandbox-report.json"),
  );
  await access(
    join(repo.root, ".sovryn", "workers", "network-policy-report.json"),
  );
  await access(
    join(repo.root, ".sovryn", "workers", "filesystem-mount-report.json"),
  );
  await access(
    join(repo.root, ".sovryn", "workers", "resource-limit-report.json"),
  );
});

test("worker policy check writes worker-policy evidence", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerPolicyCheck(repo.root);
  assert.equal(result.kind, "worker_policy_check");
  await access(join(repo.root, ".sovryn", "workers", "worker-policy.json"));
});

test("worker policy check writes supply-chain risk report", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  await workerPolicyCheck(repo.root);
  const report = await readFile(
    join(repo.root, ".sovryn", "workers", "supply-chain-risk-report.json"),
    "utf8",
  );
  assert.match(report, /supply-chain/i);
});

test("worker policy check blocks unavailable high-assurance profiles", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerPolicyCheck(repo.root);
  assert.equal(result.blockedProfiles.includes("vm-local"), true);
  assert.equal(result.blockedProfiles.includes("ci-isolated"), true);
});

test("worker doctor results are hash-bound", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "sandbox-local");
  const evidenceHash = result.evidenceHash ?? "";
  assert.equal(typeof evidenceHash, "string");
  assert.equal(evidenceHash.length > 10, true);
});

test("sandbox-local doctor records constrained prototype-only policy", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "sandbox-local");
  assert.equal(result.filesystemPolicy, "prototype_only");
  assert.equal(result.networkPolicy, "best_effort_off");
  assert.match(result.limitations.join(" "), /not OS isolation/i);
});

test("container-netoff doctor documents network-off intent", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "container-netoff");
  if (result.available) {
    assert.equal(result.networkPolicy, "off");
    assert.match(result.recommendedCommand ?? "", /--network none/);
  } else {
    assert.equal(result.networkPolicy, "unavailable");
    assert.match(result.limitations.join(" "), /must not silently fall back/i);
  }
});

test("container profiles report resource-limit intent when available", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctor(repo.root, "container-local");
  if (result.available) {
    assert.equal(result.resourceLimits.includes("--cpus 1"), true);
    assert.equal(result.resourceLimits.includes("--memory 512m"), true);
  } else {
    assert.deepEqual(result.resourceLimits, []);
  }
});

test("worker doctor --all writes aggregate doctor evidence", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerDoctorAll(repo.root);
  assert.equal(typeof result.evidenceHash, "string");
  await access(join(repo.root, ".sovryn", "workers", "doctor-all.json"));
});

test("worker sandbox report records assurance labels", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  await workerDoctorAll(repo.root);
  const report = await readFile(
    join(repo.root, ".sovryn", "workers", "worker-sandbox-report.json"),
    "utf8",
  );
  assert.match(report, /medium-high|medium|low/);
});

test("worker network policy report records container-netoff", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  await workerDoctorAll(repo.root);
  const report = await readFile(
    join(repo.root, ".sovryn", "workers", "network-policy-report.json"),
    "utf8",
  );
  assert.match(report, /container-netoff/);
});

test("worker policy keeps sandbox-local allowed as low-assurance profile", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerPolicyCheck(repo.root);
  assert.equal(result.allowedProfiles.includes("sandbox-local"), true);
});

test("worker policy explicitly bans silent fallback", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerPolicyCheck(repo.root);
  assert.match(result.rules.join(" "), /silently fall back/i);
});

test("worker policy artifact refs include isolation reports", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await workerPolicyCheck(repo.root);
  assert.equal(
    result.artifactRefs.includes(".sovryn/workers/network-policy-report.json"),
    true,
  );
  assert.equal(
    result.artifactRefs.includes(
      ".sovryn/workers/filesystem-mount-report.json",
    ),
    true,
  );
});

test("CLI worker doctor --all returns stable JSON", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await executeCli(
    ["worker", "doctor", "--all", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).kind, "worker_doctor_all");
});

test("CLI worker doctor supports container-netoff", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await executeCli(
    ["worker", "doctor", "--profile", "container-netoff", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).profile, "container-netoff");
});

test("CLI worker policy check returns stable JSON", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await executeCli(
    ["worker", "policy", "check", "--json"],
    repo.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).kind, "worker_policy_check");
});

test("CLI worker rejects invalid profiles", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await executeCli(
    ["worker", "doctor", "--profile", "host-root", "--json"],
    repo.root,
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "WORKER_PROFILE_INVALID");
});

test("CLI worker doctor defaults to container-local profile", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const result = await executeCli(["worker", "doctor", "--json"], repo.root);
  assert.equal(result.ok, true);
  assert.equal((result.data as any).profile, "container-local");
});

test("CLI worker run rejects sandbox-local profile", async () => {
  const fixture = await openInventionFixture();
  const result = await executeCli(
    [
      "worker",
      "run",
      fixture.missionId,
      "--profile",
      "sandbox-local",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "WORKER_RUN_PROFILE_INVALID");
});

test("CLI node run rejects unavailable worker-only profiles", async () => {
  const fixture = await openInventionFixture();
  const result = await executeCli(
    [
      "node",
      "run",
      "alpha",
      fixture.missionId,
      "--profile",
      "vm-local",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "NODE_RUN_PROFILE_INVALID");
});

test("CLI help lists worker doctor --all", async () => {
  const result = await executeCli(["--help", "--json"]);
  assert.match((result.data as any).help, /worker doctor --all/);
});

test("CLI help lists worker policy check", async () => {
  const result = await executeCli(["--help", "--json"]);
  assert.match((result.data as any).help, /worker policy check/);
});

test("CLI help lists worker run", async () => {
  const result = await executeCli(["--help", "--json"]);
  assert.match((result.data as any).help, /worker run <mission-id>/);
});

test("node run accepts container-netoff profile without silent fallback", async () => {
  const fixture = await openInventionFixture();
  await executeCli(
    ["node", "register", "alpha", "--host", "local", "--json"],
    fixture.root,
  );
  const result = await executeCli(
    [
      "node",
      "run",
      "alpha",
      fixture.missionId,
      "--mode",
      "validate",
      "--profile",
      "container-netoff",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).result.profile, "container-netoff");
  if ((result.data as any).result.exitCode !== 0) {
    assert.match(
      (result.data as any).result.commands[0].command,
      /container-netoff unavailable|create\/cp\/start/,
    );
  }
});

test("worker run uses Node Alpha container-netoff path", async () => {
  const fixture = await openInventionFixture();
  const result = await executeCli(
    [
      "worker",
      "run",
      fixture.missionId,
      "--profile",
      "container-netoff",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as any).result.profile, "container-netoff");
});

test("container-netoff evidence summary excludes raw logs", async () => {
  const fixture = await openInventionFixture();
  await executeCli(
    [
      "worker",
      "run",
      fixture.missionId,
      "--profile",
      "container-netoff",
      "--json",
    ],
    fixture.root,
  );
  const summary = await readFile(
    join(
      fixture.root,
      ".sovryn",
      "inventions",
      fixture.slug,
      "evidence",
      "execution",
      "container-netoff-prototype-execution.summary.json",
    ),
    "utf8",
  ).catch(() => "");
  assert.doesNotMatch(summary, /stdout|stderr|api_key|SOVRYN_GITHUB_TOKEN/);
});

test("worker reports do not expose local home paths in policy evidence", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  await workerPolicyCheck(repo.root);
  const policy = await readFile(
    join(repo.root, ".sovryn", "workers", "worker-policy.json"),
    "utf8",
  );
  assert.doesNotMatch(policy, /\/Users\/|\/home\//);
});

async function openInventionFixture(): Promise<{
  root: string;
  missionId: string;
  slug: string;
}> {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const created = await executeCli(
    ["invent-open", "A worker profile validation invention", "--json"],
    repo.root,
  );
  assert.equal(created.ok, true);
  return {
    root: repo.root,
    missionId: (created.data as any).mission.id,
    slug: (created.data as any).mission.slug,
  };
}
