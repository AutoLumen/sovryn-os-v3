# Field-Grade Demo

This demo uses the deterministic fixture path for Field-Grade Autonomous
Science.

```bash
sovryn sources verify --json
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
sovryn field-grade trial run --json
```

The generated artifacts live under `.sovryn/`. Public packages are curated and
must not include raw logs, secrets, local absolute paths, private data, or raw
fulltexts.
