# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-03)

## Corpus Check
- 54 files · ~60,620 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 389 nodes · 973 edges · 15 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 223 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `executeCli()` - 30 edges
2. `InventionService` - 25 edges
3. `nowIso()` - 25 edges
4. `runCommand()` - 25 edges
5. `MissionService` - 18 edges
6. `writeJson()` - 16 edges
7. `NodeManager` - 15 edges
8. `PostgresStore` - 15 edges
9. `redactSecrets()` - 14 edges
10. `FileStore` - 14 edges

## Surprising Connections (you probably didn't know these)
- `appendLesson()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/memory/memory.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts
- `executeGitNexus()` --calls--> `runCommand()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/packages/sovryn-plugin-gitnexus/src/index.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/adapters/shell/command.ts
- `executeGitNexus()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/packages/sovryn-plugin-gitnexus/src/index.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts
- `unavailable()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/packages/sovryn-plugin-gitnexus/src/index.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts
- `configExists()` --calls--> `ensureInitialized()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/config.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (27): ArxivSearchAdapter, asArray(), asRecord(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter(), dedupePriorArtResults() (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (14): commandOutput(), createResearchPlan(), listArtifactFiles(), LocalNodeAlphaBackend, nonEmpty(), planStep(), scoreArtifactCompleteness(), shellQuote() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (9): createStore(), FileStore, hashVerifyEvidence(), hashVerifyOutcome(), hashVerifyResult(), applyRunnerOptions(), MissionService, redactSecrets() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (12): writeEvent(), readJson(), writeJson(), createMissionId(), exists(), InventionService, slugify(), titleFromBrief() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (23): configExists(), configPath(), ensureGitignore(), initConfig(), loadConfig(), readText(), discoverVerifyCommands(), exists() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (16): Builder, DocWriter, Inventor, PriorArtMapper, Publisher, Scout, Skeptic, escapeYaml() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (10): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), countLines(), GitAdapter, listFiles(), numstat(), shellQuote() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (20): toAppError(), doctor(), ensureInitialized(), executeCli(), flagBool(), flagInt(), flagRunMode(), flagString() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (15): evaluatePublicationPolicy(), exists(), hashPublicationSource(), listBlockedPublicationPaths(), listFiles(), listSkippedLargeTextFiles(), looksLikeTextFile(), nonEmpty() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (6): FakeRunner, createRunner(), CodexRunner, shellArg(), ShellRunner, SshRunner

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (9): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writeRedactedCommandJournal() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.24
Nodes (11): createGitNexusPlugin(), executeGitNexus(), pluginCommand(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin(), loadPlugins() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0):

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 13`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `executeCli()` connect `Community 7` to `Community 2`, `Community 3`, `Community 6`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 3` to `Community 1`, `Community 2`, `Community 7`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `PostgresStore` connect `Community 12` to `Community 4`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `executeCli()` (e.g. with `createOpenInvention()` and `okEnvelope()`) actually correct?**
  _`executeCli()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `nowIso()` (e.g. with `writePhaseEvidence()` and `.inventOpen()`) actually correct?**
  _`nowIso()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `runCommand()` (e.g. with `executeGitNexus()` and `.runFinalVerify()`) actually correct?**
  _`runCommand()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
