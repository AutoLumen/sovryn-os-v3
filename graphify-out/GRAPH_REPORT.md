# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 99 files · ~262,336 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1331 nodes · 3996 edges · 24 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 827 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `nowIso()` - 121 edges
2. `writeJson()` - 111 edges
3. `hashEvidence()` - 77 edges
4. `executeCli()` - 72 edges
5. `FactoryService` - 35 edges
6. `withHash()` - 31 edges
7. `E2EService` - 28 edges
8. `runCommand()` - 28 edges
9. `readJson()` - 27 edges
10. `ResearchOpportunityEngine` - 26 edges

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
Cohesion: 0.05
Nodes (47): check(), benchmarkCommand(), betaCommand(), launchCommand(), pilotCommand(), publicationCommand(), workerCommand(), AutonomyCampaignService (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (47): configPath(), ensureGitignore(), initConfig(), readText(), discoverVerifyCommands(), exists(), readPackageJson(), AppError (+39 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (50): initializedRepo(), createOperationsFixture(), createPilotAllFixture(), must(), operationsFixture(), pilotAllFixture(), betaFixture(), createBetaFixture() (+42 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (38): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), createStore(), FileStore, countLines(), GitAdapter, listFiles() (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (60): arrayOfLaunchLimitations(), buildE2EScorecard(), buildLaunchLimitations(), buildReplayContract(), buildReplayDiagnostics(), check(), clampInt(), collectIds() (+52 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (48): factoryPriorArtFixtures(), factorySourceReadingFixtures(), patentSourceReadingFixture(), withReadingHash(), appendFactoryCandidateDocs(), assertFactoryEnabled(), assertSandboxCommandAllowed(), boolOrDefault() (+40 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (54): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+46 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (55): arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore() (+47 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (41): fetcher(), jsonResponse(), textResponse(), ArxivAbstractReader, asArray(), asRecord(), baseReading(), boolOrDefault() (+33 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (31): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (31): loadConfig(), readJson(), researchCommand(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking() (+23 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (33): configExists(), FakeRunner, autonomyCommand(), createGitNexusPlugin(), doctor(), e2eCommand(), ensureInitialized(), flagBool() (+25 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (29): auditRef(), AuditService, countKind(), errorMessage(), fileNameFindings(), gate(), hasKind(), listFiles() (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (26): qualityCommand(), boolOrDefault(), buildFactoryFindings(), buildRubric(), clampInt(), clampScore(), collectTextFiles(), dimension() (+18 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (17): exists(), InventionService, slugify(), titleFromBrief(), phaseEvidenceFileName(), writePhaseEvidence(), MockPriorArtSearchAdapter, priorArtResultsToMatrix() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (23): writeEvent(), okEnvelope(), assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb() (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (15): clampInt(), clampScore(), exists(), gate(), listFiles(), qualityLabelFor(), readReleaseText(), ReleaseCandidateService (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (27): analyzePriorArtEvidence(), asRecord(), evaluatePublicationPolicy(), exists(), hashPublicationSource(), invalidPriorArtItemReasons(), isPriorArtKind(), isRelevance() (+19 more)

### Community 18 - "Community 18"
Cohesion: 0.2
Nodes (16): betaGate(), betaRef(), BetaService, clampInt(), copyJsonSummary(), countSourceTests(), docsStatus(), exists() (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (23): concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent(), hashesBound() (+15 more)

### Community 20 - "Community 20"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 21 - "Community 21"
Cohesion: 0.31
Nodes (10): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+2 more)

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0):

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 22`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `nowIso()` connect `Community 15` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 18`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `writeJson()` connect `Community 5` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 18`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 7` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 120 inferred relationships involving `nowIso()` (e.g. with `.check()` and `.demo()`) actually correct?**
  _`nowIso()` has 120 INFERRED edges - model-reasoned connections that need verification._
- **Are the 110 inferred relationships involving `writeJson()` (e.g. with `initConfig()` and `.check()`) actually correct?**
  _`writeJson()` has 110 INFERRED edges - model-reasoned connections that need verification._
- **Are the 75 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 75 INFERRED edges - model-reasoned connections that need verification._
- **Are the 43 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 43 INFERRED edges - model-reasoned connections that need verification._
