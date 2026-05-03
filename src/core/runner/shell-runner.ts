import { AppError } from "../../shared/errors.js";
import { redactSecrets } from "../../shared/redaction.js";
import { runCommand } from "../../adapters/shell/command.js";
import type { SovrynConfig } from "../config.js";
import type { RunnerAdapter, RunnerInput, RunnerResult } from "./types.js";

export class ShellRunner implements RunnerAdapter {
  readonly name = "shell";

  constructor(private readonly config: SovrynConfig) {}

  async run(input: RunnerInput): Promise<RunnerResult> {
    const command = this.config.runner.shellCommand ?? process.env.SOVRYN_SHELL_RUNNER_COMMAND;
    if (!command) {
      throw new AppError("SHELL_RUNNER_COMMAND_REQUIRED", "Shell runner requires runner.shellCommand or SOVRYN_SHELL_RUNNER_COMMAND.");
    }
    const result = await runCommand(command, input.worktreePath, {
      input: input.goal,
      truncateOutputChars: this.config.output.truncateOutputChars
    });
    return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr };
  }
}

export class CodexRunner implements RunnerAdapter {
  readonly name = "codex";

  constructor(private readonly config: SovrynConfig) {}

  async run(input: RunnerInput): Promise<RunnerResult> {
    const command = [this.config.runner.command, ...this.config.runner.args, shellArg(input.goal)].join(" ");
    const result = await runCommand(command, input.worktreePath, {
      truncateOutputChars: this.config.output.truncateOutputChars
    });
    return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr };
  }
}

function shellArg(value: string): string {
  return `'${redactSecrets(value).replace(/'/g, "'\\''")}'`;
}
