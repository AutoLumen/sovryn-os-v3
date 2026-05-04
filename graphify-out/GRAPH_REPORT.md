# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 76 files · ~152,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 806 nodes · 2190 edges · 20 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 459 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `nowIso()` - 55 edges
2. `hashEvidence()` - 50 edges
3. `executeCli()` - 46 edges
4. `writeJson()` - 43 edges
5. `FactoryService` - 35 edges
6. `runCommand()` - 28 edges
7. `InventionService` - 26 edges
8. `evaluateFactoryGates()` - 25 edges
9. `ResearchOpportunityEngine` - 24 edges
10. `MissionService` - 18 edges

## Surprising Connections (you probably didn't know these)
- `hashEvidence()` --calls--> `withReadingHash()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/factory/factory-fixtures.ts
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `replacePriorArtEvidence()` --calls--> `hashEvidence()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts
- `replaceSourceReadingsEvidence()` --calls--> `hashEvidence()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts
- `factoryFixtureRun()` --calls--> `makeTempRepo()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-cache.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/testkit/temp-repo.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (40): configPath(), ensureGitignore(), initConfig(), readText(), discoverVerifyCommands(), exists(), readPackageJson(), AppError (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (52): configExists(), toAppError(), alpha14Fixture(), createStrictRunWithoutSharedState(), readJson(), alpha18Fixture(), createAlpha18Run(), readJson() (+44 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (37): buildCounterEvidence(), buildQuestionMap(), appendFactoryCandidateDocs(), assertFactoryEnabled(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId() (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (50): arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildExperimentPlan(), buildFactoryScore(), buildFactorySourceReadings() (+42 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (22): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), createStore(), FileStore, countLines(), GitAdapter, listFiles() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (41): fetcher(), jsonResponse(), textResponse(), ArxivAbstractReader, asArray(), asRecord(), baseReading(), boolOrDefault() (+33 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (28): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (31): loadConfig(), readJson(), researchCommand(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking() (+23 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (11): assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), listArtifactFiles(), LocalNodeAlphaBackend, shellQuote(), writeArtifactIndex(), backendForHost() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (28): adapterDoctor(), adapterRoot(), boolOrDefault(), buildQualityReport(), buildRateLimitReport(), cacheKeyFor(), cacheRoot(), clampInt() (+20 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (7): exists(), InventionService, slugify(), titleFromBrief(), phaseEvidenceFileName(), writePhaseEvidence(), nowIso()

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (27): analyzePriorArtEvidence(), asRecord(), evaluatePublicationPolicy(), exists(), hashPublicationSource(), invalidPriorArtItemReasons(), isPriorArtKind(), isRelevance() (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (13): NodeAlphaToolchainManager, withHash(), doctorResult(), runtimeVersion(), unavailableProfile(), withHash(), workerDoctor(), workerDoctorAll() (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (24): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (14): writeEvent(), assertSandboxCommandAllowed(), createGitNexusPlugin(), executeGitNexus(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin() (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (11): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 17 - "Community 17"
Cohesion: 0.35
Nodes (9): escapeYaml(), list(), renderCitation(), renderDefensivePublication(), renderNoveltyNotes(), renderPriorArt(), renderReadme(), renderSafetyReview() (+1 more)

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0):

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 18`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `nowIso()` connect `Community 10` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `executeCli()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 9`, `Community 10`, `Community 15`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `nowIso()` (e.g. with `researchCacheStatus()` and `writeReports()`) actually correct?**
  _`nowIso()` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 48 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 42 inferred relationships involving `writeJson()` (e.g. with `initConfig()` and `researchCacheStatus()`) actually correct?**
  _`writeJson()` has 42 INFERRED edges - model-reasoned connections that need verification._