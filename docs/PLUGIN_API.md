# Plugin API

Plugins are optional extensions. Core must not import domain-specific plugins.

A plugin can provide:

- Commands
- Verify providers
- Artifact parsers
- Review enrichers

Minimal interface:

```ts
export type SovrynPlugin = {
  name: string;
  version: string;
  commands?: PluginCommand[];
  verifyProviders?: VerifyProvider[];
  artifactParsers?: ArtifactParser[];
  reviewEnrichers?: ReviewEnricher[];
};
```

Plugins receive a constrained context with root paths, config, and artifact
helpers. They must return stable JSON-compatible data and must not bypass policy
or finalize gates.

The included sample plugin is only a loader fixture.
