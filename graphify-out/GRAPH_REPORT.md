# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 72 files · ~135,411 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 743 nodes · 2014 edges · 18 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 415 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `nowIso()` - 47 edges
2. `executeCli()` - 43 edges
3. `hashEvidence()` - 40 edges
4. `writeJson()` - 39 edges
5. `FactoryService` - 35 edges
6. `runCommand()` - 28 edges
7. `InventionService` - 26 edges
8. `evaluateFactoryGates()` - 25 edges
9. `ResearchOpportunityEngine` - 24 edges
10. `MissionService` - 18 edges

## Surprising Connections (you probably didn't know these)
- `appendLesson()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/memory/memory.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `scan()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-opportunity.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `queueBuild()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-opportunity.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `queueRun()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-opportunity.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (39): looksLikeNetworkCommand(), networkDenyEnv(), configExists(), configPath(), ensureGitignore(), initConfig(), loadConfig(), readText() (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (59): arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore(), buildFactorySourceReadings() (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (34): appendFactoryCandidateDocs(), assertFactoryEnabled(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId(), evidenceRefs(), exists() (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (19): runCommand(), createStore(), assertSandboxCommandAllowed(), FakeRunner, FileStore, countLines(), GitAdapter, listFiles() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (44): toAppError(), alpha14Fixture(), createStrictRunWithoutSharedState(), readJson(), createGitNexusPlugin(), doctor(), ensureInitialized(), executeCli() (+36 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (30): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (32): factoryPriorArtFixtures(), readJson(), researchCommand(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (38): ArxivAbstractReader, asArray(), asRecord(), baseReading(), boolOrDefault(), clampInt(), CompositeSourceReadingProvider, createSourceReadingEvidence() (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): asRecord(), assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), createResearchPlan(), listArtifactFiles(), LocalNodeAlphaBackend, nonEmpty() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (27): analyzePriorArtEvidence(), asRecord(), evaluatePublicationPolicy(), exists(), hashPublicationSource(), invalidPriorArtItemReasons(), isPriorArtKind(), isRelevance() (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (16): Builder, DocWriter, Inventor, PriorArtMapper, Publisher, Scout, Skeptic, escapeYaml() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (2): InventionService, nowIso()

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (24): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (11): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.37
Nodes (2): NodeAlphaToolchainManager, withHash()

### Community 15 - "Community 15"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0):

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 16`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `nowIso()` connect `Community 11` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 14`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `executeCli()` connect `Community 4` to `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 11`, `Community 13`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 1` to `Community 0`, `Community 2`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `nowIso()` (e.g. with `.scan()` and `.buildQueue()`) actually correct?**
  _`nowIso()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Are the 28 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Are the 38 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 38 inferred relationships involving `writeJson()` (e.g. with `initConfig()` and `.writeScanArtifacts()`) actually correct?**
  _`writeJson()` has 38 INFERRED edges - model-reasoned connections that need verification._
