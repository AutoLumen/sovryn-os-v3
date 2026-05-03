# Publication Policy

Publication is controlled by Sovryn gates. The autonomous agent prepares work;
Sovryn Controller decides whether publication may proceed.

GitHub publication is blocked unless:

- the invention dossier is complete
- README, SPEC, DEFENSIVE_PUBLICATION, PRIOR_ART, LICENSE, and CITATION files exist
- a prototype or demo exists
- tests or validation steps exist and final verification passes
- final verification ran after the current publication source files changed
- secret scanning passes across generated files, prototype files, config-like files, docs, evidence, and release contents
- safety scanning passes
- prior-art notes and defensive publication text exist
- the GitHub target is present unless dry-run mode is used
- the mission is finalized for real publication

Publication decisions are written to:

```text
.sovryn/inventions/<slug>/evidence/publication-review.json
.sovryn/inventions/<slug>/evidence/final-verify.json
.sovryn/inventions/<slug>/evidence/github-publication.json
```

Sovryn does not guarantee novelty, patentability, freedom to operate, or legal
patent protection. Public publication may affect patent rights.
