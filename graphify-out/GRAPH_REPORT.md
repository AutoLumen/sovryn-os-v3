# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-05)

## Corpus Check
- 147 files · ~535,111 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2448 nodes · 7910 edges · 41 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 1592 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `writeJson()` - 324 edges
2. `nowIso()` - 242 edges
3. `hashEvidence()` - 155 edges
4. `executeCli()` - 123 edges
5. `ScienceService` - 101 edges
6. `LabService` - 88 edges
7. `withEvidenceHash()` - 76 edges
8. `runCommand()` - 66 edges
9. `labCommand()` - 61 edges
10. `scienceCommand()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `replayDiagnosticRepo()` --calls--> `makeTempRepo()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/e2e.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/testkit/temp-repo.ts
- `hashEvidence()` --calls--> `withReadingHash()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/src/core/invention/pipeline.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/core/factory/factory-fixtures.ts
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `createOpenInvention()` --calls--> `makeTempRepo()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/testkit/temp-repo.ts
- `createOpenInvention()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (237): assertRejected(), candidate(), makeResultRoot(), makeTargetCorpusRepo(), policy(), writeCorpusResult(), writeExternalResult(), writeResultFiles() (+229 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (191): writeJson(), scienceCommand(), aggregateMetrics(), analyzeSafety(), assertDatasetCandidateSafe(), assertReproductionPlanRunnable(), assertSafeScope(), average() (+183 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (75): configPath(), ensureGitignore(), initConfig(), readText(), createStore(), discoverVerifyCommands(), exists(), readPackageJson() (+67 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (62): labCommand(), analysisOperations(), auditText(), buildCapabilityEdges(), buildSafetyScope(), candidateInstruments(), candidatePackages(), capabilitySet() (+54 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (70): factorySourceReadingFixtures(), patentSourceReadingFixture(), withReadingHash(), ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt() (+62 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (64): averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore(), buildFactorySourceReadings() (+56 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (47): pilotCommand(), workerCommand(), AutonomyCampaignService, autonomyRef(), benchmarkRef(), buildHumanReviewChecklist(), clampInt(), CorpusDiscoveryService (+39 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (65): number(), arrayOfLaunchLimitations(), buildE2EScorecard(), buildLaunchLimitations(), buildReplayContract(), buildReplayDiagnostics(), check(), clampInt() (+57 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (88): average(), booleanEvidencePassed(), buildPublicCorpusModel(), buildResultGraph(), buildScientificMemorySummary(), buildSearchIndex(), buildVersionGroups(), compareShowcaseCandidates() (+80 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (41): commandSummary(), containerValidationTest(), energyAuditorPython(), energyAuditorTestsPython(), energyDataset(), EnergyRecordAuditorResearchService, renderClaimFeatureMatrix(), renderCounterEvidence() (+33 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (43): auditRef(), AuditService, countKind(), errorMessage(), fileNameFindings(), gate(), hasKind(), listFiles() (+35 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (39): analyzePublicResultQuality(), average(), buildReadabilityReport(), clampScore(), collectTextFiles(), fileText(), finding(), listFiles() (+31 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (47): appendLedger(), applyStagedCorpus(), autopublishRef(), average(), boolOrDefault(), candidateStatus(), clampInt(), copyExistingCorpusForStaging() (+39 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (32): loadConfig(), factoryPriorArtFixtures(), readJson(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking() (+24 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (28): appendFactoryCandidateDocs(), writeCandidatePrototype(), assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence() (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (31): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (50): concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent(), hashesBound() (+42 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (25): ChemistryRecordAuditorResearchService, commandSummary(), containerNetoffValidationTest(), fixturePint(), happyDataset(), malformedRecord(), matrixRow(), pythonAuditorSource() (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (23): asRecord(), assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), createResearchPlan(), listArtifactFiles(), LocalNodeAlphaBackend, nonEmpty() (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (17): detectDomain(), DiscoveryService, exists(), gate(), publicDisclaimer(), renderBreakthroughReport(), renderCampaignReport(), renderDiscoveryReport() (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (20): assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb(), errorMessage(), exists() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (29): FailingRealSourceFixtureAdapter, adapterDoctor(), adapterRoot(), boolOrDefault(), buildQualityReport(), buildRateLimitReport(), cacheKeyFor(), cacheRoot() (+21 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (27): assertTargetRepo(), buildChecks(), check(), countBy(), counterEvidenceSummary(), FalsificationService, findOverclaims(), hasBenignCase() (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (15): clampInt(), clampScore(), exists(), gate(), listFiles(), qualityLabelFor(), readReleaseText(), ReleaseCandidateService (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (16): average(), buildTrialGates(), clampInt(), countBy(), gate(), isRecord(), number(), overnightExternalRef() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (8): gate(), hash(), normalizeProgramName(), ProgramOperatorService, renderProgramCard(), renderProgramOperatorReport(), stableId(), withEvidenceHash()

### Community 26 - "Community 26"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (1): run()

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (0):

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0):

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0):

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0):

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0):

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0):

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0):

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0):

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0):

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0):

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0):

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0):

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 29`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `instrument.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `writeJson()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 323 inferred relationships involving `writeJson()` (e.g. with `makeTargetRepo()` and `writeResult()`) actually correct?**
  _`writeJson()` has 323 INFERRED edges - model-reasoned connections that need verification._
- **Are the 241 inferred relationships involving `nowIso()` (e.g. with `.check()` and `.demo()`) actually correct?**
  _`nowIso()` has 241 INFERRED edges - model-reasoned connections that need verification._
- **Are the 153 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 153 INFERRED edges - model-reasoned connections that need verification._
- **Are the 88 inferred relationships involving `executeCli()` (e.g. with `createPublicBetaFixture()` and `createStrictRunWithoutSharedState()`) actually correct?**
  _`executeCli()` has 88 INFERRED edges - model-reasoned connections that need verification._