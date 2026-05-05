# Research Strategist

Sovryn's Research Strategist layer turns prior evidence into the next research
direction. It is a knowledge-engine layer, not a product dashboard or platform.
This is not product, dashboard, platform, hosted, or marketplace work; the
scope is research strategy and scientific memory.

The strategy loop is:

1. Read scientific memory, lab memory, discovery artifacts, and the public corpus.
2. Extract evidence-bound research opportunities.
3. Rank opportunities with coarse expected-information-gain style scores.
4. Build a research program with hypotheses, null hypotheses, baselines,
   ablations, replication targets, falsification targets, and stop/continue
   criteria.
5. Execute bounded adaptive cycles.
6. Build reproduction and falsification queues.
7. Update scientific memory.
8. Publish only curated public-safe strategy-trial summaries when all gates pass.

## Commands

```bash
sovryn strategy opportunities --json
sovryn strategy opportunities --source corpus --json
sovryn strategy rank --top 10 --json
sovryn strategy explain-ranking <opportunity-id> --json
sovryn strategy program --top 5 --json
sovryn strategy program report <program-id> --json
sovryn strategy execute <program-id> --max-cycles 3 --json
sovryn strategy execution-status <execution-id> --json
sovryn strategy execution-report <execution-id> --json
sovryn strategy reproduce-queue --json
sovryn strategy falsify-queue --json
sovryn strategy run-reproduction --top 1 --json
sovryn strategy run-falsification --top 1 --json
sovryn strategy trial run --max-cycles 5 --autopublish-corpus --json
sovryn strategy trial audit --json
```

## Safety Scope

The strategist is limited to safe computational research: public/proxy data,
synthetic controls, simulations, software instruments, statistics, benchmarks,
reproducibility, and source-grounded analysis. It must not claim patentability,
legal novelty, freedom-to-operate, medical conclusions, wet-lab guidance,
hazardous chemistry, biological optimization, exploit guidance, or guaranteed
breakthroughs.

## Ranking Model

Ranking uses coarse integer scores. It combines uncertainty reduction, evidence
gaps, feasibility, tool readiness, safety, novelty potential, replication value,
falsification value, corpus value, and publication value. The numbers are
strategy heuristics, not precise probabilities.

## Public Output

Public strategy-trial packages are curated summaries only. They must exclude raw
logs, stdout/stderr fields, command journals, secrets, local absolute paths,
private configuration, unsupported scientific claims, and fake breakthrough
claims.
