# Security

Sovryn OS defaults to local isolation and evidence hygiene.

Rules:

- Worktrees are enabled by default.
- Password SSH is not implemented. The SSH runner uses `BatchMode=yes`,
  disables password and keyboard-interactive authentication, and expects SSH
  agent or identity-file based auth.
- Secrets in CLI args are forbidden by policy and redaction checks.
- Mission prompts, logs, stdout, stderr, and artifacts are redacted before
  persistence.
- Finalize scans diff and mission artifacts for common token, password, API key,
  private key, and bearer token patterns.
- Blocked paths cannot be finalized.
- Sensitive paths raise risk and require approval.
- Dependency and CI changes require approval.
- Runner and verify commands block common network commands when
  `policy.allowNetwork` is false.

Allowed future remote authentication patterns:

- SSH agent
- Identity file
- Environment secret with redaction
- Vault or `secret-command` hook

The v3 core includes an SSH runner for controlled remote execution. It is blocked
unless `policy.allowNetwork` is true and it never accepts password arguments.
