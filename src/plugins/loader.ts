import type { SovrynPlugin } from "./types.js";

export function loadBuiltinPlugins(): SovrynPlugin[] {
  return [samplePlugin()];
}

export function samplePlugin(): SovrynPlugin {
  return {
    name: "sample",
    version: "0.0.0",
    commands: [
      {
        name: "sample.echo",
        description: "Echoes plugin loader health.",
        async run(args) {
          return { args, loaded: true };
        }
      }
    ]
  };
}
