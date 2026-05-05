# Knowledge Graph Demo

This demo shows the first half of the Scientific Knowledge Engine.

```bash
npm run build
node dist/cli.js knowledge graph build --json
node dist/cli.js knowledge claims --json
node dist/cli.js knowledge confidence compute --json
node dist/cli.js knowledge contradictions detect --json
node dist/cli.js knowledge method-atlas build --json
```

Review the generated `.sovryn/knowledge/` reports. Claims remain tied to source
artifacts and limitations, and unsupported claims stay unsupported.
