import type {
  WorkerDoctorResult,
  WorkerProfile,
} from "../factory/factory-types.js";

export type AuditSeverity = "info" | "warning" | "blocker";

export type AuditGate = {
  code: string;
  passed: boolean;
  severity: AuditSeverity;
  message: string;
  details: Record<string, unknown>;
};

export type AuditFinding = {
  kind:
    | "command_injection"
    | "unsafe_installer"
    | "host_sudo"
    | "raw_log"
    | "local_path"
    | "secret"
    | "unsafe_content"
    | "fake_sandbox_claim"
    | "fake_patent_claim"
    | "dangerous_goal"
    | "public_leak";
  severity: AuditSeverity;
  location: string;
  pattern: string;
  preview: string;
  recommendation: string;
};

export type PublicReleaseAudit = {
  kind: "public_release_audit";
  auditedAt: string;
  targetPath: string;
  fileCount: number;
  totalBytes: number;
  findings: AuditFinding[];
  checks: AuditGate[];
  passed: boolean;
  evidenceHash: string;
};

export type WorkerSecurityAudit = {
  kind: "worker_security_audit";
  auditedAt: string;
  profile: WorkerProfile;
  doctor: WorkerDoctorResult;
  checks: AuditGate[];
  findings: AuditFinding[];
  passed: boolean;
  evidenceHash: string;
};

export type SecurityAudit = {
  kind: "security_audit";
  auditedAt: string;
  publicReleaseAudits: PublicReleaseAudit[];
  workerAudit: WorkerSecurityAudit;
  findings: AuditFinding[];
  checks: AuditGate[];
  passed: boolean;
  artifactRefs: string[];
  evidenceHash: string;
};

export type GoalSafetyScan = {
  kind: "goal_safety_scan";
  scannedAt: string;
  goal: string;
  findings: AuditFinding[];
  checks: AuditGate[];
  blocked: boolean;
  evidenceHash: string;
};

export type ReleaseSafetyScan = {
  kind: "release_safety_scan";
  scannedAt: string;
  targetPath: string;
  findings: AuditFinding[];
  checks: AuditGate[];
  blocked: boolean;
  evidenceHash: string;
};

export type ReplayAllReport = {
  kind: "replay_all_report";
  replayedAt: string;
  factoryRunCount: number;
  passedCount: number;
  failedCount: number;
  totalArtifacts: number;
  replayCriticalArtifacts: number;
  degradedCount: number;
  skippedNonCritical: number;
  replayPassRate: number;
  replayCriticalPassRate: number;
  blockingReplayFailures: string[];
  nonBlockingReplayLimitations: string[];
  recommendedFixes: string[];
  results: Array<{
    factoryId: string;
    factorySlug: string;
    artifactPath: string;
    classification:
      | "replay-critical"
      | "replay-summary"
      | "volatile-observation"
      | "non-public-local"
      | "non-replayable-by-design";
    passed: boolean;
    failedGates: string[];
    staleEvidence: string[];
    blocking: boolean;
    recommendedFixes: string[];
    error: string | null;
  }>;
  releaseCandidateReview: {
    checked: boolean;
    passed: boolean;
    failedGates: string[];
    classification:
      | "replay-critical"
      | "replay-summary"
      | "volatile-observation"
      | "non-public-local"
      | "non-replayable-by-design";
    blocking: boolean;
    recommendedFixes: string[];
    error: string | null;
  };
  checks: AuditGate[];
  passed: boolean;
  evidenceHash: string;
};

export type ReliabilityAudit = {
  kind: "reliability_audit";
  auditedAt: string;
  replayAll: ReplayAllReport;
  corpus: {
    indexed: boolean;
    publicExported: boolean;
    releaseRegistryUpdated: boolean;
    publicExportFailedGates: string[];
    errors: string[];
  };
  checks: AuditGate[];
  passed: boolean;
  artifactRefs: string[];
  evidenceHash: string;
};
