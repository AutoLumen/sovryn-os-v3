# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-03)

## Corpus Check
- 53 files · ~49,215 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 323 nodes · 846 edges · 15 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 208 edges (avg confidence: 0.8)
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
3. `runCommand()` - 24 edges
4. `nowIso()` - 23 edges
5. `MissionService` - 18 edges
6. `NodeManager` - 15 edges
7. `writeJson()` - 15 edges
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
- `initConfig()` --calls--> `writeJson()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/config.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/fs.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (10): createStore(), FileStore, hashVerifyEvidence(), hashVerifyOutcome(), hashVerifyResult(), applyRunnerOptions(), MissionService, redactSecrets() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (15): assertGitHubTargetSafe(), GitHubPublisher, createMissionId(), exists(), slugify(), titleFromBrief(), TemplateResearchProvider, PublicationService (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (15): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), countLines(), GitAdapter, listFiles(), numstat(), shellQuote() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (10): configPath(), ensureGitignore(), initConfig(), readText(), discoverVerifyCommands(), exists(), readPackageJson(), AppError (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (7): loadConfig(), readJson(), writeJson(), InventionService, hashEvidence(), writePhaseEvidence(), nowIso()

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (8): writeEvent(), commandOutput(), listArtifactFiles(), LocalNodeAlphaBackend, shellQuote(), writeArtifactIndex(), backendForHost(), assertNodeCommandAllowed()

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (17): configExists(), toAppError(), doctor(), ensureInitialized(), executeCli(), flagBool(), flagString(), inventionCommand() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (12): FakeRunner, createGitNexusPlugin(), executeGitNexus(), pluginCommand(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.3
Nodes (3): nodeCommand(), NodeManager, assertNodeCapability()

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (13): evaluatePublicationPolicy(), exists(), latestMtime(), latestPublicationContentModifiedAt(), listBlockedPublicationPaths(), listFiles(), nonEmpty(), readTextIfSafe() (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (10): currentValidApprovals(), evaluatePolicy(), listFiles(), looksText(), riskForFiles(), riskForPath(), riskRank(), scanChangedFileContents() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (9): escapeYaml(), list(), renderCitation(), renderDefensivePublication(), renderNoveltyNotes(), renderPriorArt(), renderReadme(), renderSafetyReview() (+1 more)

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

- **Why does `executeCli()` connect `Community 6` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `PostgresStore` connect `Community 10` to `Community 3`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 4` to `Community 0`, `Community 8`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `executeCli()` (e.g. with `createOpenInvention()` and `okEnvelope()`) actually correct?**
  _`executeCli()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `runCommand()` (e.g. with `executeGitNexus()` and `.runFinalVerify()`) actually correct?**
  _`runCommand()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `nowIso()` (e.g. with `writePhaseEvidence()` and `.inventOpen()`) actually correct?**
  _`nowIso()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
