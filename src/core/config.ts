import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readJson, writeJson } from "../shared/fs.js";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SovrynConfig = {
  version: 1;
  runner: {
    default: "codex" | "fake" | "shell";
    command: string;
    args: string[];
    shellCommand?: string;
  };
  git: {
    useWorktrees: true;
    worktreeRoot: string;
    baseBranch: string;
    branchPrefix: string;
  };
  verify: {
    commands: "auto" | string[];
  };
  policy: {
    maxChangedFiles: number;
    maxChangedLines: number;
    blockedPaths: string[];
    sensitivePaths: string[];
    autoFinalizeRisk: RiskLevel;
    requireApprovalForRisk: RiskLevel[];
    allowNetwork: boolean;
  };
  storage: {
    driver: "file";
  };
  output: {
    truncateOutputChars: number;
  };
};

export const DEFAULT_CONFIG: SovrynConfig = {
  version: 1,
  runner: {
    default: "codex",
    command: "codex",
    args: ["exec"]
  },
  git: {
    useWorktrees: true,
    worktreeRoot: ".sovryn/worktrees",
    baseBranch: "main",
    branchPrefix: "sovryn/"
  },
  verify: {
    commands: "auto"
  },
  policy: {
    maxChangedFiles: 20,
    maxChangedLines: 1000,
    blockedPaths: [".git/**", ".sovryn/config.json"],
    sensitivePaths: [".env", ".env.*", "**/*secret*", "**/*key*"],
    autoFinalizeRisk: "low",
    requireApprovalForRisk: ["medium", "high", "critical"],
    allowNetwork: false
  },
  storage: {
    driver: "file"
  },
  output: {
    truncateOutputChars: 12000
  }
};

export async function configExists(root: string): Promise<boolean> {
  try {
    await access(configPath(root));
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(root: string): Promise<SovrynConfig> {
  return readJson<SovrynConfig>(configPath(root));
}

export async function initConfig(root: string): Promise<SovrynConfig> {
  await mkdir(join(root, ".sovryn"), { recursive: true });
  await writeJson(configPath(root), DEFAULT_CONFIG);
  await writeJson(join(root, ".sovryn", "policy.json"), DEFAULT_CONFIG.policy);
  await ensureGitignore(root);
  return DEFAULT_CONFIG;
}

export function configPath(root: string): string {
  return join(root, ".sovryn", "config.json");
}

async function ensureGitignore(root: string): Promise<void> {
  const path = join(root, ".gitignore");
  let existing = "";
  try {
    existing = await readText(path);
  } catch {
    // create below
  }
  const required = [".sovryn/worktrees/", ".sovryn/logs/"];
  const missing = required.filter((line) => !existing.split("\n").includes(line));
  if (missing.length > 0) {
    const prefix = existing && !existing.endsWith("\n") ? "\n" : "";
    await writeFile(path, `${existing}${prefix}${missing.join("\n")}\n`, "utf8");
  }
}

async function readText(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}
