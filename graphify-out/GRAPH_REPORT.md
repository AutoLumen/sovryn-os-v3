# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 89 files · ~195,394 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1020 nodes · 2870 edges · 22 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 596 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `nowIso()` - 75 edges
2. `hashEvidence()` - 67 edges
3. `writeJson()` - 62 edges
4. `executeCli()` - 57 edges
5. `FactoryService` - 35 edges
6. `runCommand()` - 28 edges
7. `ResearchOpportunityEngine` - 26 edges
8. `InventionService` - 26 edges
9. `evaluateFactoryGates()` - 25 edges
10. `CorpusService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `hashEvidence()` --calls--> `withReadingHash()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/factory/factory-fixtures.ts
- `createStrictRunWithoutSharedState()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/factory-alpha14.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `createToolchainFixture()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `createOpenInvention()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (48): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), configExists(), configPath(), ensureGitignore(), initConfig(), readText() (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (72): averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore(), buildFactorySourceReadings() (+64 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (36): toAppError(), exists(), FactoryService, hashObject(), doctor(), ensureInitialized(), executeCli(), factoryCommand() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (42): corpusFixture(), createCorpusFixture(), readJson(), alpha14Fixture(), createStrictRunWithoutSharedState(), readJson(), alpha18Fixture(), createAlpha18Run() (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (44): factorySourceReadingFixtures(), patentSourceReadingFixture(), withReadingHash(), fetcher(), jsonResponse(), textResponse(), ArxivAbstractReader, asArray() (+36 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (32): loadConfig(), factoryPriorArtFixtures(), readJson(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking() (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (31): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (27): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (23): asRecord(), assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), createResearchPlan(), listArtifactFiles(), LocalNodeAlphaBackend, nonEmpty() (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (25): writeCandidatePrototype(), writeJson(), InventionService, writePhaseEvidence(), adapterDoctor(), adapterRoot(), boolOrDefault(), buildQualityReport() (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (30): writeEvent(), arrayOfRecords(), buildFactoryMode(), dedupeFeatures(), extractFeatures(), extractNoveltyGaps(), generateCandidates(), hashObject() (+22 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (26): qualityCommand(), boolOrDefault(), buildFactoryFindings(), buildRubric(), clampInt(), clampScore(), collectTextFiles(), dimension() (+18 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (20): assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb(), errorMessage(), exists() (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (14): createToolchainPlanId(), NodeAlphaToolchainManager, withHash(), doctorResult(), runtimeVersion(), unavailableProfile(), withHash(), workerDoctor() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (27): analyzePriorArtEvidence(), asRecord(), evaluatePublicationPolicy(), exists(), hashPublicationSource(), invalidPriorArtItemReasons(), isPriorArtKind(), isRelevance() (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (13): clampInt(), clampScore(), exists(), gate(), listFiles(), readReleaseText(), ReleaseCandidateService, renderPublicationQueue() (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.2
Nodes (24): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (11): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (10): createGitNexusPlugin(), executeGitNexus(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin(), loadPlugins(), pluginConfigPath() (+2 more)

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0):

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 20`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `nowIso()` connect `Community 9` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `executeCli()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 6`, `Community 9`, `Community 11`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 74 inferred relationships involving `nowIso()` (e.g. with `researchCacheStatus()` and `writeReports()`) actually correct?**
  _`nowIso()` has 74 INFERRED edges - model-reasoned connections that need verification._
- **Are the 65 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 65 INFERRED edges - model-reasoned connections that need verification._
- **Are the 61 inferred relationships involving `writeJson()` (e.g. with `initConfig()` and `researchCacheStatus()`) actually correct?**
  _`writeJson()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Are the 38 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 38 INFERRED edges - model-reasoned connections that need verification._