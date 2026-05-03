import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { scanSecrets, type SecretFinding } from "../../shared/redaction.js";
import type { InventionDossier, OpenInventionMissionState } from "../invention/invention-types.js";
import { scanUnsafeContent, type SafetyFinding } from "./safety-policy.js";

export type PublicationCheck = {
  code: string;
  passed: boolean;
  message: string;
  details: Record<string, unknown>;
};

export type PublicationPolicyResult = {
  allowed: boolean;
  checks: PublicationCheck[];
  secretFindings: SecretFinding[];
  safetyFindings: SafetyFinding[];
};

const REQUIRED_FILES = [
  "README.md",
  "SPEC.md",
  "DEFENSIVE_PUBLICATION.md",
  "PRIOR_ART.md",
  "NOVELTY_NOTES.md",
  "SAFETY_REVIEW.md",
  "LICENSE",
  "CITATION.cff"
];

export async function evaluatePublicationPolicy(input: {
  inventionDir: string;
  mission: OpenInventionMissionState;
  dossier: InventionDossier;
  finalVerify: { passed: boolean; evidenceHash: string | null; summary: string; completedAt?: string | null };
  target?: { org?: string | null; repo?: string | null; dryRun?: boolean };
  requireFinalized?: boolean;
}): Promise<PublicationPolicyResult> {
  const checks: PublicationCheck[] = [];
  const missingFields = requiredDossierFields(input.dossier);
  checks.push({
    code: "DOSSIER_COMPLETE",
    passed: missingFields.length === 0,
    message: missingFields.length === 0 ? "Dossier has all required fields." : "Dossier is incomplete.",
    details: { missingFields }
  });

  const missingFiles = [];
  for (const file of REQUIRED_FILES) {
    if (!(await exists(join(input.inventionDir, file)))) missingFiles.push(file);
  }
  checks.push({
    code: "REQUIRED_FILES",
    passed: missingFiles.length === 0,
    message: missingFiles.length === 0 ? "All required publication files exist." : "Required files are missing.",
    details: { missingFiles }
  });

  checks.push({
    code: "LICENSE_PRESENT",
    passed: await exists(join(input.inventionDir, "LICENSE")),
    message: "Publication requires a license file.",
    details: { license: input.dossier.license }
  });

  checks.push({
    code: "PROTOTYPE_PRESENT",
    passed: await exists(join(input.inventionDir, "prototype")),
    message: "Publication requires a prototype or demo.",
    details: { prototypePath: input.dossier.prototypePath }
  });

  checks.push({
    code: "TESTS_PRESENT",
    passed: await exists(join(input.inventionDir, input.dossier.testsPath)),
    message: "Publication requires tests or validation steps.",
    details: { testsPath: input.dossier.testsPath }
  });

  checks.push({
    code: "PRIOR_ART_PRESENT",
    passed: await nonEmpty(join(input.inventionDir, "PRIOR_ART.md")),
    message: "Publication requires prior-art notes.",
    details: {}
  });

  checks.push({
    code: "DEFENSIVE_PUBLICATION_PRESENT",
    passed: await nonEmpty(join(input.inventionDir, "DEFENSIVE_PUBLICATION.md")),
    message: "Publication requires defensive publication text.",
    details: {}
  });

  checks.push({
    code: "FINAL_VERIFY",
    passed: input.finalVerify.passed,
    message: input.finalVerify.passed ? "Final verification passed." : "Final verification failed.",
    details: { evidenceHash: input.finalVerify.evidenceHash, summary: input.finalVerify.summary }
  });

  const latestContentModifiedAt = await latestPublicationContentModifiedAt(input.inventionDir);
  const finalVerifyCompletedAt = input.finalVerify.completedAt ? Date.parse(input.finalVerify.completedAt) : NaN;
  checks.push({
    code: "FINAL_VERIFY_FRESH",
    passed: Number.isFinite(finalVerifyCompletedAt) && finalVerifyCompletedAt + 1000 >= latestContentModifiedAt,
    message: "Final verification must run after publication source files are modified.",
    details: {
      finalVerifyCompletedAt: input.finalVerify.completedAt ?? null,
      latestContentModifiedAt: Number.isFinite(latestContentModifiedAt) ? new Date(latestContentModifiedAt).toISOString() : null
    }
  });

  if (input.requireFinalized) {
    checks.push({
      code: "MISSION_FINALIZED",
      passed: input.mission.status === "finalized" || input.mission.status === "published",
      message: "GitHub publication requires invention finalization.",
      details: { status: input.mission.status }
    });
  }

  const targetMissing = !input.target?.dryRun && (!input.target?.org || !input.target?.repo);
  checks.push({
    code: "GITHUB_TARGET",
    passed: !targetMissing,
    message: targetMissing ? "GitHub target is missing." : "GitHub target is available or dry-run mode is active.",
    details: { org: input.target?.org ?? null, repo: input.target?.repo ?? null, dryRun: input.target?.dryRun ?? false }
  });

  const blockedPaths = await listBlockedPublicationPaths(input.inventionDir);
  checks.push({
    code: "BLOCKED_PUBLICATION_PATHS",
    passed: blockedPaths.length === 0,
    message: blockedPaths.length === 0 ? "No blocked publication paths found." : "Blocked publication paths found.",
    details: { blockedPaths }
  });

  const secretFindings = await scanDirectoryForSecrets(input.inventionDir);
  checks.push({
    code: "SECRET_SCAN",
    passed: secretFindings.length === 0,
    message: secretFindings.length === 0 ? "No secret patterns found." : "Secret-like patterns found.",
    details: { findings: secretFindings }
  });

  const safetyFindings = await scanUnsafeContent(input.inventionDir);
  checks.push({
    code: "SAFETY_SCAN",
    passed: safetyFindings.length === 0,
    message: safetyFindings.length === 0 ? "No disallowed content patterns found." : "Disallowed content patterns found.",
    details: { findings: safetyFindings }
  });

  return {
    allowed: checks.every((check) => check.passed),
    checks,
    secretFindings,
    safetyFindings
  };
}

export async function scanDirectoryForSecrets(root: string): Promise<SecretFinding[]> {
  const findings: SecretFinding[] = [];
  for (const file of await listFiles(root)) {
    const content = await readTextIfSafe(file);
    if (content === null) continue;
    findings.push(...scanSecrets(relative(root, file), content));
  }
  return findings;
}

function requiredDossierFields(dossier: InventionDossier): string[] {
  const required: Array<keyof InventionDossier> = [
    "id",
    "slug",
    "title",
    "abstract",
    "technicalField",
    "problem",
    "background",
    "proposedSolution",
    "architecture",
    "algorithm",
    "implementationNotes",
    "prototypePath",
    "testsPath",
    "license"
  ];
  return required.filter((field) => {
    const value = dossier[field];
    return typeof value === "string" && value.trim().length === 0;
  });
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function nonEmpty(path: string): Promise<boolean> {
  try {
    return (await readFile(path, "utf8")).trim().length > 0;
  } catch {
    return false;
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === ".git" || entry === "node_modules") continue;
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) out.push(...(await listFiles(path)));
    else if (info.isFile()) out.push(path);
  }
  return out;
}

async function listBlockedPublicationPaths(root: string): Promise<string[]> {
  const files = await listFiles(root);
  return files
    .map((file) => relative(root, file))
    .filter((path) =>
      path === ".env" ||
      path.startsWith(".env.") ||
      path.includes("/.env") ||
      path.includes(".pem") ||
      path.includes(".p12") ||
      path.startsWith(".git/") ||
      path.includes("/.git/")
    )
    .sort();
}

async function latestPublicationContentModifiedAt(root: string): Promise<number> {
  const entries = [
    "README.md",
    "SPEC.md",
    "DEFENSIVE_PUBLICATION.md",
    "PRIOR_ART.md",
    "NOVELTY_NOTES.md",
    "SAFETY_REVIEW.md",
    "CITATION.cff",
    "LICENSE",
    "prototype",
    "tests",
    "diagrams"
  ];
  let latest = 0;
  for (const entry of entries) {
    latest = Math.max(latest, await latestMtime(join(root, entry)));
  }
  return latest;
}

async function latestMtime(path: string): Promise<number> {
  let info;
  try {
    info = await stat(path);
  } catch {
    return 0;
  }
  if (info.isDirectory()) {
    let latest = info.mtimeMs;
    for (const entry of await readdir(path)) latest = Math.max(latest, await latestMtime(join(path, entry)));
    return latest;
  }
  return info.mtimeMs;
}

async function readTextIfSafe(path: string): Promise<string | null> {
  const info = await stat(path);
  if (info.size > 1024 * 1024) return null;
  const buffer = await readFile(path);
  if (buffer.includes(0)) return null;
  return buffer.toString("utf8");
}
