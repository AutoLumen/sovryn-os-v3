# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-03)

## Corpus Check
- 54 files · ~57,288 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 382 nodes · 960 edges · 16 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 222 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 15|Community 15]]

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
- `createOpenInvention()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `executeGitNexus()` --calls--> `runCommand()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/packages/sovryn-plugin-gitnexus/src/index.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/adapters/shell/command.ts
- `executeGitNexus()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/packages/sovryn-plugin-gitnexus/src/index.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts
- `unavailable()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/packages/sovryn-plugin-gitnexus/src/index.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (28): looksLikeNetworkCommand(), networkDenyEnv(), configExists(), configPath(), ensureGitignore(), initConfig(), loadConfig(), readText() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (14): createStore(), FileStore, hashVerifyEvidence(), hashVerifyOutcome(), hashVerifyResult(), executeCli(), inventionCommand(), errorEnvelope() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (21): ArxivSearchAdapter, asArray(), asRecord(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter(), dedupePriorArtResults(), fetchJson() (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (6): nodeCommand(), commandOutput(), LocalNodeAlphaBackend, NodeManager, assertNodeCapability(), assertNodeCommandAllowed()

### Community 4 - "Community 4"
Cohesion: 0.24
Nodes (6): readJson(), writeJson(), InventionService, hashEvidence(), writePhaseEvidence(), nowIso()

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (15): writeEvent(), createMissionId(), exists(), slugify(), titleFromBrief(), createResearchPlan(), listArtifactFiles(), nonEmpty() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (10): runCommand(), GitAdapter, numstat(), shellQuote(), gitIdentity(), CodexRunner, shellArg(), ShellRunner (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (11): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writeRedactedCommandJournal() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (15): evaluatePublicationPolicy(), exists(), hashPublicationSource(), listBlockedPublicationPaths(), listFiles(), listSkippedLargeTextFiles(), looksLikeTextFile(), nonEmpty() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (12): FakeRunner, createGitNexusPlugin(), executeGitNexus(), pluginCommand(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (7): Builder, DocWriter, Inventor, PriorArtMapper, Publisher, Scout, Skeptic

### Community 11 - "Community 11"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (12): doctor(), ensureInitialized(), flagBool(), flagInt(), flagRunMode(), flagString(), githubDoctor(), parseArgs() (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.35
Nodes (9): escapeYaml(), list(), renderCitation(), renderDefensivePublication(), renderNoveltyNotes(), renderPriorArt(), renderReadme(), renderSafetyReview() (+1 more)

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0):

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 14`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `executeCli()` connect `Community 1` to `Community 3`, `Community 4`, `Community 7`, `Community 9`, `Community 12`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 4` to `Community 1`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `PostgresStore` connect `Community 11` to `Community 0`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `executeCli()` (e.g. with `createOpenInvention()` and `okEnvelope()`) actually correct?**
  _`executeCli()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `nowIso()` (e.g. with `writePhaseEvidence()` and `.inventOpen()`) actually correct?**
  _`nowIso()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `runCommand()` (e.g. with `executeGitNexus()` and `.runFinalVerify()`) actually correct?**
  _`runCommand()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
