import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";

type ToolchainFixture = {
  root: string;
  factoryId: string;
  plan: any;
};

let fixturePromise: Promise<ToolchainFixture> | null = null;

test("Node Alpha toolchain plan creates expected artifacts", async () => {
  const fixture = await toolchainFixture();
  const root = toolchainRoot(fixture.root);
  await access(join(root, "toolchain-plan.json"));
  await access(join(root, "toolchain-policy-review.json"));
});

test("Node Alpha toolchain plan binds to factory id", async () => {
  const fixture = await toolchainFixture();
  assert.equal(fixture.plan.factoryId, fixture.factoryId);
});

test("Node Alpha toolchain plan includes required research tools", async () => {
  const fixture = await toolchainFixture();
  const required = fixture.plan.requiredTools.map((tool: any) => tool.name);
  for (const name of ["node", "npm", "git", "ripgrep", "jq"]) {
    assert.equal(required.includes(name), true);
  }
});

test("Node Alpha toolchain plan includes optional document and container tools", async () => {
  const fixture = await toolchainFixture();
  const optional = fixture.plan.optionalTools.map((tool: any) => tool.name);
  for (const name of [
    "python3",
    "graphviz",
    "pandoc",
    "pdftotext",
    "docker",
    "podman",
  ]) {
    assert.equal(optional.includes(name), true);
  }
});

test("Node Alpha toolchain policy blocks host installation", async () => {
  const fixture = await toolchainFixture();
  const review = await readJson(
    join(toolchainRoot(fixture.root), "toolchain-policy-review.json"),
  );
  assert.equal(review.hostInstallAllowed, false);
  assert.equal(review.sudoAllowed, false);
  assert.equal(review.networkInstallAllowed, false);
});

test("Node Alpha toolchain policy records blocked host commands", async () => {
  const fixture = await toolchainFixture();
  assert.equal(
    fixture.plan.blockedCommands.some((command: string) =>
      /sudo/.test(command),
    ),
    true,
  );
  assert.equal(
    fixture.plan.blockedCommands.some((command: string) =>
      /curl/.test(command),
    ),
    true,
  );
});

test("Node Alpha toolchain doctor writes evidence", async () => {
  const fixture = await toolchainFixture();
  const doctor = await executeCli(
    ["node", "alpha", "toolchain", "doctor", "--json"],
    fixture.root,
  );
  assert.equal(doctor.ok, true);
  await access(join(toolchainRoot(fixture.root), "toolchain-doctor.json"));
});

test("Node Alpha toolchain doctor records container availability", async () => {
  const fixture = await toolchainFixture();
  const doctor = await executeCli(
    ["node", "alpha", "toolchain", "doctor", "--json"],
    fixture.root,
  );
  assert.equal(
    typeof (doctor.data as any).doctor.containerRuntimeAvailable,
    "boolean",
  );
});

test("Node Alpha toolchain status returns nulls before plan", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init", "--json"], repo.root);
  const status = await executeCli(
    ["node", "alpha", "toolchain", "status", "--json"],
    repo.root,
  );
  assert.equal(status.ok, true);
  assert.equal((status.data as any).plan, null);
  assert.equal((status.data as any).lock, null);
});

test("Node Alpha toolchain status returns plan after plan", async () => {
  const fixture = await toolchainFixture();
  const status = await executeCli(
    ["node", "alpha", "toolchain", "status", "--json"],
    fixture.root,
  );
  assert.equal(status.ok, true);
  assert.equal(
    (status.data as any).plan.toolchainPlanId,
    fixture.plan.toolchainPlanId,
  );
});

test("Node Alpha toolchain install rejects unsupported profiles", async () => {
  const fixture = await toolchainFixture();
  const result = await executeCli(
    [
      "node",
      "alpha",
      "toolchain",
      "install",
      fixture.plan.toolchainPlanId,
      "--profile",
      "host",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "TOOLCHAIN_PROFILE_INVALID");
});

test("Node Alpha toolchain install writes lock and redacted log", async () => {
  const fixture = await toolchainFixture();
  const result = await installToolchain(fixture);
  assert.equal(result.installLog.kind, "node_alpha_toolchain_install_log");
  await access(join(toolchainRoot(fixture.root), "install-log.redacted.json"));
  await access(join(toolchainRoot(fixture.root), "toolchain-lock.json"));
});

test("Node Alpha toolchain install writes installed-tools evidence", async () => {
  const fixture = await toolchainFixture();
  await installToolchain(fixture);
  const installed = await readJson(
    join(toolchainRoot(fixture.root), "installed-tools.json"),
  );
  assert.equal(installed.kind, "node_alpha_installed_tools");
  assert.equal(Array.isArray(installed.installedTools), true);
});

test("Node Alpha toolchain install does not log sudo commands", async () => {
  const fixture = await toolchainFixture();
  const result = await installToolchain(fixture);
  assert.equal(
    result.installLog.commandLog.some((entry: any) =>
      /sudo/.test(entry.command),
    ),
    false,
  );
});

test("Node Alpha toolchain install uses relative cwd in logs", async () => {
  const fixture = await toolchainFixture();
  const result = await installToolchain(fixture);
  assert.equal(
    result.installLog.commandLog.every((entry: any) => entry.cwd === "."),
    true,
  );
});

test("Node Alpha toolchain lock binds to plan id", async () => {
  const fixture = await toolchainFixture();
  const result = await installToolchain(fixture);
  assert.equal(result.lock.toolchainPlanId, fixture.plan.toolchainPlanId);
});

test("Node Alpha toolchain plan id is stable for same factory id", async () => {
  const fixture = await toolchainFixture();
  const second = await executeCli(
    ["node", "alpha", "toolchain", "plan", fixture.factoryId, "--json"],
    fixture.root,
  );
  assert.equal(second.ok, true);
  assert.equal(
    (second.data as any).plan.toolchainPlanId,
    fixture.plan.toolchainPlanId,
  );
});

test("Node Alpha toolchain install blocks unknown plan ids", async () => {
  const fixture = await toolchainFixture();
  const result = await executeCli(
    [
      "node",
      "alpha",
      "toolchain",
      "install",
      "tcp_missing",
      "--profile",
      "container-local",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "TOOLCHAIN_PLAN_NOT_FOUND");
});

test("CLI help lists Node Alpha toolchain commands", async () => {
  const result = await executeCli(["--help"]);
  assert.equal(result.ok, true);
  assert.match((result.data as any).help, /node alpha toolchain plan/);
  assert.match((result.data as any).help, /node alpha toolchain install/);
});

test("Node Alpha toolchain plan has no raw secret text", async () => {
  const fixture = await toolchainFixture();
  const raw = await readFile(
    join(toolchainRoot(fixture.root), "toolchain-plan.json"),
    "utf8",
  );
  assert.doesNotMatch(raw, /SOVRYN_GITHUB_TOKEN|sk-[A-Za-z0-9]/);
});

test("Node Alpha toolchain policy review is hash-bound", async () => {
  const fixture = await toolchainFixture();
  const review = await readJson(
    join(toolchainRoot(fixture.root), "toolchain-policy-review.json"),
  );
  assert.equal(typeof review.evidenceHash, "string");
  assert.equal(review.evidenceHash.length, 64);
});

test("Node Alpha toolchain doctor records required tool statuses", async () => {
  const fixture = await toolchainFixture();
  const result = await executeCli(
    ["node", "alpha", "toolchain", "doctor", "--json"],
    fixture.root,
  );
  const names = (result.data as any).doctor.tools.map((tool: any) => tool.name);
  assert.equal(names.includes("node"), true);
  assert.equal(names.includes("npm"), true);
});

test("Node Alpha toolchain status returns lock after install", async () => {
  const fixture = await toolchainFixture();
  await installToolchain(fixture);
  const status = await executeCli(
    ["node", "alpha", "toolchain", "status", "--json"],
    fixture.root,
  );
  assert.equal(status.ok, true);
  assert.equal(
    (status.data as any).lock.toolchainPlanId,
    fixture.plan.toolchainPlanId,
  );
});

test("Node Alpha toolchain artifacts stay under node alpha toolchain directory", async () => {
  const fixture = await toolchainFixture();
  await installToolchain(fixture);
  for (const file of [
    "toolchain-plan.json",
    "toolchain-policy-review.json",
    "install-log.redacted.json",
    "toolchain-lock.json",
    "installed-tools.json",
  ]) {
    await access(join(toolchainRoot(fixture.root), file));
  }
});

test("Node Alpha toolchain install summary states host install is not attempted", async () => {
  const fixture = await toolchainFixture();
  const result = await installToolchain(fixture);
  assert.match(result.installLog.summary, /host/i);
});

test("Node Alpha toolchain CLI returns artifact refs", async () => {
  const fixture = await toolchainFixture();
  const result = await executeCli(
    ["node", "alpha", "toolchain", "doctor", "--json"],
    fixture.root,
  );
  assert.equal(result.ok, true);
  assert.equal(result.artifactRefs.length > 0, true);
  assert.equal((result.data as any).artifactRefs.length > 0, true);
});

async function toolchainFixture(): Promise<ToolchainFixture> {
  if (!fixturePromise) fixturePromise = createToolchainFixture();
  return fixturePromise;
}

async function createToolchainFixture(): Promise<ToolchainFixture> {
  const repo = await makeTempRepo();
  const init = await executeCli(["init", "--json"], repo.root);
  assert.equal(init.ok, true);
  const factory = await executeCli(
    [
      "factory",
      "run",
      "Develop a toolchain planning method for Node Alpha research",
      "--json",
    ],
    repo.root,
  );
  assert.equal(factory.ok, true);
  const factoryId = (factory.data as any).run.id;
  const plan = await executeCli(
    ["node", "alpha", "toolchain", "plan", factoryId, "--json"],
    repo.root,
  );
  assert.equal(plan.ok, true);
  return {
    root: repo.root,
    factoryId,
    plan: (plan.data as any).plan,
  };
}

async function installToolchain(fixture: ToolchainFixture): Promise<any> {
  const result = await executeCli(
    [
      "node",
      "alpha",
      "toolchain",
      "install",
      fixture.plan.toolchainPlanId,
      "--profile",
      "container-local",
      "--json",
    ],
    fixture.root,
  );
  assert.equal(result.ok, true);
  return result.data as any;
}

function toolchainRoot(root: string): string {
  return join(root, ".sovryn", "nodes", "alpha", "toolchains");
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}
