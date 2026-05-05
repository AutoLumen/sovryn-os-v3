# Method Atlas

The Method Atlas organizes Sovryn's scientific methods by domain. It records
baselines, candidate methods, promising methods, supported methods, failed
methods, falsified methods, required tools, datasets, missing data, open
questions, and next experiments.

## Commands

```bash
sovryn knowledge method-atlas build --json
sovryn knowledge method-atlas domain <domain-id> --json
sovryn knowledge method-atlas report --json
```

## Evidence Rules

Methods are not promoted from wording alone. A supported method requires
evidence-bound source claims. Promising and failed methods remain visible.
Falsified or contradicted methods are retained with their limitations so later
strategy runs can decide whether a new resolution experiment is worth running.

## Output

The atlas is written to:

- `.sovryn/knowledge/method-atlas/method-atlas.json`
- `.sovryn/knowledge/method-atlas/domain-atlases/<domain-id>.json`
- `.sovryn/knowledge/method-atlas/METHOD_ATLAS.md`
- `.sovryn/knowledge/method-atlas/NEXT_METHOD_EXPERIMENTS.md`
