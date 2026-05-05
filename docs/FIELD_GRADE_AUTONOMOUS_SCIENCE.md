# Field-Grade Autonomous Science

Sovryn OS `4.1.0-rc.1` extends Reality-Grade Autonomy into a bounded
field-grade science loop. The focus remains scientific robustness, not product
or platform features.

Field-grade runs add:

- verified external source registries with hashes, access notes, replay
  instructions, and broken-source records
- verified dataset registries with schema probes, provenance hashes, safe
  subset policy, cache policy, and limitations
- real/public-safe dataset-backed benchmark tasks with baselines, candidates,
  ablations, sensitivity checks, replication seeds, failures, and degraded
  fallback labels
- long-horizon campaign scheduling with checkpoints, resume support, budget
  policy, failure classification, degraded-mode recording, and phase reports
- toolchain builder v2 with build-vs-buy decisions, denied install patterns,
  no host sudo, no curl-pipe-shell, no silent fallback, smoke tests, negative
  tests, and benchmark integration
- external benchmark-style challenge mode with baselines, metrics, error
  analysis, losses, failures, and no fake leaderboard claims
- field-grade trial publication as `field_grade_autonomous_science_trial`

The public package is curated. It does not redistribute raw fulltexts, raw
logs, private data, secrets, local absolute paths, or unsafe-domain content.
Field-grade results remain evidence-bound and limitation-bound.

Useful commands:

```bash
sovryn sources verify --json
sovryn sources registry build --json
sovryn datasets discover "safe public data quality benchmark" --json
sovryn datasets verify --json
sovryn benchmark real-data suite build --json
sovryn benchmark real-data run --domains 5 --json
sovryn campaign plan "field-grade benchmark expansion for provenance-aware data-quality methods" --json
sovryn campaign run latest --max-cycles 20 --json
sovryn toolchain infer --from-campaign latest --json
sovryn toolchain provision --profile container-netoff --json
sovryn toolchain validate --json
sovryn challenge discover --json
sovryn challenge run --top 3 --json
sovryn field-grade trial run --autopublish-corpus --json
```
