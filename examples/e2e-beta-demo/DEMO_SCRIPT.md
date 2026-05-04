# Beta.9 E2E Demo Script

Run from the Sovryn OS v3 repository root after building:

```bash
node dist/cli.js e2e doctor --json
node dist/cli.js e2e run --profile beta-fixture --release-candidates 3 --json
node dist/cli.js e2e report --json
```

Optional verification around the E2E run:

```bash
npm test
npm run format:check
git diff --check
node dist/cli.js --help
```

Expected high-level result:

- the harness creates a fresh temp Git repo;
- `sovryn init` succeeds inside that repo;
- beta demo/check/package run;
- autonomy campaign evidence is generated;
- at least one Factory run is attempted;
- publication governance dry-run is prepared for three pilot candidates;
- real publication remains disabled by default;
- audits, corpus export, launch, and pilot flows are exercised;
- each pilot writes a human review checklist;
- `.sovryn/e2e/E2E_REPORT.md` states the final readiness label.

This is a validation harness, not a legal patent filing workflow.
