# Corpus

The corpus layer indexes generated Factory runs, Open Inventions, source cards,
claim features, quality scores, duplicate-risk relationships, and release
metadata.

```bash
sovryn corpus index --json
sovryn corpus search "verifiable evidence" --json
sovryn corpus export-public --json
sovryn corpus site build --json
sovryn corpus explain <id> --json
sovryn corpus publish-status --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
sovryn corpus publish-audit --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
sovryn corpus autopublish --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --dry-run --json
```

Public corpus export is curated. It must not include raw command logs, secrets,
private config, local absolute paths, full raw source content, or legal
patentability claims.

The corpus improves future opportunity scans and helps reduce duplicate
research. It is evidence memory, not a legal patent registry.

## Corpus Autopublish

Beta.10 adds a narrow autopublish path for the existing public corpus repo:

```text
https://github.com/n57d30top/sovryn-open-inventions
```

`corpus autopublish` does not create repositories and does not require human
review for this corpus path. It still blocks unless automated gates pass:
quality `good` or `excellent`, `dry_run_ready` or `review_ready` status,
evidence strength >= 80, reproducibility >= 90, publication safety >= 85,
replay-critical pass rate 100, security/safety/reliability/public-hygiene pass,
and publication dry-run evidence present.

The target repo receives only curated result folders, summaries, verification
records, publication intent, and aggregate ledgers. Raw logs, stdout/stderr,
secrets, local absolute paths, private config, dangerous content, fake legal
claims, and full raw source dumps are blocked.

Every autopublished result states that it is an autonomous open-research
artifact, not a patent filing, not a patentability opinion, not a legal novelty
opinion, and not a freedom-to-operate opinion.
