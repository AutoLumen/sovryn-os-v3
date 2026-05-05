# Strategy Trial Demo

Run:

```bash
node dist/cli.js strategy trial run --max-cycles 5 --autopublish-corpus --json
node dist/cli.js strategy trial audit --json
```

The trial writes `.sovryn/strategy/trials/<trial-id>/` and, when gates pass,
publishes a curated `autonomous_research_strategy_trial` package to the existing
public corpus repository.
