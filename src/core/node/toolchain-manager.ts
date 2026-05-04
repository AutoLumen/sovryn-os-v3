import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { runCommand } from "../../adapters/shell/command.js";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { redactSecrets } from "../../shared/redaction.js";
import { nowIso } from "../../shared/time.js";
import { configExists } from "../config.js";
import { FactoryService } from "../factory/factory-service.js";
import { hashEvidence } from "../invention/pipeline.js";
import { workerDoctor } from "../worker/worker-doctor.js";
import type {
  NodeAlphaTool,
  ToolStatus,
  ToolchainDoctor,
  ToolchainInstallLog,
  ToolchainLock,
  ToolchainPlan,
  ToolchainPolicyReview,
  ToolchainProfile,
} from "./toolchain-types.js";

const ALLOWED_TOOL_NAMES = new Set([
  "jq",
  "ripgrep",
  "git",
  "node",
  "npm",
  "python3",
  "pipx",
  "graphviz",
  "pandoc",
  "pdftotext",
  "docker",
  "podman",
  "ts-node",
]);

const TOOL_CATALOG: NodeAlphaTool[] = [
  tool(
    "node",
    "node",
    "nodejs",
    "Run generated JavaScript prototypes.",
    true,
    "node --version",
  ),
  tool(
    "npm",
    "npm",
    "npm",
    "Run prototype tests and package scripts.",
    true,
    "npm --version",
  ),
  tool(
    "git",
    "git",
    "git",
    "Inspect public repositories and version evidence.",
    true,
    "git --version",
  ),
  tool(
    "ripgrep",
    "rg",
    "ripgrep",
    "Search local research workspaces.",
    true,
    "rg --version",
  ),
  tool(
    "jq",
    "jq",
    "jq",
    "Inspect and transform JSON evidence.",
    true,
    "jq --version",
  ),
  tool(
    "python3",
    "python3",
    "python3",
    "Run bounded research parsing helpers.",
    false,
    "python3 --version",
  ),
  tool(
    "pipx",
    "pipx",
    "pipx",
    "Install isolated Python CLI tools inside approved workers.",
    false,
    "pipx --version",
  ),
  tool(
    "graphviz",
    "dot",
    "graphviz",
    "Render diagrams for research artifacts.",
    false,
    "dot -V",
  ),
  tool(
    "pandoc",
    "pandoc",
    "pandoc",
    "Convert bounded research documents.",
    false,
    "pandoc --version",
  ),
  tool(
    "pdftotext",
    "pdftotext",
    "poppler-utils",
    "Extract bounded text from PDFs in later reader phases.",
    false,
    "pdftotext -v",
  ),
  tool(
    "docker",
    "docker",
    "docker",
    "Run container-local worker profiles.",
    false,
    "docker --version",
  ),
  tool(
    "podman",
    "podman",
    "podman",
    "Run container-local worker profiles without Docker.",
    false,
    "podman --version",
  ),
  tool(
    "ts-node",
    "ts-node",
    "ts-node",
    "Run TypeScript prototypes when explicitly scaffolded.",
    false,
    "ts-node --version",
  ),
];

export class NodeAlphaToolchainManager {
  constructor(private readonly root: string) {}

  async plan(factoryId: string): Promise<{
    plan: ToolchainPlan;
    policyReview: ToolchainPolicyReview;
    artifactRefs: string[];
  }> {
    await this.ensureInitialized();
    const factory = await new FactoryService(this.root).status(factoryId);
    const tools = await this.checkTools(TOOL_CATALOG);
    const planId = createToolchainPlanId(factory.run.id);
    const requiredTools = tools.filter((item) => item.required);
    const optionalTools = tools.filter((item) => !item.required);
    const missing = tools.filter((item) => item.status === "missing");
    const plan = withHash<ToolchainPlan>({
      kind: "node_alpha_toolchain_plan",
      toolchainPlanId: planId,
      factoryId: factory.run.id,
      createdAt: nowIso(),
      profile: "container-local",
      requiredTools,
      optionalTools,
      installCommands: missing.map(
        (item) =>
          `container-local provision ${item.packageName} # host install blocked`,
      ),
      blockedCommands: [
        "sudo apt install",
        "brew install",
        "curl | sh",
        "npm install -g on host",
        "pip install --user on host",
      ],
      limitations: [
        "Toolchain planning does not install software on the host.",
        "Missing tools require an approved worker profile or manual operator action.",
        "container-local is a constrained execution profile, not a kernel-level sandbox.",
      ],
      evidenceHash: "",
    });
    const policyReview = this.reviewPolicy(plan);
    await this.writePlan(plan, policyReview);
    return {
      plan,
      policyReview,
      artifactRefs: [
        this.toolchainRef("toolchain-plan.json"),
        this.toolchainRef("toolchain-policy-review.json"),
      ],
    };
  }

  async doctor(): Promise<{
    doctor: ToolchainDoctor;
    artifactRefs: string[];
  }> {
    await this.ensureInitialized();
    const tools = await this.checkTools(TOOL_CATALOG);
    const container = await workerDoctor(this.root, "container-local");
    const doctor = withHash<ToolchainDoctor>({
      kind: "node_alpha_toolchain_doctor",
      checkedAt: nowIso(),
      tools,
      containerRuntime: container.runtime,
      containerRuntimeAvailable: container.available,
      healthy:
        tools
          .filter((item) => item.required)
          .every((item) => item.status === "installed") && container.available,
      limitations: [
        ...tools
          .filter((item) => item.required && item.status !== "installed")
          .map((item) => `Required tool missing: ${item.name}`),
        ...container.limitations,
        "Doctor checks availability only; it does not install host software.",
      ],
      evidenceHash: "",
    });
    await writeJson(this.toolchainPath("toolchain-doctor.json"), doctor);
    return {
      doctor,
      artifactRefs: [this.toolchainRef("toolchain-doctor.json")],
    };
  }

  async install(
    planId: string,
    options: { profile?: ToolchainProfile } = {},
  ): Promise<{
    installLog: ToolchainInstallLog;
    lock: ToolchainLock;
    artifactRefs: string[];
  }> {
    await this.ensureInitialized();
    const profile = options.profile ?? "container-local";
    if (profile !== "container-local") {
      throw new AppError(
        "TOOLCHAIN_PROFILE_UNSUPPORTED",
        "Toolchain install only supports --profile container-local.",
        { profile },
      );
    }
    const plan = await this.readPlan(planId);
    const policyReview = this.reviewPolicy(plan);
    await writeJson(
      this.toolchainPath("toolchain-policy-review.json"),
      policyReview,
    );
    const startedAt = nowIso();
    const container = await workerDoctor(this.root, "container-local");
    const commandLog = [];
    const missingTools = [...plan.requiredTools, ...plan.optionalTools].filter(
      (item) => item.status === "missing",
    );
    const installedTools = [...plan.requiredTools, ...plan.optionalTools]
      .filter((item) => item.status === "installed")
      .map((item) => item.name);
    const blockedTools =
      policyReview.allowed && container.available
        ? missingTools.map((item) => item.name)
        : missingTools.map((item) => item.name);
    if (container.available && container.runtime) {
      const command = `${container.runtime} --version`;
      const result = await runCommand(command, this.root, {
        allowNetwork: false,
      }).catch((error: unknown) => ({
        command,
        cwd: this.root,
        exitCode: 1,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        durationMs: 0,
      }));
      commandLog.push({
        command: redactSecrets(result.command),
        cwd: ".",
        exitCode: result.exitCode,
        stdout: redactSecrets(result.stdout).slice(0, 2000),
        stderr: redactSecrets(result.stderr).slice(0, 2000),
      });
    }
    const completedAt = nowIso();
    const installLog = withHash<ToolchainInstallLog>({
      kind: "node_alpha_toolchain_install_log",
      toolchainPlanId: plan.toolchainPlanId,
      profile,
      startedAt,
      completedAt,
      installedTools,
      blockedTools,
      skippedTools: [],
      commandLog,
      summary:
        blockedTools.length > 0
          ? "Missing tools were not installed on the host. Approved worker provisioning or manual operator action is required."
          : "All planned tools were already available; no host installation was attempted.",
      evidenceHash: "",
    });
    const lock = withHash<ToolchainLock>({
      kind: "node_alpha_toolchain_lock",
      toolchainPlanId: plan.toolchainPlanId,
      lockedAt: completedAt,
      profile,
      tools: [...plan.requiredTools, ...plan.optionalTools].map((item) => ({
        name: item.name,
        status: item.status,
        version: item.version,
        packageName: item.packageName,
      })),
      evidenceHash: "",
    });
    await writeJson(
      this.toolchainPath("install-log.redacted.json"),
      installLog,
    );
    await writeJson(this.toolchainPath("toolchain-lock.json"), lock);
    await writeJson(this.toolchainPath("installed-tools.json"), {
      kind: "node_alpha_installed_tools",
      installedTools,
      blockedTools,
      updatedAt: completedAt,
      evidenceHash: hashEvidence({
        installedTools,
        blockedTools,
        updatedAt: completedAt,
      }),
    });
    return {
      installLog,
      lock,
      artifactRefs: [
        this.toolchainRef("install-log.redacted.json"),
        this.toolchainRef("toolchain-lock.json"),
        this.toolchainRef("installed-tools.json"),
      ],
    };
  }

  async status(): Promise<{
    plan: ToolchainPlan | null;
    doctor: ToolchainDoctor | null;
    lock: ToolchainLock | null;
    installedTools: Record<string, unknown> | null;
    artifactRefs: string[];
  }> {
    await this.ensureInitialized();
    return {
      plan: await readJson<ToolchainPlan>(
        this.toolchainPath("toolchain-plan.json"),
      ).catch(() => null),
      doctor: await readJson<ToolchainDoctor>(
        this.toolchainPath("toolchain-doctor.json"),
      ).catch(() => null),
      lock: await readJson<ToolchainLock>(
        this.toolchainPath("toolchain-lock.json"),
      ).catch(() => null),
      installedTools: await readJson<Record<string, unknown>>(
        this.toolchainPath("installed-tools.json"),
      ).catch(() => null),
      artifactRefs: [
        this.toolchainRef("toolchain-plan.json"),
        this.toolchainRef("toolchain-doctor.json"),
        this.toolchainRef("toolchain-lock.json"),
        this.toolchainRef("installed-tools.json"),
      ],
    };
  }

  private reviewPolicy(plan: ToolchainPlan): ToolchainPolicyReview {
    const allTools = [...plan.requiredTools, ...plan.optionalTools];
    const blockedTools = allTools
      .filter((item) => !ALLOWED_TOOL_NAMES.has(item.name))
      .map((item) => item.name);
    const missing = allTools.filter((item) => item.status === "missing");
    return withHash<ToolchainPolicyReview>({
      kind: "node_alpha_toolchain_policy_review",
      toolchainPlanId: plan.toolchainPlanId,
      reviewedAt: nowIso(),
      profile: plan.profile,
      allowedTools: allTools
        .filter((item) => ALLOWED_TOOL_NAMES.has(item.name))
        .map((item) => item.name),
      blockedTools,
      blockedReasons: [
        ...(blockedTools.length > 0
          ? ["Plan contains tools outside the Node Alpha allowlist."]
          : []),
        ...(missing.length > 0
          ? [
              "Missing tools may not be installed on the host by autonomous Node Alpha.",
            ]
          : []),
        "sudo, host package managers, shell-piped installers, and global host installs are blocked.",
      ],
      hostInstallAllowed: false,
      sudoAllowed: false,
      networkInstallAllowed: false,
      allowed: blockedTools.length === 0,
      evidenceHash: "",
    });
  }

  private async checkTools(tools: NodeAlphaTool[]): Promise<ToolStatus[]> {
    const checkedAt = nowIso();
    return Promise.all(
      tools.map(async (item): Promise<ToolStatus> => {
        const result = await runCommand(item.versionCommand, this.root, {
          allowNetwork: false,
          truncateOutputChars: 2000,
        }).catch(() => null);
        const installed = result !== null && result.exitCode === 0;
        return {
          ...item,
          status: installed ? "installed" : "missing",
          version: installed
            ? firstLine(`${result.stdout}\n${result.stderr}`)
            : null,
          checkedAt,
          reason: installed
            ? "Tool is available on the current worker host."
            : "Tool is missing or not executable on the current worker host.",
        };
      }),
    );
  }

  private async readPlan(planId: string): Promise<ToolchainPlan> {
    const plan = await readJson<ToolchainPlan>(
      this.toolchainPath("toolchain-plan.json"),
    );
    if (plan.toolchainPlanId !== planId) {
      throw new AppError(
        "TOOLCHAIN_PLAN_NOT_FOUND",
        `Toolchain plan not found: ${planId}`,
        { planId },
      );
    }
    return plan;
  }

  private async writePlan(
    plan: ToolchainPlan,
    review: ToolchainPolicyReview,
  ): Promise<void> {
    await mkdir(this.toolchainRoot(), { recursive: true });
    await writeJson(this.toolchainPath("toolchain-plan.json"), plan);
    await writeJson(this.toolchainPath("toolchain-policy-review.json"), review);
  }

  private async ensureInitialized(): Promise<void> {
    if (!(await configExists(this.root))) {
      throw new AppError("CONFIG_MISSING", "Run sovryn init first.");
    }
  }

  private toolchainRoot(): string {
    return join(this.root, ".sovryn", "nodes", "alpha", "toolchains");
  }

  private toolchainPath(file: string): string {
    return join(this.toolchainRoot(), file);
  }

  private toolchainRef(file: string): string {
    return join(".sovryn", "nodes", "alpha", "toolchains", file);
  }
}

function tool(
  name: string,
  command: string,
  packageName: string,
  purpose: string,
  required: boolean,
  versionCommand: string,
): NodeAlphaTool {
  return {
    name,
    command,
    packageName,
    purpose,
    required,
    versionCommand,
    installPolicy: "allow_container",
  };
}

function createToolchainPlanId(factoryId: string): string {
  return `tcp_${hashEvidence({ factoryId }).slice(0, 12)}`;
}

function firstLine(value: string): string {
  return (
    value
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "available"
  );
}

function withHash<T extends { evidenceHash: string }>(value: T): T {
  value.evidenceHash = hashEvidence({ ...value, evidenceHash: "" });
  return value;
}
