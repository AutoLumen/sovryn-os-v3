# Corpus Autopublish Demo

Beta.10 can copy eligible, policy-gated Open Invention results into the existing
public corpus repository:

```text
https://github.com/n57d30top/sovryn-open-inventions
```

Example flow:

```bash
npm install
npm run build
node dist/cli.js init --json
node dist/cli.js pilot run --all --json
node dist/cli.js pilot review --json
node dist/cli.js pilot package --json
node dist/cli.js corpus publish-status --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
node dist/cli.js corpus publish-audit --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
node dist/cli.js corpus autopublish --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --dry-run --json
```

If the dry-run passes and the target repository is clean, a real corpus
autopublish run may be executed:

```bash
node dist/cli.js corpus autopublish --target-repo /Users/sovryn/Desktop/sovryn-open-inventions --json
```

The command publishes to that existing corpus repository only. It does not
create new GitHub repositories, does not expose tokens, and blocks on failed
quality, replay, security, safety, reliability, publication-dry-run, and public
hygiene gates.

Autopublished results are autonomous open-research artifacts. They are not
patent filings, patentability opinions, legal novelty opinions, or
freedom-to-operate opinions.
