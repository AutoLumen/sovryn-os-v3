# Field-Grade Autonomy Trial

The Field-Grade Autonomy Trial is a bounded 7-day campaign simulation that
checks whether Sovryn can keep a scientific loop coherent under external-source
pressure.

The trial performs:

- source and dataset verification
- campaign planning, checkpoints, failure classification, and reports
- toolchain inference, provisioning evidence, and validation
- real/public-safe dataset benchmark execution across five domains
- three external benchmark-style challenges
- three independent reproduction attempts
- three adversarial falsification attempts
- claim graph, confidence, contradiction, method-atlas, next-experiment, and
  scientific-memory updates
- curated public package creation and corpus publication when gates pass

The trial score reports verified source count, verified dataset count, tools
provisioned and validated, benchmark domains, external challenges, baseline
runs, ablations, sensitivity runs, independent reproductions, adversarial
falsifications, knowledge updates, failures recorded, losses recorded, public
hygiene, unsupported claims, fake breakthrough claims, and
`fieldGradeReadinessLabel`.

Expected result type:

```text
field_grade_autonomous_science_trial
```

The trial intentionally records unavailable sources, degraded dataset fallback,
benchmark losses, and failed challenge cases. A field-grade run is stronger
because it records where it breaks; it is not a claim of universal scientific
truth.
