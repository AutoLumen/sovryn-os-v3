# Public Corpus Demo

Alpha.24 can export a curated public discovery layer from local Sovryn corpus
memory.

```bash
npm install
npm run build
mkdir -p /tmp/sovryn-public-corpus-demo
cd /tmp/sovryn-public-corpus-demo
git init -b main
git config user.name "Demo User"
git config user.email demo@example.com
printf '{"scripts":{"test":"node -e \"process.exit(0)\""}}\n' > package.json
git add -A
git commit -m initial
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js init --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js release candidates build --max 1 --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js corpus export-public --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js corpus graph --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js corpus site build --json
```

Expected curated output:

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

public-corpus/
  index.html
  corpus.json
```

The export is public discovery metadata only. It does not copy raw command logs,
stdout/stderr, private config, full raw source content, secrets, or local
absolute paths. It is not a legal patent filing or patentability opinion.
