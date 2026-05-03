import type { SovrynPlugin } from "./types.js";
import { createGitNexusPlugin } from "../../packages/sovryn-plugin-gitnexus/src/index.js";

export function loadBuiltinPlugins(): SovrynPlugin[] {
  return [samplePlugin(), createGitNexusPlugin()];
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
