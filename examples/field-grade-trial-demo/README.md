# Field-Grade Trial Demo

Run a complete bounded trial:

```bash
sovryn field-grade trial run --autopublish-corpus --json
sovryn field-grade trial audit --json
sovryn corpus publish-audit --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
sovryn corpus site audit --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
```

The public result type is `field_grade_autonomous_science_trial`. It reports
verified sources, verified datasets, validated tools, real-data benchmarks,
external challenges, independent reproductions, adversarial falsifications,
knowledge updates, failures, losses, limitations, and next research direction.
