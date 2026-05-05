# Autonomous Research Strategist Trial

The strategy trial proves the full knowledge-engine loop:

```bash
sovryn strategy trial run --max-cycles 5 --autopublish-corpus --json
```

The trial must:

- read corpus and scientific memory,
- extract at least ten evidence-bound opportunities,
- rank them,
- select top opportunities,
- build one research program,
- execute adaptive cycles,
- run at least one reproduction attempt,
- run at least one falsification attempt,
- update scientific memory,
- recommend the next research direction,
- publish only a curated public-safe result if gates pass.

The public result type is `autonomous_research_strategy_trial`.

This does not claim a breakthrough. It records how Sovryn decides what to study
next, why that direction was selected, what evidence is missing, and which
checks should be run before stronger claims are allowed.
