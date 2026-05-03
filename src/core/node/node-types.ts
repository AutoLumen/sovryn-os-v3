export type NodeBackend = "local" | "ssh" | "agentd" | "container" | "vm";

export type NodeCapability =
  | "workspace:create"
  | "command:run"
  | "logs:stream"
  | "artifacts:collect"
  | "packages:install"
  | "repos:clone"
  | "build:test"
  | "environment:inspect"
  | "capability:request";

export type NodeRegistration = {
  id: string;
  name: string;
  host: "local" | string;
  backend: NodeBackend;
  registeredAt: string;
  updatedAt: string;
  capabilities: NodeCapability[];
};

export type NodeEnvironment = {
  platform: string;
  arch: string;
  nodeVersion: string | null;
  npmVersion: string | null;
  gitVersion: string | null;
  uname: string | null;
};

export type NodeStatus = {
  registration: NodeRegistration;
  environment: NodeEnvironment;
  workspacesPath: string;
  logsPath: string;
  artifactsPath: string;
};

export type NodeRunResult = {
  nodeId: string;
  missionId: string;
  workspacePath: string;
  logPath: string;
  artifactsPath: string;
  exitCode: number;
  startedAt: string;
  completedAt: string;
  commands: Array<{
    command: string;
    cwd: string;
    exitCode: number;
  }>;
};

export type NodeArtifactIndex = {
  nodeId: string;
  missionId: string;
  artifacts: string[];
  updatedAt: string;
};

export type NodeCapabilityRequest = {
  nodeId: string;
  missionId: string;
  capability: NodeCapability;
  reason: string;
  requestedAt: string;
  status: "requested" | "granted" | "denied";
};
