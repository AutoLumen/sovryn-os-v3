# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 69 files · ~126,574 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 716 nodes · 1924 edges · 19 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 393 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `nowIso()` - 42 edges
2. `executeCli()` - 41 edges
3. `hashEvidence()` - 37 edges
4. `writeJson()` - 36 edges
5. `FactoryService` - 35 edges
6. `runCommand()` - 27 edges
7. `InventionService` - 26 edges
8. `evaluateFactoryGates()` - 25 edges
9. `ResearchOpportunityEngine` - 24 edges
10. `MissionService` - 18 edges

## Surprising Connections (you probably didn't know these)
- `hashEvidence()` --calls--> `withReadingHash()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/factory/factory-fixtures.ts
- `appendLesson()` --calls--> `redactSecrets()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/memory/memory.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/shared/redaction.ts
- `scan()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-opportunity.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `queueBuild()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-opportunity.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `queueRun()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-opportunity.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (39): looksLikeNetworkCommand(), networkDenyEnv(), configPath(), ensureGitignore(), initConfig(), readText(), discoverVerifyCommands(), exists() (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (25): runCommand(), createStore(), assertSandboxCommandAllowed(), FileStore, countLines(), GitAdapter, listFiles(), numstat() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (44): factorySourceReadingFixtures(), patentSourceReadingFixture(), withReadingHash(), fetcher(), jsonResponse(), textResponse(), ArxivAbstractReader, asArray() (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (31): appendFactoryCandidateDocs(), assertFactoryEnabled(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId(), evidenceRefs(), exists() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (33): loadConfig(), factoryPriorArtFixtures(), readJson(), researchCommand(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity() (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (43): configExists(), toAppError(), alpha14Fixture(), createStrictRunWithoutSharedState(), readJson(), createGitNexusPlugin(), doctor(), ensureInitialized() (+35 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (27): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (41): arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore(), buildFactorySourceReadings() (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (9): assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), LocalNodeAlphaBackend, shellQuote(), backendForHost(), NodeManager, assertNodeCapability() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (6): writeCandidatePrototype(), writeJson(), InventionService, writeArtifactIndex(), writePhaseEvidence(), nowIso()

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (27): analyzePriorArtEvidence(), asRecord(), evaluatePublicationPolicy(), exists(), hashPublicationSource(), invalidPriorArtItemReasons(), isPriorArtKind(), isRelevance() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (24): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (13): createFactoryRun(), findGeneratedInvention(), priorArt(), readJson(), scoreInput(), inferTechnicalDomain(), normalizeGoal(), ResearchPlanBuilder (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (11): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 15 - "Community 15"
Cohesion: 0.35
Nodes (9): escapeYaml(), list(), renderCitation(), renderDefensivePublication(), renderNoveltyNotes(), renderPriorArt(), renderReadme(), renderSafetyReview() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (10): currentValidApprovals(), evaluatePolicy(), listFiles(), looksText(), riskForFiles(), riskForPath(), riskRank(), scanChangedFileContents() (+2 more)

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0):

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 17`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `nowIso()` connect `Community 9` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 8`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `executeCli()` connect `Community 5` to `Community 1`, `Community 3`, `Community 4`, `Community 9`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 7` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 9`, `Community 10`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 41 inferred relationships involving `nowIso()` (e.g. with `.scan()` and `.buildQueue()`) actually correct?**
  _`nowIso()` has 41 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createOpenInvention()`) actually correct?**
  _`executeCli()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 35 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 35 inferred relationships involving `writeJson()` (e.g. with `initConfig()` and `.writeScanArtifacts()`) actually correct?**
  _`writeJson()` has 35 INFERRED edges - model-reasoned connections that need verification._
