# Graph Report - .  (2026-05-03)

## Corpus Check
- 33 files · ~21,630 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 166 nodes · 432 edges · 10 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `executeCli()` - 23 edges
2. `runCommand()` - 22 edges
3. `MissionService` - 16 edges
4. `PostgresStore` - 15 edges
5. `FileStore` - 14 edges
6. `redactSecrets()` - 13 edges
7. `GitAdapter` - 12 edges
8. `nowIso()` - 11 edges
9. `shellQuote()` - 8 edges
10. `createReview()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `appendLesson()` --calls--> `redactSecrets()`  [INFERRED]
  src/core/memory/memory.ts → src/shared/redaction.ts
- `executeGitNexus()` --calls--> `runCommand()`  [INFERRED]
  packages/sovryn-plugin-gitnexus/src/index.ts → src/adapters/shell/command.ts
- `executeGitNexus()` --calls--> `redactSecrets()`  [INFERRED]
  packages/sovryn-plugin-gitnexus/src/index.ts → src/shared/redaction.ts
- `unavailable()` --calls--> `redactSecrets()`  [INFERRED]
  packages/sovryn-plugin-gitnexus/src/index.ts → src/shared/redaction.ts
- `runVerify()` --calls--> `runCommand()`  [INFERRED]
  src/core/verify/verifier.ts → src/adapters/shell/command.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (5): createStore(), applyRunnerOptions(), MissionService, nowIso(), WorkspaceManager

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (11): configPath(), ensureGitignore(), initConfig(), loadConfig(), readText(), AppError, readJson(), writeJson() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (10): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), countLines(), GitAdapter, listFiles(), numstat(), shellQuote() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (9): writeEvent(), appendLesson(), evaluatePolicy(), listFiles(), riskForFiles(), riskForPath(), riskRank(), scanMissionFiles() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (5): createRunner(), CodexRunner, shellArg(), ShellRunner, SshRunner

### Community 5 - "Community 5"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (11): configExists(), toAppError(), doctor(), ensureInitialized(), executeCli(), flagString(), parseArgs(), rejectForbiddenSecretArgs() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (7): FakeRunner, createGitNexusPlugin(), executeGitNexus(), pluginCommand(), unavailable(), loadBuiltinPlugins(), samplePlugin()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (2): FileStore, redactSecrets()

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (4): discoverVerifyCommands(), exists(), readPackageJson(), runVerify()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PostgresStore` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Why does `runCommand()` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `executeCli()` connect `Community 6` to `Community 8`, `Community 0`, `Community 2`, `Community 7`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `executeCli()` (e.g. with `okEnvelope()` and `.init()`) actually correct?**
  _`executeCli()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `runCommand()` (e.g. with `executeGitNexus()` and `runVerify()`) actually correct?**
  _`runCommand()` has 19 INFERRED edges - model-reasoned connections that need verification._