export type PluginContext = {
  root: string;
};

export type PluginCommand = {
  name: string;
  description: string;
  run(args: string[], context: PluginContext): Promise<Record<string, unknown>>;
};

export type VerifyProvider = {
  name: string;
  commands(context: PluginContext): Promise<string[]>;
};

export type ArtifactParser = {
  name: string;
  parse(path: string, context: PluginContext): Promise<Record<string, unknown>>;
};

export type ReviewEnricher = {
  name: string;
  enrich(context: PluginContext): Promise<Record<string, unknown>>;
};

export type SovrynPlugin = {
  name: string;
  version: string;
  commands?: PluginCommand[];
  verifyProviders?: VerifyProvider[];
  artifactParsers?: ArtifactParser[];
  reviewEnrichers?: ReviewEnricher[];
};
