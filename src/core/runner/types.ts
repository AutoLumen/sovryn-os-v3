export type RunnerInput = {
  missionId: string;
  goal: string;
  worktreePath: string;
  attempt: number;
};

export type RunnerResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export interface RunnerAdapter {
  name: string;
  run(input: RunnerInput): Promise<RunnerResult>;
}
