# Architecture

Sovryn OS v3 is a local evidence kernel, not an agent framework.

Core responsibilities:

- Mission kernel: create missions, run attempts, track state.
- Workspace manager: create and remove Git worktrees.
- Runner adapters: execute fake, shell, or Codex runners behind one interface.
- Verifier: discover and run commands by exit code.
- Policy engine: classify risk and block unsafe finalization.
- Review engine: summarize diff, verify, risk, and evidence.
- Storage: persist mission state and artifacts to `.sovryn/`.
- Plugin API: expose extension points without importing domain-specific code.

The core never imports OQP, GitNexus, remote execution, deploy, lab, or research
logic. Those workflows must be plugins.

Finalize is the only command that mutates the base working tree. It commits the
mission worktree branch and fast-forwards the configured base branch after
verification, policy, secret scan, and approval gates pass.
