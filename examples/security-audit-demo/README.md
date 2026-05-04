# Security Audit Demo

This demo shows the Alpha.25 audit flow.

```bash
npm install
npm run build
node dist/cli.js init --json
node dist/cli.js release candidates build --max 1 --json
node dist/cli.js security audit --json
node dist/cli.js reliability audit --json
node dist/cli.js safety scan-goal "Improve autonomous open-source research agents" --json
node dist/cli.js safety scan-release .sovryn/factory/<slug>/release/public --json
```

Expected audit artifacts:

```text
.sovryn/audits/
  security-audit.json
  SECURITY_AUDIT.md
  reliability-audit.json
  RELIABILITY_AUDIT.md
  replay-all-report.json
  REPLAY_ALL_REPORT.md
  abuse-risk-report.json
  ABUSE_RISK_REPORT.md
```

The audits should pass for curated Factory public releases and fail if raw
stdout/stderr fields, command journals, local absolute paths, secret-like
strings, unsafe installer commands, fake sandbox guarantees, or fake
patentability claims are introduced.
