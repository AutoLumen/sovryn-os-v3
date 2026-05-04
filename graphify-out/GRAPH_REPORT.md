# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 113 files · ~351,243 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1721 nodes · 5263 edges · 26 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 1099 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `writeJson()` - 183 edges
2. `nowIso()` - 144 edges
3. `hashEvidence()` - 124 edges
4. `executeCli()` - 85 edges
5. `runCommand()` - 51 edges
6. `FactoryService` - 35 edges
7. `makeTempRepo()` - 35 edges
8. `readJson()` - 32 edges
9. `withHash()` - 31 edges
10. `E2EService` - 28 edges

## Surprising Connections (you probably didn't know these)
- `readAllText()` --calls--> `runCommand()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/external-research.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/adapters/shell/command.ts
- `hashEvidence()` --calls--> `withReadingHash()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/factory/factory-fixtures.ts
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `replacePriorArtEvidence()` --calls--> `hashEvidence()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts
- `replaceSourceReadingsEvidence()` --calls--> `hashEvidence()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (120): initializedRepo(), createOperationsFixture(), createPilotAllFixture(), must(), operationsFixture(), pilotAllFixture(), betaFixture(), createBetaFixture() (+112 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (69): configPath(), ensureGitignore(), initConfig(), loadConfig(), readText(), assertRejected(), autopublishFixture(), candidate() (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (70): factorySourceReadingFixtures(), patentSourceReadingFixture(), withReadingHash(), ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt() (+62 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (49): writeJson(), pilotCommand(), workerCommand(), writeArtifactIndex(), AutonomyCampaignService, autonomyRef(), benchmarkRef(), buildHumanReviewChecklist() (+41 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (46): looksLikeNetworkCommand(), networkDenyEnv(), runCommand(), createStore(), writeEvent(), assertSandboxCommandAllowed(), FileStore, countLines() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (58): averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore(), buildFactorySourceReadings() (+50 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (60): arrayOfLaunchLimitations(), buildE2EScorecard(), buildLaunchLimitations(), buildReplayContract(), buildReplayDiagnostics(), check(), clampInt(), collectIds() (+52 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (41): appendFactoryCandidateDocs(), assertFactoryEnabled(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId(), evidenceRefs(), exists() (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (56): assertRejected(), candidate(), makeResultRoot(), makeTargetCorpusRepo(), policy(), writeCorpusResult(), writeExternalResult(), writeResultFiles() (+48 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (42): campaignGates(), clampInt(), countKinds(), FailingRealSourceFixtureAdapter, fixtureConcreteSources(), fixtureFallbackSources(), numberValue(), RealSourceExternalCampaignService (+34 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (39): analyzePublicResultQuality(), average(), buildReadabilityReport(), clampScore(), collectTextFiles(), fileText(), finding(), listFiles() (+31 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (50): average(), booleanEvidencePassed(), buildPublicCorpusModel(), buildResultGraph(), buildSearchIndex(), buildVersionGroups(), compareShowcaseCandidates(), compareVersionedResults() (+42 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (32): readReleaseReview(), factoryPriorArtFixtures(), readJson(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking() (+24 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (31): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+23 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (51): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+43 more)

### Community 15 - "Community 15"
Cohesion: 0.1
Nodes (23): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (25): ChemistryRecordAuditorResearchService, commandSummary(), containerNetoffValidationTest(), fixturePint(), happyDataset(), malformedRecord(), matrixRow(), pythonAuditorSource() (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (28): auditRef(), AuditService, countKind(), errorMessage(), fileNameFindings(), gate(), hasKind(), listFiles() (+20 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (20): assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb(), errorMessage(), exists() (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (16): commandSummary(), containerValidationTest(), energyAuditorPython(), energyAuditorTestsPython(), energyDataset(), EnergyRecordAuditorResearchService, renderClaimFeatureMatrix(), renderCounterEvidence() (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (7): commandOutput(), LocalNodeAlphaBackend, shellQuote(), backendForHost(), NodeManager, assertNodeCapability(), assertNodeCommandAllowed()

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (18): configExists(), MultiDomainExternalCampaignService, readPilot(), renderReport(), average(), buildTrialGates(), clampInt(), countBy() (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (15): betaGate(), betaRef(), BetaService, clampInt(), copyJsonSummary(), countSourceTests(), docsStatus(), exists() (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0):

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 24`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `writeJson()` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 182 inferred relationships involving `writeJson()` (e.g. with `makeTargetRepo()` and `writePilotFixture()`) actually correct?**
  _`writeJson()` has 182 INFERRED edges - model-reasoned connections that need verification._
- **Are the 143 inferred relationships involving `nowIso()` (e.g. with `.check()` and `.demo()`) actually correct?**
  _`nowIso()` has 143 INFERRED edges - model-reasoned connections that need verification._
- **Are the 122 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 122 INFERRED edges - model-reasoned connections that need verification._
- **Are the 55 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 55 INFERRED edges - model-reasoned connections that need verification._