# Replay Contract

Sovryn replay checks recompute existing evidence without repeating public
research or real publication. Beta.8 separates artifacts by replay role so
volatile observations do not hide real failures and real failures do not get
papered over as harmless volatility.

## Classes

- `replay-critical`: hash-bound evidence that gates Factory review, launch
  readiness, publication readiness, safety, or public release packaging.
- `replay-summary`: derived summaries regenerated from replay-critical evidence.
- `volatile-observation`: command timing, runtime version, health checks, or
  similar observations that may legitimately change between runs.
- `non-public-local`: local-only evidence that must not enter curated public
  packages.
- `non-replayable-by-design`: external availability observations intentionally
  excluded from readiness math unless they affect safety or publication gates.

Replay-critical artifacts must be stable, hash-bound, and included in readiness
math. Volatile observations may be reported as non-blocking limitations, but
they must not leak raw logs, local absolute paths, secrets, private config, or
unsafe publication language.

## Launch Readiness

`sovryn reliability replay-all --json` reports both total replay pass rate and
replay-critical pass rate. E2E readiness uses the replay-critical pass rate for
launch blocking decisions and still reports the total pass rate for audit
visibility.

This is not a legal novelty, patentability, or freedom-to-operate process.
Sovryn produces Open Inventions, Defensive Publications, and Open Source
Research Artifacts.
