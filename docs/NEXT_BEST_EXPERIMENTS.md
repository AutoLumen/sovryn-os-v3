# Next-Best Experiments

The Next-Best-Experiment Engine turns the Scientific Knowledge Engine state
into concrete bounded experiments. It uses claim graph gaps, confidence scores,
contradictions, method atlas gaps, synthetic-only findings, missing baselines,
missing real/proxy data, failed reproductions, and tool gaps.

## Commands

```bash
sovryn knowledge next-experiments generate --json
sovryn knowledge next-experiments rank --json
sovryn knowledge next-experiments report --json
sovryn knowledge next-experiments run --top 1 --json
```

## Candidate Fields

Each candidate includes:

- objective
- hypothesis
- null hypothesis
- required data
- required tools
- baseline plan
- ablation plan
- falsification plan
- replication plan
- expected knowledge gain
- feasibility
- safety scope
- stop criteria
- success criteria

## Execution

Running a top experiment creates a bounded knowledge update. It updates
scientific memory and records the experiment result without claiming a
breakthrough. Public output is optional and remains subject to corpus hygiene
and safety gates.
