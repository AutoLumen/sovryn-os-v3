# Knowledge Engine Demo

This demo runs the full bounded Scientific Knowledge Engine flow.

```bash
npm run build
node dist/cli.js knowledge trial run --json
node dist/cli.js knowledge trial audit --json
node dist/cli.js knowledge trial report --json
```

To publish a public-safe package to the configured corpus, run:

```bash
node dist/cli.js knowledge trial run --autopublish-corpus --json
```

Publication is gated by public hygiene, evidence binding, scientific memory
updates, no fake breakthrough claims, and no unsupported scientific claims.
