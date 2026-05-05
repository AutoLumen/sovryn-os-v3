# Scientific Knowledge Engine

Sovryn OS `3.9.0-rc.1` adds a Scientific Knowledge Engine for safe
computational science. It turns corpus results, scientific memory, discovery
outputs, strategy trials, lab reports, limitations, replication evidence, and
falsification evidence into a structured claim/evidence system.

This is not a product, dashboard, marketplace, hosted service, or community
feature. It is a research knowledge layer for deciding what Sovryn knows, what
is weak, what is contradicted, and what experiment should run next.

## Scope

The engine works only on safe computational-science artifacts:

- public or proxy data
- synthetic controls
- simulations
- software instruments
- statistics and baselines
- reproducibility evidence
- source-grounded reports

It does not produce patentability opinions, legal novelty opinions,
freedom-to-operate opinions, medical advice, wet-lab guidance, hazardous
chemistry, biological optimization, exploit guidance, or guaranteed truth
claims.

## Command Flow

```bash
sovryn knowledge graph build --json
sovryn knowledge confidence compute --json
sovryn knowledge contradictions detect --json
sovryn knowledge method-atlas build --json
sovryn knowledge next-experiments generate --json
sovryn knowledge next-experiments rank --json
sovryn knowledge next-experiments run --top 1 --json
sovryn knowledge trial run --autopublish-corpus --json
```

## Artifacts

The command family writes artifacts under `.sovryn/knowledge/`:

- `claim-graph/claim-graph.json`
- `claim-graph/claims.json`
- `claim-graph/evidence-bindings.json`
- `confidence/confidence-scores.json`
- `contradictions/contradictions.json`
- `method-atlas/method-atlas.json`
- `next-experiments/next-experiments.json`
- `trials/<trial-id>/KNOWLEDGE_TRIAL_REPORT.md`

Every public package is curated to exclude raw logs, command journals, secrets,
environment variables, local absolute paths, and unsupported breakthrough
claims.

## Gates

The main gates are:

- claim graph present
- claims evidence-bound
- source artifacts exist
- confidence scores present
- synthetic-only caps applied
- falsified claims marked
- contradictions analyzed
- method atlas present
- next experiments evidence-bound
- top experiment executed
- knowledge and scientific memory updated
- public hygiene passed
- no fake breakthrough claims
- no unsupported scientific claims

## Interpretation

Confidence labels are cautious:

- `unsupported`
- `weak`
- `moderate`
- `strong`
- `robust`
- `contradicted`
- `falsified`
- `promising_unproven`

Scores are deterministic triage signals, not truth estimates. Breakthrough
labels are never inferred from score alone.
