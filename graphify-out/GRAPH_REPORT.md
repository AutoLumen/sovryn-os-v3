# Graph Report - .  (2026-05-03)

## Corpus Check
- 30 files · ~7,497 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 132 nodes · 336 edges · 8 communities detected
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `executeCli()` - 22 edges
2. `runCommand()` - 18 edges
3. `FileStore` - 14 edges
4. `MissionService` - 12 edges
5. `GitAdapter` - 12 edges
6. `redactSecrets()` - 11 edges
7. `nowIso()` - 11 edges
8. `shellQuote()` - 8 edges
9. `createReview()` - 7 edges
10. `evaluatePolicy()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `makeTempRepo()` --calls--> `runCommand()`  [INFERRED]
  src/testkit/temp-repo.ts → src/adapters/shell/command.ts
- `appendLesson()` --calls--> `redactSecrets()`  [INFERRED]
  src/core/memory/memory.ts → src/shared/redaction.ts
- `runVerify()` --calls--> `runCommand()`  [INFERRED]
  src/core/verify/verifier.ts → src/adapters/shell/command.ts
- `createReview()` --calls--> `evaluatePolicy()`  [INFERRED]
  src/core/review/review.ts → src/core/policy/policy.ts
- `writeEvent()` --calls--> `nowIso()`  [INFERRED]
  src/core/events/events.ts → src/shared/time.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (5): FileStore, executeCli(), okEnvelope(), MissionService, nowIso()

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (8): FakeRunner, appendLesson(), redactSecrets(), createRunner(), CodexRunner, shellArg(), ShellRunner, makeTempRepo()

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (10): runCommand(), countLines(), GitAdapter, listFiles(), numstat(), shellQuote(), gitIdentity(), createReview() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (9): configPath(), ensureGitignore(), initConfig(), loadConfig(), readText(), AppError, readJson(), writeJson() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (9): configExists(), doctor(), ensureInitialized(), flagString(), parseArgs(), pluginCommand(), requiredId(), loadBuiltinPlugins() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.42
Nodes (7): evaluatePolicy(), listFiles(), riskForFiles(), riskForPath(), riskRank(), scanMissionFiles(), scanSecrets()

### Community 6 - "Community 6"
Cohesion: 0.43
Nodes (4): discoverVerifyCommands(), exists(), readPackageJson(), runVerify()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (3): toAppError(), writeEvent(), errorEnvelope()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `executeCli()` connect `Community 0` to `Community 2`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `runCommand()` connect `Community 2` to `Community 0`, `Community 1`, `Community 6`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `redactSecrets()` connect `Community 1` to `Community 0`, `Community 2`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `executeCli()` (e.g. with `okEnvelope()` and `.init()`) actually correct?**
  _`executeCli()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `runCommand()` (e.g. with `runVerify()` and `.run()`) actually correct?**
  _`runCommand()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._