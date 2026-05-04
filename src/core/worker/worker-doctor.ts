import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { runCommand } from "../../adapters/shell/command.js";
import { writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { hashEvidence } from "../invention/pipeline.js";
import type {
  WorkerAssurance,
  WorkerDoctorResult,
  WorkerProfile,
} from "../factory/factory-types.js";

export type WorkerDoctorAllResult = {
  kind: "worker_doctor_all";
  checkedAt: string;
  profiles: WorkerDoctorResult[];
  artifactRefs: string[];
  evidenceHash: string;
};

export type WorkerPolicyCheckResult = {
  kind: "worker_policy_check";
  checkedAt: string;
  allowedProfiles: WorkerProfile[];
  blockedProfiles: WorkerProfile[];
  rules: string[];
  reports: {
    workerPolicy: string;
    sandboxReport: string;
    networkPolicyReport: string;
    filesystemMountReport: string;
    resourceLimitReport: string;
    supplyChainRiskReport: string;
  };
  artifactRefs: string[];
  evidenceHash: string;
};

const WORKER_PROFILES: WorkerProfile[] = [
  "sandbox-local",
  "container-local",
  "container-netoff",
  "vm-local",
  "ci-isolated",
];

export async function workerDoctor(
  root: string,
  profile: WorkerProfile,
): Promise<WorkerDoctorResult> {
  const result = await workerDoctorUnwritten(root, profile);
  const withHash = workerDoctorWithHash(result);
  await writeWorkerEvidence(root, `doctor-${profile}.json`, withHash);
  return withHash;
}

export async function workerDoctorAll(
  root: string,
): Promise<WorkerDoctorAllResult> {
  const profiles = [];
  for (const profile of WORKER_PROFILES) {
    profiles.push(await workerDoctor(root, profile));
  }
  const result = withHash({
    kind: "worker_doctor_all" as const,
    checkedAt: nowIso(),
    profiles,
    artifactRefs: [
      workerRef("worker-sandbox-report.json"),
      workerRef("network-policy-report.json"),
      workerRef("filesystem-mount-report.json"),
      workerRef("resource-limit-report.json"),
    ],
    evidenceHash: "",
  });
  await writeWorkerEvidence(root, "worker-sandbox-report.json", {
    kind: "worker_sandbox_report",
    checkedAt: result.checkedAt,
    profiles: profiles.map((item) => ({
      profile: item.profile,
      assurance: item.assurance,
      available: item.available,
      canRun: item.canRun,
      limitations: item.limitations,
    })),
    evidenceHash: hashEvidence(profiles),
  });
  await writeWorkerEvidence(root, "network-policy-report.json", {
    kind: "worker_network_policy_report",
    checkedAt: result.checkedAt,
    profiles: profiles.map((item) => ({
      profile: item.profile,
      networkPolicy: item.networkPolicy,
      warnings: item.warnings,
    })),
    evidenceHash: hashEvidence(
      profiles.map((item) => [item.profile, item.networkPolicy]),
    ),
  });
  await writeWorkerEvidence(root, "filesystem-mount-report.json", {
    kind: "worker_filesystem_mount_report",
    checkedAt: result.checkedAt,
    profiles: profiles.map((item) => ({
      profile: item.profile,
      filesystemPolicy: item.filesystemPolicy,
    })),
    evidenceHash: hashEvidence(
      profiles.map((item) => [item.profile, item.filesystemPolicy]),
    ),
  });
  await writeWorkerEvidence(root, "resource-limit-report.json", {
    kind: "worker_resource_limit_report",
    checkedAt: result.checkedAt,
    profiles: profiles.map((item) => ({
      profile: item.profile,
      resourceLimits: item.resourceLimits,
    })),
    evidenceHash: hashEvidence(
      profiles.map((item) => [item.profile, item.resourceLimits]),
    ),
  });
  await writeWorkerEvidence(root, "doctor-all.json", result);
  return result;
}

export async function workerPolicyCheck(
  root: string,
): Promise<WorkerPolicyCheckResult> {
  const doctors = await workerDoctorAll(root);
  const allowedProfiles = doctors.profiles
    .filter((profile) => profile.canRun || profile.profile === "sandbox-local")
    .map((profile) => profile.profile);
  const blockedProfiles = doctors.profiles
    .filter((profile) => !allowedProfiles.includes(profile.profile))
    .map((profile) => profile.profile);
  const checkedAt = nowIso();
  const rules = [
    "No worker profile may silently fall back to a weaker host execution path.",
    "container-netoff must request network disabled execution.",
    "Prototype validation mounts only generated prototype/workspace content.",
    "Raw stdout/stderr and secrets must be redacted before public packaging.",
    "VM and CI profiles are unavailable until explicit backends are configured.",
  ];
  const result = withHash({
    kind: "worker_policy_check" as const,
    checkedAt,
    allowedProfiles,
    blockedProfiles,
    rules,
    reports: {
      workerPolicy: workerRef("worker-policy.json"),
      sandboxReport: workerRef("worker-sandbox-report.json"),
      networkPolicyReport: workerRef("network-policy-report.json"),
      filesystemMountReport: workerRef("filesystem-mount-report.json"),
      resourceLimitReport: workerRef("resource-limit-report.json"),
      supplyChainRiskReport: workerRef("supply-chain-risk-report.json"),
    },
    artifactRefs: [
      workerRef("worker-policy.json"),
      workerRef("supply-chain-risk-report.json"),
      workerRef("worker-sandbox-report.json"),
      workerRef("network-policy-report.json"),
      workerRef("filesystem-mount-report.json"),
      workerRef("resource-limit-report.json"),
    ],
    evidenceHash: "",
  });
  await writeWorkerEvidence(root, "worker-policy.json", result);
  await writeWorkerEvidence(root, "supply-chain-risk-report.json", {
    kind: "worker_supply_chain_risk_report",
    checkedAt,
    risks: [
      "Container images and package installation are supply-chain inputs and require operator review.",
      "Sovryn does not mount host credentials or home directories into worker profiles by default.",
      "Tool installation remains policy-gated and should prefer dedicated worker images.",
    ],
    evidenceHash: hashEvidence({
      checkedAt,
      blockedProfiles,
      allowedProfiles,
    }),
  });
  return result;
}

async function workerDoctorUnwritten(
  root: string,
  profile: WorkerProfile,
): Promise<WorkerDoctorResult> {
  if (profile === "sandbox-local") {
    return {
      profile,
      available: true,
      runtime: null,
      version: null,
      canRun: true,
      assurance: "low",
      networkPolicy: "best_effort_off",
      filesystemPolicy: "prototype_only",
      resourceLimits: ["allowlisted commands only"],
      limitations: [
        "sandbox-local is a constrained command profile, not OS isolation.",
        "It must only run inside generated prototype directories.",
      ],
      recommendedCommand: "npm test",
      warnings: [
        "Use container-netoff or a VM profile for stronger isolation.",
      ],
    };
  }
  if (profile === "vm-local" || profile === "ci-isolated") {
    return unavailableProfile(profile, "Profile backend is not configured.");
  }
  const docker = await runtimeVersion(root, "docker");
  const podman = await runtimeVersion(root, "podman");
  const runtime = docker
    ? { name: "docker" as const, version: docker }
    : podman
      ? { name: "podman" as const, version: podman }
      : null;
  if (!runtime) {
    return unavailableProfile(
      profile,
      "No Docker or Podman runtime was found on PATH.",
    );
  }
  return doctorResult(profile, runtime.name, runtime.version);
}

async function runtimeVersion(
  root: string,
  runtime: "docker" | "podman",
): Promise<string | null> {
  const result = await runCommand(`${runtime} --version`, root, {
    allowNetwork: false,
  }).catch(() => null);
  if (!result || result.exitCode !== 0) return null;
  return result.stdout.trim().split("\n")[0] ?? null;
}

function unavailableProfile(
  profile: WorkerProfile,
  reason: string,
): WorkerDoctorResult {
  const assurance: WorkerAssurance =
    profile === "vm-local" || profile === "ci-isolated" ? "high" : "medium";
  return {
    profile,
    available: false,
    runtime: null,
    version: null,
    canRun: false,
    assurance,
    networkPolicy: "unavailable",
    filesystemPolicy: "unavailable",
    resourceLimits: [],
    limitations: [
      reason,
      `${profile} did not run and must not silently fall back to host execution.`,
      "Use sandbox-local only as a lower-assurance constrained profile.",
    ],
    recommendedCommand: null,
    warnings: [
      `${profile} is unavailable in this environment; no execution occurred.`,
    ],
  };
}

function doctorResult(
  profile: "container-local" | "container-netoff",
  runtime: "docker" | "podman",
  version: string,
): WorkerDoctorResult {
  const netoff = profile === "container-netoff";
  return {
    profile,
    available: true,
    runtime,
    version,
    canRun: true,
    assurance: netoff ? "medium-high" : "medium",
    networkPolicy: "off",
    filesystemPolicy: "prototype_only",
    resourceLimits: ["--cpus 1", "--memory 512m"],
    limitations: [
      `${profile} mounts only the generated prototype workspace for validation.`,
      "Network is disabled with --network none.",
      netoff
        ? "container-netoff is stricter than container-local but still not a VM boundary."
        : "container-local is stronger than sandbox-local but not a hardened VM policy.",
    ],
    recommendedCommand: `${runtime} create --network none --cpus 1 --memory 512m -w /work node:22-alpine npm test`,
    warnings: [
      "Container runtime availability does not prove kernel-level isolation is sufficient for hostile code.",
    ],
  };
}

function workerDoctorWithHash(result: WorkerDoctorResult): WorkerDoctorResult {
  return { ...result, evidenceHash: hashEvidence(result) };
}

function withHash<T extends { evidenceHash: string }>(value: T): T {
  value.evidenceHash = hashEvidence({ ...value, evidenceHash: "" });
  return value;
}

async function writeWorkerEvidence(
  root: string,
  file: string,
  value: unknown,
): Promise<void> {
  await mkdir(join(root, ".sovryn", "workers"), { recursive: true });
  await writeJson(join(root, ".sovryn", "workers", file), value);
}

function workerRef(file: string): string {
  return join(".sovryn", "workers", file);
}
