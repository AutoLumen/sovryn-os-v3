# Scientific Method Core

Sovryn OS `3.1.0-alpha.1` adds the first autonomous computational-science layer.
It is a planning and review layer, not an experiment runtime yet.

The core flow is:

1. Create a scientific question.
2. Generate hypotheses with explicit null hypotheses.
3. Design a bounded computational experiment.
4. Review the study against scientific-method and safety gates.

```bash
sovryn science question "Do provenance-aware anomaly scoring methods reduce false positives in synthetic energy-usage datasets compared with simple threshold baselines?" --json
sovryn science hypothesize <question-id> --json
sovryn science experiment design <hypothesis-id> --json
sovryn science review <study-id> --json
```

Study artifacts are written under:

```text
.sovryn/science/studies/<study-slug>/
  study.json
  question.json
  hypotheses.json
  experiment-design.json
  safety-scope.json
  SCIENCE_PLAN.md
  STUDY_STATUS.md
  science-review.json
  SCIENCE_REVIEW.md
```

The alpha gates require a question, hypotheses, null hypotheses, experiment
design, baseline, metrics, falsification criteria, and safety scope. They also
block unsupported scientific claims before experiments, statistics, replication,
and falsification exist.

Hard safety boundaries remain in force:

- no dangerous wet-lab protocols,
- no hazardous chemistry synthesis,
- no biological optimization,
- no exploit development,
- no medical treatment recommendations.

Sovryn scientific studies are limited to safe computational work: public
non-sensitive data, synthetic data, simulations, statistics, benchmarks, and
software instruments. Sovryn does not file patents and does not provide legal
novelty, patentability, or freedom-to-operate opinions.
