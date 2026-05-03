# Sovryn OS v3

Sovryn OS is a local-first evidence kernel for AI-assisted coding and research.
It runs agents in isolated Git worktrees, verifies their work through exit codes,
records artifacts, enforces policy, and requires review before finalization.

Sovryn OS is not an agent framework. It does not judge with an LLM. It does not
run a daemon. It does not mutate the main tree by default. It does not trust
agent output.

> Agents act. Sovryn verifies. Git isolates. Policy gates. Evidence persists.
> Humans approve.

## Install

```bash
npm install
npm run build
npm test
```

For development:

```bash
node dist/src/cli/index.js --help
```

## Commands

```bash
sovryn init
sovryn spawn "goal" --runner fake --json
sovryn continue <mission-id> --json
sovryn status --json
sovryn log <mission-id> --json
sovryn diff <mission-id> --json
sovryn verify <mission-id> --json
sovryn review <mission-id> --json
sovryn approve <mission-id> --json
sovryn finalize <mission-id> --json
sovryn reject <mission-id> --json
sovryn doctor --json
```

Every command supports stable JSON output via `--json`.

## What Sovryn Does

- Creates mission records under `.sovryn/missions/<mission-id>/`.
- Creates isolated Git worktrees under `.sovryn/worktrees/<mission-id>/`.
- Runs runner attempts inside the worktree.
- Discovers and runs verification commands by exit code.
- Records redacted stdout, stderr, verify output, and review artifacts.
- Computes changed files, diff stats, policy risk, and approval requirements.
- Blocks finalize when verification, policy, approval, blocked-path, or secret
  checks fail.

## What Sovryn Does Not Do

- It does not decide truth with an LLM.
- It does not ship OQP, GitNexus, remote SSH, Postgres, or research workflows in
  the core.
- It does not implement password SSH.
- It does not store unredacted secrets in prompts, logs, mission files, or
  artifacts.

## Default Storage

File storage is the default and only required storage driver in v3 core.
Postgres and dual-store migration modes belong behind adapters after the file
store remains stable.

## Plugins

The plugin API is intentionally small. Plugins can register commands, verify
providers, artifact parsers, and review enrichers. Domain logic such as OQP,
GitNexus, remote execution, deploy, and lab workflows belongs in plugins, not in
the core.

See `docs/PLUGIN_API.md`.

## Security

Worktrees are enabled by default. Secrets in logs and evidence are redacted.
Finalize runs a secret scan over diff, prompts, stdout, stderr, verify output,
and review artifacts before merging.

See `docs/SECURITY.md`.
