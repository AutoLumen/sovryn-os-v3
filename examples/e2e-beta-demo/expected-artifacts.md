# Expected E2E Artifacts

The harness writes local evidence under:

```text
.sovryn/e2e/
  build-sanity.json
  fresh-repo-init.json
  beta-flow.json
  autonomy-flow.json
  factory-flow.json
  worker-flow.json
  quality-benchmark-flow.json
  publication-flow.json
  audit-safety-flow.json
  corpus-flow.json
  launch-pilot-flow.json
  e2e-run.json
  e2e-events.jsonl
  e2e-command-results.json
  e2e-artifacts.json
  e2e-scorecard.json
  e2e-failures.json
  replay-contract.json
  replay-diagnostics.json
  launch-limitations.json
  E2E_REPORT.md
  REPLAY_DIAGNOSTICS.md
  LAUNCH_LIMITATIONS.md
  E2E_ARTIFACT_TREE.md
  E2E_RISK_REGISTER.md
```

The fresh temp repository created by the harness also contains the normal Sovryn
Beta evidence directories such as `.sovryn/beta/`, `.sovryn/autonomy/`,
`.sovryn/factory/`, `.sovryn/publication/`, `.sovryn/audits/`,
`.sovryn/corpus/`, `.sovryn/launch/`, and `public-corpus/`.

Public release and public corpus outputs must not contain raw command journals,
raw stdout/stderr, secrets, private config, full raw source content, or local
absolute paths.
