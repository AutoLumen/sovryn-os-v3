# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 92 files · ~204,838 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1073 nodes · 3054 edges · 23 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 628 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `nowIso()` - 82 edges
2. `writeJson()` - 69 edges
3. `hashEvidence()` - 68 edges
4. `executeCli()` - 61 edges
5. `FactoryService` - 35 edges
6. `runCommand()` - 28 edges
7. `ResearchOpportunityEngine` - 26 edges
8. `InventionService` - 26 edges
9. `evaluateFactoryGates()` - 25 edges
10. `CorpusService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `replacePriorArtEvidence()` --calls--> `hashEvidence()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts
- `replaceSourceReadingsEvidence()` --calls--> `hashEvidence()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts
- `factoryFixtureRun()` --calls--> `makeTempRepo()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-cache.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/testkit/temp-repo.ts
- `factoryFixtureRun()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/research-cache.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (49): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), configExists(), configPath(), ensureGitignore(), initConfig(), loadConfig() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (69): initializedRepo(), corpusFixture(), createCorpusFixture(), readJson(), toAppError(), alpha14Fixture(), createStrictRunWithoutSharedState(), readJson() (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (57): arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore() (+49 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (35): appendFactoryCandidateDocs(), assertFactoryEnabled(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId(), evidenceRefs(), exists() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (41): fetcher(), jsonResponse(), textResponse(), ArxivAbstractReader, asArray(), asRecord(), baseReading(), boolOrDefault() (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): writeEvent(), asRecord(), assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), createResearchPlan(), listArtifactFiles(), LocalNodeAlphaBackend (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (29): readJson(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking(), clampInt(), clampScore() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (28): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (31): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (26): qualityCommand(), boolOrDefault(), buildFactoryFindings(), buildRubric(), clampInt(), clampScore(), collectTextFiles(), dimension() (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (26): auditRef(), AuditService, countKind(), errorMessage(), fileNameFindings(), gate(), hasKind(), listFiles() (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (14): exists(), InventionService, slugify(), titleFromBrief(), escapeYaml(), list(), renderCitation(), renderDefensivePublication() (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (20): assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb(), errorMessage(), exists() (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (18): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (28): adapterDoctor(), adapterRoot(), boolOrDefault(), buildQualityReport(), buildRateLimitReport(), cacheKeyFor(), cacheRoot(), clampInt() (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): createToolchainPlanId(), NodeAlphaToolchainManager, withHash(), doctorResult(), runtimeVersion(), unavailableProfile(), withHash(), workerDoctor() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (13): clampInt(), clampScore(), exists(), gate(), listFiles(), readReleaseText(), ReleaseCandidateService, renderPublicationQueue() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (27): analyzePriorArtEvidence(), asRecord(), evaluatePublicationPolicy(), exists(), hashPublicationSource(), invalidPriorArtItemReasons(), isPriorArtKind(), isRelevance() (+19 more)

### Community 18 - "Community 18"
Cohesion: 0.2
Nodes (24): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+16 more)

### Community 19 - "Community 19"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 20 - "Community 20"
Cohesion: 0.23
Nodes (10): createGitNexusPlugin(), executeGitNexus(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin(), loadPlugins(), pluginConfigPath() (+2 more)

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0):

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 21`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `nowIso()` connect `Community 11` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 12`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `writeJson()` connect `Community 3` to `Community 0`, `Community 2`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 81 inferred relationships involving `nowIso()` (e.g. with `researchCacheStatus()` and `writeReports()`) actually correct?**
  _`nowIso()` has 81 INFERRED edges - model-reasoned connections that need verification._
- **Are the 68 inferred relationships involving `writeJson()` (e.g. with `initConfig()` and `researchCacheStatus()`) actually correct?**
  _`writeJson()` has 68 INFERRED edges - model-reasoned connections that need verification._
- **Are the 66 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 66 INFERRED edges - model-reasoned connections that need verification._
- **Are the 39 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 39 INFERRED edges - model-reasoned connections that need verification._