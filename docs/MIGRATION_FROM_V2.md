# Migration From v2

Sovryn OS v3 is a rebuild, not a drop-in upgrade.

Major changes:

- Worktrees are enabled by default.
- OQP, research, remote execution, and GitNexus are not core features.
- File storage is the default required storage.
- Postgres is a future adapter, not a runtime dependency.
- Stable JSON envelopes are the command contract.
- Finalize is blocked by policy, approval, and secret-scan gates.
- Password SSH is intentionally unsupported.

Recommended migration:

1. Keep v2 repositories intact.
2. Create a fresh v3 repository.
3. Move only generic mission, verify, review, and policy concepts into core.
4. Move OQP workflows into a separate plugin package.
5. Add plugin tests with fake remote runners and fixture artifacts.
