# Self-Building Computational Lab

Sovryn OS `3.7.0-rc.1` hardens the Lab Autonomy Engine for safe computational
science. The lab layer does not add product, dashboard, marketplace, hosted, or
team features. It focuses on one job: infer the digital lab a study needs, build
or provision it safely, execute it with evidence, benchmark what was built, and
remember what worked.

The lab flow is:

1. Infer lab needs from a study or research goal.
2. Decide build-vs-buy for every required capability.
3. Provision approved packages or record explicit degradation.
4. Build custom instruments when packages are insufficient or unsafe.
5. Compose instruments and packages into experiment pipelines.
6. Run and replay pipeline stages with Node Alpha evidence.
7. Benchmark and calibrate reusable instruments.
8. Update Lab Memory and Scientific Memory.
9. Publish only curated safe results into the configured public corpus.

```bash
sovryn lab needs infer-from-goal "Compare provenance-aware energy anomaly detection against simple threshold baselines" --json
sovryn lab decide <needs-id> --json
sovryn lab provision <decision-id> --profile container-netoff --json
sovryn lab instrument build <decision-id> --json
sovryn lab pipeline compose <study-id> --json
sovryn lab instrument benchmark-all --json
sovryn lab memory graph --json
sovryn lab trial run --goal "Build and use computational labs for safe real-source studies" --studies 4 --real-sources-preferred --real-data-preferred --autopublish-corpus --json
```

## Artifacts

Lab artifacts live under `.sovryn/lab/`:

- `needs/<needs-id>/`: required measurements, operations, candidate packages,
  candidate instruments, build-vs-buy hints, and safety scope.
- `decisions/<decision-id>/`: tool evaluation matrix, selected packages,
  custom instrument plan, fallback plan, and risk rationale.
- `provisioning/<provision-id>/`: provisioning plan, policy review,
  environment manifest, package versions/hashes, redacted install evidence, and
  toolchain doctor output.
- `instruments/<instrument-id>/`: instrument design, input/output contract,
  tests, calibration cases, failure cases, Node Alpha evidence, and limitations.
- `pipelines/<pipeline-id>/`: pipeline DAG, bindings, execution plan, run,
  replay, audit, and report artifacts.
- `benchmarks/`: calibration status, failure taxonomy, reuse status, rankings,
  and public-safe benchmark reports for custom instruments.
- `memory/`: tool, package, instrument, capability, failure, and reuse ledgers.
- `reproductions/<slug>/`: safe external claim extraction, lab needs,
  build-vs-buy, reproduction pipeline, run, analysis, and limitations.
- `trials/<trial-slug>/`: end-to-end self-building lab scorecard and report.

## Safety Boundaries

The lab layer is restricted to safe computational science: public data,
synthetic data, simulations, software instruments, benchmarks, statistics, and
reproducibility. It blocks wet-lab protocols, hazardous chemistry, biological
optimization, exploit development, weapons-related research, medical treatment
advice, private-data extraction, and fake legal claims.

Provisioning defaults are conservative:

- no host sudo by default
- no curl-pipe-shell installers
- no global package install by default
- no silent fallback from isolated profiles
- package versions and hashes are recorded where available
- raw install logs are not stored in public outputs

## Public Corpus Output

When `--autopublish-corpus` is used and gates pass, eligible results are written
only to `/Users/sovryn/Desktop/sovryn-open-inventions` as
`self_built_lab_science_study`, `self_built_lab_reproduction`,
`self_built_lab_negative_result`, or `self_built_lab_inconclusive_study`
results. Public packages include curated summaries such as `LAB_NEEDS.md`,
`BUILD_VS_BUY.md`, `TOOLCHAIN.md`, `INSTRUMENTS.md`, `PIPELINE.md`,
`STATISTICAL_ANALYSIS.md`, `REPLICATION.md`, `FALSIFICATION.md`,
`CALIBRATION.md`, `PEER_REVIEW.md`, `LAB_MEMORY_UPDATE.md`, and
`LIMITATIONS.md`.

Public packages must not include raw logs, stdout/stderr fields, command
journals, secrets, private config, local absolute paths, environment variables,
or full raw source dumps.
