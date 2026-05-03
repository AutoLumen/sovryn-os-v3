import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { executeCli } from "../src/cli/index.js";
import { discoverVerifyCommands } from "../src/core/verify/discovery.js";
import { DEFAULT_CONFIG } from "../src/core/config.js";
import { loadBuiltinPlugins } from "../src/plugins/loader.js";
import { redactSecrets } from "../src/shared/redaction.js";
import { makeTempRepo } from "../src/testkit/temp-repo.js";
import { runCommand } from "../src/adapters/shell/command.js";

test("init creates config and directories", async () => {
  const repo = await makeTempRepo();
  const response = await executeCli(["init", "--json"], repo.root);
  assert.equal(response.ok, true);
  await access(join(repo.root, ".sovryn", "config.json"));
  await access(join(repo.root, ".sovryn", "missions"));
  await access(join(repo.root, ".sovryn", "memory", "lessons.md"));
});

test("spawn creates a worktree and mission state with fake runner", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init"], repo.root);
  const response = await executeCli(["spawn", "write evidence", "--runner", "fake", "--json"], repo.root);
  assert.equal(response.ok, true);
  const mission = (response.data as any).mission;
  assert.equal(mission.status, "passed");
  await access(mission.worktreePath);
  await access(join(repo.root, ".sovryn", "missions", mission.id, "state.json"));
  await access(join(mission.worktreePath, "sovryn-fake-result.txt"));
});

test("fake runner failed verify mission remains failed", async () => {
  const repo = await makeTempRepo({
    packageJson: {
      scripts: {
        test: "node -e \"process.exit(1)\""
      }
    }
  });
  await executeCli(["init"], repo.root);
  const response = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  assert.equal(response.ok, true);
  const mission = (response.data as any).mission;
  assert.equal(mission.status, "failed");
  assert.equal(mission.lastVerifyPassed, false);
});

test("continue appends attempts", async () => {
  const repo = await makeTempRepo({
    packageJson: {
      scripts: {
        test: "node -e \"process.exit(1)\""
      }
    }
  });
  await executeCli(["init"], repo.root);
  const first = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  const mission = (first.data as any).mission;
  const second = await executeCli(["continue", mission.id], repo.root);
  assert.equal(second.ok, true);
  assert.equal((second.data as any).mission.attempts.length, 2);
});

test("verify discovery reads package scripts", async () => {
  const repo = await makeTempRepo({
    packageJson: {
      scripts: {
        build: "node -e \"process.exit(0)\"",
        typecheck: "node -e \"process.exit(0)\"",
        test: "node -e \"process.exit(0)\""
      }
    }
  });
  const commands = await discoverVerifyCommands(repo.root, DEFAULT_CONFIG);
  assert.deepEqual(commands, ["npm run build", "npm run typecheck", "npm test"]);
});

test("review includes diff stat and changed files", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  const review = await executeCli(["review", mission.id], repo.root);
  assert.equal(review.ok, true);
  const result = (review.data as any).review;
  assert.equal(result.fileCount, 1);
  assert.deepEqual(result.changedFiles, ["sovryn-fake-result.txt"]);
});

test("finalize blocks failed missions", async () => {
  const repo = await makeTempRepo({
    packageJson: {
      scripts: {
        test: "node -e \"process.exit(1)\""
      }
    }
  });
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  const finalize = await executeCli(["finalize", mission.id], repo.root);
  assert.equal(finalize.ok, false);
  assert.equal(finalize.errors[0].code, "MISSION_NOT_PASSED");
});

test("finalize blocks high-risk missions without approval", async () => {
  const repo = await makeTempRepo({ packageJson: { scripts: { test: "node -e \"process.exit(0)\"" } } });
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "change package", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  const finalize = await executeCli(["finalize", mission.id], repo.root);
  assert.equal(finalize.ok, false);
  assert.equal(finalize.errors[0].code, "POLICY_BLOCKED");
});

test("finalize blocks blocked paths", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "blocked path", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  await executeCli(["approve", mission.id], repo.root);
  const finalize = await executeCli(["finalize", mission.id], repo.root);
  assert.equal(finalize.ok, false);
  assert.equal(finalize.errors[0].code, "POLICY_BLOCKED");
});

test("reject removes worktree", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  const reject = await executeCli(["reject", mission.id], repo.root);
  assert.equal(reject.ok, true);
  await assert.rejects(access(mission.worktreePath));
});

test("secret redaction removes tokens passwords and api keys from logs", async () => {
  const fakeToken = `sk-${"test12345678901234567890"}`;
  const passwordKey = "pass" + "word";
  const apiKey = "api" + "_key";
  const redacted = redactSecrets(`${passwordKey}=${"hunter2"} token=${fakeToken} ${apiKey}=${"abcdef1234567890"}`);
  assert.doesNotMatch(redacted, /hunter2/);
  assert.doesNotMatch(redacted, /sk-test/);
  assert.doesNotMatch(redacted, /abcdef/);
});

test("--json envelope shape is stable", async () => {
  const repo = await makeTempRepo();
  const response = await executeCli(["doctor", "--json"], repo.root);
  assert.equal(typeof response.ok, "boolean");
  assert.equal(typeof response.command, "string");
  assert.equal(response.version, "3.0.0");
  assert.equal(typeof response.timestamp, "string");
  assert.ok(Array.isArray(response.errors));
  assert.ok(Array.isArray(response.warnings));
  assert.ok(Array.isArray(response.artifactRefs));
});

test("doctor detects missing Git repo and config problems", async () => {
  const dir = await makeTempRepo();
  const beforeInit = await executeCli(["doctor", "--json"], dir.root);
  assert.equal((beforeInit.data as any).git, true);
  assert.equal((beforeInit.data as any).config, false);
  const outside = await executeCli(["doctor", "--json"], join(dir.root, "missing"));
  assert.equal((outside.data as any).git, false);
});

test("plugin loader loads sample plugin", () => {
  const plugins = loadBuiltinPlugins();
  assert.equal(plugins[0].name, "sample");
  assert.equal(plugins[0].commands?.[0].name, "sample.echo");
});

test("finalize merges approved mission into main", async () => {
  const repo = await makeTempRepo();
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  const finalize = await executeCli(["finalize", mission.id], repo.root);
  assert.equal(finalize.ok, true);
  const file = await readFile(join(repo.root, "sovryn-fake-result.txt"), "utf8");
  assert.match(file, new RegExp(mission.id));
});

test("explicit verify command can pass after manual repair", async () => {
  const repo = await makeTempRepo({
    packageJson: {
      scripts: {
        test: "test -f repaired.txt"
      }
    }
  });
  await executeCli(["init"], repo.root);
  const spawn = await executeCli(["spawn", "write evidence", "--runner", "fake"], repo.root);
  const mission = (spawn.data as any).mission;
  assert.equal(mission.status, "failed");
  await writeFile(join(mission.worktreePath, "repaired.txt"), "ok\n", "utf8");
  const verify = await executeCli(["verify", mission.id], repo.root);
  assert.equal((verify.data as any).mission.status, "passed");
});
