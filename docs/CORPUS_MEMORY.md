# Corpus Memory

Alpha.20 adds local corpus memory for autonomous open research. The corpus
indexes previous Factory runs, Open Inventions, source cards, release packages,
and duplicate-risk relationships so Sovryn can reduce repeated work and reuse
evidence in future opportunity scans.

```bash
sovryn corpus index --json
sovryn corpus search "verifiable autonomous research agents" --json
sovryn corpus dedupe --json
sovryn corpus report --json
sovryn corpus export-public --json
sovryn corpus site build --json
sovryn corpus graph --json
sovryn corpus compare --json
sovryn corpus explain <invention-id> --json
sovryn release registry update --json
```

Artifacts are written under:

```text
.sovryn/corpus/
  corpus-index.json
  invention-registry.json
  source-registry.json
  duplicate-map.json
  feedback-index.json
  corpus-quality-report.json
  corpus-quality-report.md
  PUBLIC_RELEASES.md
  last-search.json
  public/
```

The corpus stores summaries, identifiers, source-card metadata, reuse counts,
readiness labels, and release metadata. It does not copy raw command logs, raw
stdout/stderr, full source contents, secrets, private config, or Node Alpha
workspace paths.

`source-registry.json` is built from concrete source cards. Query links, adapter
failures, and mock placeholders are not treated as reusable reviewed prior art.

`duplicate-map.json` uses conservative token-overlap similarity. It is a
duplicate-risk signal for human review, not an automatic block and not a legal
novelty conclusion.

`PUBLIC_RELEASES.md` is a public Open Invention registry. It can track dry-run
packages and real releases prepared by Sovryn Controller, but it is not a legal
patent filing, not a patentability opinion, and not a freedom-to-operate
opinion.

Opportunity scans read the corpus when present. Reusable source evidence and
duplicate-risk signals can become `corpus`-sourced research opportunities, which
helps Sovryn decide what to improve next.

## Public Discovery Export

Alpha.24 adds `.sovryn/corpus/public/` as a curated public discovery layer.

```text
.sovryn/corpus/public/
  index.json
  inventions.json
  sources.json
  source-cards.json
  claim-features.json
  release-candidates.json
  quality-scores.json
  duplicate-map.public.json
  corpus-graph.json
  CORPUS_INDEX.md
  INVENTIONS.md
  SOURCES.md
  QUALITY.md
  DUPLICATES.md
```

`corpus export-public` writes the curated files and gate results. `corpus graph`
returns source/invention/factory/release relationships. `corpus compare` returns
duplicate clusters and source reuse signals. `corpus explain <id>` returns a
public explanation with evidence references for a factory run, invention,
source, or release.

`corpus site build` writes a deterministic `public-corpus/` shell for demos.
The public export excludes raw logs, raw stdout/stderr, private config, full raw
source content, secrets, local absolute paths, and unpublished private memory.
