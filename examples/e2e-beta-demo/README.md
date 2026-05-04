# Beta.8 E2E Demo

This demo shows the deterministic Beta.8 end-to-end validation harness.

```bash
npm install
npm run build
node dist/cli.js e2e doctor --json
node dist/cli.js e2e run --profile beta-fixture --json
node dist/cli.js e2e report --json
```

The harness creates a fresh temporary Git repository and runs Sovryn through the
public CLI. It uses fixture-backed public-source evidence, so it does not
require public network access and is stable enough for CI.

The demo does not perform real GitHub publication and does not expose GitHub
credentials. It prepares local Open Source Research Artifacts for human review.
