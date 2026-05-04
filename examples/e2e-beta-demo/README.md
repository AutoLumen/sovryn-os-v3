# Beta.9 E2E Demo

This demo shows the deterministic Beta.9 end-to-end validation harness.

```bash
npm install
npm run build
node dist/cli.js e2e doctor --json
node dist/cli.js e2e run --profile beta-fixture --release-candidates 3 --json
node dist/cli.js e2e report --json
```

The harness creates a fresh temporary Git repository and runs Sovryn through the
public CLI. It uses fixture-backed public-source evidence, so it does not
require public network access and is stable enough for CI. In Beta.9 it validates
three pilot release candidates through quality, security, reliability, corpus,
publication dry-run, and human-review-checklist evidence.

The demo does not perform real GitHub publication and does not expose GitHub
credentials. It prepares local Open Source Research Artifacts for human review.
