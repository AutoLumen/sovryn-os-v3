# Security

Sovryn OS defaults to local isolation and evidence hygiene.

Rules:

- Worktrees are enabled by default.
- Password SSH is not implemented.
- Secrets in CLI args are forbidden by policy and redaction checks.
- Mission prompts, logs, stdout, stderr, and artifacts are redacted before
  persistence.
- Finalize scans diff and mission artifacts for common token, password, API key,
  private key, and bearer token patterns.
- Blocked paths cannot be finalized.
- Sensitive paths raise risk and require approval.
- Dependency and CI changes require approval.

Allowed future remote authentication patterns:

- SSH agent
- Identity file
- Environment secret with redaction
- Vault or `secret-command` hook

The v3 core does not ship remote execution.
