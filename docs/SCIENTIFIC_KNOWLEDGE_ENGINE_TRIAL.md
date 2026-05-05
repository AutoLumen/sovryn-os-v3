# Scientific Knowledge Engine Trial

The Scientific Knowledge Engine Trial proves the full loop:

1. build a claim graph
2. compute confidence scores
3. detect contradictions
4. build the method atlas
5. generate next-best experiments
6. rank the experiments
7. execute the top bounded experiment
8. update scientific memory
9. curate a public-safe package
10. publish only when gates pass

## Command

```bash
sovryn knowledge trial run --autopublish-corpus --json
sovryn knowledge trial audit --json
sovryn knowledge trial report --json
```

## Public Result

When gates pass, Sovryn publishes a
`scientific_knowledge_engine_trial` result to the configured public corpus. The
package includes:

- `SUMMARY.json`
- `README.md`
- `KNOWLEDGE_TRIAL_REPORT.md`
- `CLAIM_GRAPH.md`
- `CONFIDENCE_REPORT.md`
- `CONTRADICTION_REPORT.md`
- `METHOD_ATLAS.md`
- `NEXT_BEST_EXPERIMENTS.md`
- `EXECUTED_EXPERIMENT_REPORT.md`
- `KNOWLEDGE_UPDATE_REPORT.md`
- `LIMITATIONS.md`

## Trial Labels

The readiness label is one of:

- `blocked`
- `weak`
- `moderate`
- `strong`
- `rc-ready`

The label reflects whether the knowledge workflow produced evidence-bound
outputs and passed public safety gates. It is not a claim of scientific truth.
