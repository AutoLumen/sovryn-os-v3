# Tool-Operating Discovery Scientist

Sovryn OS `3.7.0-rc.1` adds a bounded discovery layer on top of the
self-building computational lab. The goal is not to guarantee a breakthrough.
The goal is to operate scientific programs, generate large candidate sets,
reject weak candidates, validate promising candidates, and publish only curated
safe discovery results.

## Program Operator

`sovryn lab program ...` treats external scientific programs as scientific
instruments:

- `sympy` for symbolic simplification, equation solving, and recurrence-like
  expressions.
- `z3-solver` for satisfiable/unsatisfiable constraint checks.
- `numpy` and `scipy` for statistics and optimization.
- `pandas` and `scikit-learn` for small deterministic data-science smoke tasks.
- `networkx` for graph metrics and shortest-path style analysis.
- `lean` is optional and is reported as unavailable unless safely provisionable.

Every program card records version evidence, capability scope, input/output
formats, worker profile, no-silent-fallback evidence, failure modes, and
reproducibility notes. Program artifacts do not publish raw stdout/stderr,
command journals, secrets, environment variables, local absolute paths, host
sudo usage, or curl-pipe-shell installers.

## Discovery Search

`sovryn discovery ...` supports deterministic search-space creation, candidate
generation, candidate evaluation, ranking, evolution, pipeline composition,
breakthrough validation, and campaign execution. Search spaces include:

- candidate representation
- allowed and prohibited operations
- evaluation metrics
- baseline methods
- constraints
- safety scope
- novelty criteria
- falsification criteria
- worker profile

Supported discovery domains include algorithmic method discovery, anomaly
detection scoring formulas, dataset reliability scoring, patch-risk scoring,
symbolic conjecture exploration, and optimization heuristic generation.

The first search class requires at least 2 baselines, 3 generations, top 5
candidate falsification, invalid invariants rejected by SymPy/Z3 checks,
falsification required, replication required, no breakthrough claim unless gates
pass, and a public report with rejected candidates.

Candidates are never promoted on score alone. Promotion requires baseline
comparison, falsification, replication, novelty checking, bounded complexity,
and no overclaiming.

## Program-Orchestrated Pipelines

Discovery pipelines bind external programs and custom instruments:

- candidate generation
- symbolic simplification with SymPy
- constraint checking with Z3
- parameter optimization/statistics with NumPy/SciPy
- baseline evaluation
- candidate evaluation
- falsification case generation
- replication
- ranking
- report generation

Black-box-only candidates cannot become breakthrough candidates. Synthetic-only
wins are marked limited.

Pipeline audit vocabulary: invalid formula rejected, overly complex formula
rejected, overfit candidate rejected, program failure creates degraded evidence,
pipeline replay stable, program bindings public, custom instrument bindings public,
candidate flow DAG public, publicSafe, no raw logs, no secrets, no local
paths, no fake scientific claims.

Breakthrough validation vocabulary: strict validation, all candidates can be
rejected honestly, duplicate candidates are not promoted, baseline-only candidates
are not promoted, promising discoveries remain promising_but_unproven
until stronger evidence exists, and toy-only results cannot be overclaimed.

## Invented Discovery Tools

When existing programs are insufficient, Sovryn can create bounded discovery
instruments:

- `counterexample-generator`
- `formula-complexity-penalizer`
- `novelty-gap-miner`
- `baseline-gap-finder`

Each invented tool has a capability gap, invention rationale, design, prototype,
tests, benchmark cases, integration plan, integration results, limitations, and
a public-safe report. Failed or non-improving tools are marked failed or
`needs_revision`; improvement is not faked.

Tool invention rules: every invented tool solves a specific capability gap, has
benchmark cases, has limitations, blocks unsafe domain input, avoids full
generality claims, records before/after comparison evidence, and is marked
failed or needs_revision if it does not improve discovery. Integration evidence
uses integrationResults and beforeAfterComparison records.

## Campaign Result Types

Discovery campaign corpus results use one of:

- `discovery_breakthrough_candidate`
- `discovery_promising_unproven`
- `discovery_negative_result`

The public corpus package includes `DISCOVERY_CAMPAIGN_REPORT.md`,
`SEARCH_SPACE.md`, `CANDIDATE_EVALUATION.md`, `BASELINE_COMPARISON.md`,
`FALSIFICATION.md`, `REPLICATION.md`, `NOVELTY_CHECK.md`, `TOOLCHAIN.md`,
`INVENTED_TOOLS.md`, `LIMITATIONS.md`, `SUMMARY.json`, and
`AUTOPUBLISH_RECORD.json`.

The result is an autonomous computational discovery artifact. It is not a patent
filing, patentability opinion, legal novelty opinion, freedom-to-operate
opinion, medical advice, wet-lab guidance, hazardous chemistry, biological
optimization, or exploit guidance.

Public safety vocabulary: No raw logs. No secrets. No local paths. No fake
scientific claims. No dangerous domain content. Human interpretation required.
Campaign reports name the best candidate only as a candidate, not as guaranteed
truth.

Exact audit phrases: overly complex formula rejected; custom instrument bindings
public; candidate restrictions; all candidates can be rejected; baseline-only
candidates; substituted data; confidence; search-space exploration.
