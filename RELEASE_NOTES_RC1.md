# Sovryn OS v3.0.0-rc.1 Release Notes

Sovryn OS v3.0.0-rc.1 is a release-candidate build for the autonomous
open-research and Open-Invention factory.

## What Changed

- Adds v1-RC scorecard, blocker, launch-decision, falsification-summary, and
  public-corpus-summary artifacts under `.sovryn/v1-rc/`.
- Tightens `sovryn launch v1-rc-check --json` around public beta readiness,
  corpus site audit, falsification status, retained corpus results, showcase
  results, worker no-silent-fallback evidence, and host-sudo avoidance.
- Adds `--real-sources-preferred` to the overnight external trial command so RC
  runs can record that real public evidence should be preferred while fixture
  fallback remains explicit.
- Keeps publication scoped to the existing `sovryn-open-inventions` corpus repo.

## Non-Goals

This release candidate does not enable uncontrolled publication, standalone repo
creation, legal patent filing, patentability opinions, legal novelty opinions,
or freedom-to-operate conclusions.

## Required RC Checks

Run:

```bash
npm test
npm run format:check
git diff --check
node dist/cli.js e2e run --profile beta-fixture --external-domains 3 --json
node dist/cli.js overnight run --goal "Generate safe external open inventions" --max-runs 5 --autopublish-corpus --real-sources-preferred --json
node dist/cli.js evaluate falsify-all --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
node dist/cli.js corpus site audit --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
node dist/cli.js public-beta check --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
node dist/cli.js launch v1-rc-check --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
```

The final launch decision is written to `.sovryn/v1-rc/LAUNCH_DECISION.md`.
