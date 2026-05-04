# Release Candidate Demo

This demo shows the Alpha.21 release-candidate workflow. It uses
fixture-backed strong Factory runs so it is deterministic and does not require
network access.

```bash
npm install
npm run build
node dist/cli.js init --json
node dist/cli.js release candidates build --max 3 --json
node dist/cli.js release candidates review --json
node dist/cli.js release candidates package --json
node dist/cli.js corpus index --json
node dist/cli.js release registry update --json
```

Generated artifacts:

```text
.sovryn/releases/candidates/
  release-candidates.json
  release-candidate-review.json
  publication-queue.json
  RELEASE_CANDIDATES.md
  RELEASE_CANDIDATE_REVIEW.md
  PUBLICATION_QUEUE.md
  public/
```

The workflow prepares three Open Invention release candidates:

- verifiable autonomous research agents,
- evidence-bound source-card trust scoring,
- container-isolated prototype validation for research agents.

Each candidate still requires human review before any real publication. Sovryn
does not file patents and does not provide legal novelty, patentability, or
freedom-to-operate opinions.
