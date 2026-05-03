import { runCommand } from "../../adapters/shell/command.js";
import type { SovrynConfig } from "../config.js";
import { discoverVerifyCommands } from "./discovery.js";
import type { VerifyResult } from "./types.js";

export async function runVerify(worktreePath: string, config: SovrynConfig): Promise<VerifyResult> {
  const commands = await discoverVerifyCommands(worktreePath, config);
  const results = [];
  for (const command of commands) {
    const result = await runCommand(command, worktreePath, {
      truncateOutputChars: config.output.truncateOutputChars,
      allowNetwork: config.policy.allowNetwork
    });
    results.push({
      command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
      passed: result.exitCode === 0
    });
  }
  return {
    commands,
    results,
    passed: results.every((result) => result.passed)
  };
}
