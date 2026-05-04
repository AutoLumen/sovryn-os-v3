export type ToolchainProfile = "container-local";

export type ToolInstallStatus =
  | "installed"
  | "missing"
  | "blocked"
  | "unavailable"
  | "planned";

export type ToolInstallPolicy = "allow_container" | "host_blocked" | "blocked";

export type NodeAlphaTool = {
  name: string;
  command: string;
  packageName: string;
  purpose: string;
  required: boolean;
  versionCommand: string;
  installPolicy: ToolInstallPolicy;
};

export type ToolStatus = NodeAlphaTool & {
  status: ToolInstallStatus;
  version: string | null;
  checkedAt: string;
  reason: string;
};

export type ToolchainPlan = {
  kind: "node_alpha_toolchain_plan";
  toolchainPlanId: string;
  factoryId: string;
  createdAt: string;
  profile: ToolchainProfile;
  requiredTools: ToolStatus[];
  optionalTools: ToolStatus[];
  installCommands: string[];
  blockedCommands: string[];
  limitations: string[];
  evidenceHash: string;
};

export type ToolchainPolicyReview = {
  kind: "node_alpha_toolchain_policy_review";
  toolchainPlanId: string;
  reviewedAt: string;
  profile: ToolchainProfile;
  allowedTools: string[];
  blockedTools: string[];
  blockedReasons: string[];
  hostInstallAllowed: false;
  sudoAllowed: false;
  networkInstallAllowed: false;
  allowed: boolean;
  evidenceHash: string;
};

export type ToolchainDoctor = {
  kind: "node_alpha_toolchain_doctor";
  checkedAt: string;
  tools: ToolStatus[];
  containerRuntime: "docker" | "podman" | null;
  containerRuntimeAvailable: boolean;
  healthy: boolean;
  limitations: string[];
  evidenceHash: string;
};

export type ToolchainInstallLog = {
  kind: "node_alpha_toolchain_install_log";
  toolchainPlanId: string;
  profile: ToolchainProfile;
  startedAt: string;
  completedAt: string;
  installedTools: string[];
  blockedTools: string[];
  skippedTools: string[];
  commandLog: Array<{
    command: string;
    cwd: string;
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;
  summary: string;
  evidenceHash: string;
};

export type ToolchainLock = {
  kind: "node_alpha_toolchain_lock";
  toolchainPlanId: string;
  lockedAt: string;
  profile: ToolchainProfile;
  tools: Array<{
    name: string;
    status: ToolInstallStatus;
    version: string | null;
    packageName: string;
  }>;
  evidenceHash: string;
};
