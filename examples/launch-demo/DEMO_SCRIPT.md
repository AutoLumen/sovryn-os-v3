# Launch Demo Script

Run the commands from `README.md`, then execute the three pilot scenarios:

```bash
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot run --scenario autonomous-research --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot report --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot run --scenario toolchain-policy --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot report --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot run --scenario corpus-deduplication --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot report --json
```

Expected public-review artifacts:

```text
.sovryn/launch/
  launch-check.json
  launch-package.json
  pilot-results.json
  LAUNCH_READINESS.md
  PILOT_REPORT.md

public-corpus/
  index.html
  corpus.json
  api/
```

These are Open Source Research Artifacts. They are not legal patent filings,
not patentability opinions, and not freedom-to-operate opinions.
