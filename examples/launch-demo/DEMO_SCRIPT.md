# Launch Demo Script

Run the commands from `README.md`, then execute the three pilot scenarios:

```bash
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot run --all --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot review --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js pilot package --json
```

Expected public-review artifacts:

```text
.sovryn/launch/
  launch-check.json
  launch-package.json
  pilot-results.json
  LAUNCH_READINESS.md
  PILOT_REPORT.md

.sovryn/pilots/
  pilot-index.json
  pilot-results.json
  pilot-quality-summary.json
  pilot-publication-summary.json
  PILOT_REPORT.md
  PILOT_REVIEW.md
  PILOT_RELEASE_CANDIDATES.md
  public/

public-corpus/
  index.html
  corpus.json
  api/
```

These are Open Source Research Artifacts. They are not legal patent filings,
not patentability opinions, and not freedom-to-operate opinions.
