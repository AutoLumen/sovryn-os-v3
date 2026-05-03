# Open Invention Demo

This example shows the artifact shape produced by:

```bash
npm install
npm test
npm run build
node dist/cli.js invent-open "A method for verifiable open-source agent research"
node dist/cli.js invention review <mission-id>
node dist/cli.js publish-github <mission-id> --dry-run
```

In this repository the built CLI entrypoint is `dist/cli.js`.

Demo artifacts:

- `generated/dossier.json`
- `generated/DEFENSIVE_PUBLICATION.md`
- `generated/prototype/`
- `generated/evidence/publication-review.json`
- `generated/evidence/github-publication.json`

Sovryn publishes Open Inventions and Defensive Publications. It does not file
legal patents.
