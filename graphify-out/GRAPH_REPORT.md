# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 120 files · ~385,471 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1867 nodes · 5692 edges · 28 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 1173 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `writeJson()` - 194 edges
2. `nowIso()` - 153 edges
3. `hashEvidence()` - 129 edges
4. `executeCli()` - 99 edges
5. `runCommand()` - 61 edges
6. `makeTempRepo()` - 41 edges
7. `FactoryService` - 35 edges
8. `readJson()` - 32 edges
9. `withHash()` - 31 edges
10. `E2EService` - 28 edges

## Surprising Connections (you probably didn't know these)
- `createStrictRunWithoutSharedState()` --calls--> `makeTempRepo()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/factory-alpha14.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/testkit/temp-repo.ts
- `createStrictRunWithoutSharedState()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/factory-alpha14.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `installToolchain()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/node-toolchain.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts
- `createOpenInvention()` --calls--> `makeTempRepo()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/testkit/temp-repo.ts
- `createOpenInvention()` --calls--> `executeCli()`  [INFERRED]
  /Users/sovryn/Desktop/sovryn-os-v3/tests/open-invention.test.ts → /Users/sovryn/Desktop/sovryn-os-v3/src/cli/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (148): assertRejected(), candidate(), makeResultRoot(), makeTargetCorpusRepo(), policy(), writeCorpusResult(), writeExternalResult(), writeResultFiles() (+140 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (59): configExists(), configPath(), ensureGitignore(), initConfig(), loadConfig(), readText(), createStore(), discoverVerifyCommands() (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (67): ArxivSearchAdapter, asArray(), asRecord(), boolOrDefault(), clampInt(), CompositePriorArtSearchAdapter, createPriorArtSearchAdapter(), createPublicSourceSearchAdapter() (+59 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (74): alpha14Fixture(), createStrictRunWithoutSharedState(), readJson(), arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap() (+66 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (40): pilotCommand(), workerCommand(), AutonomyCampaignService, autonomyRef(), benchmarkRef(), buildHumanReviewChecklist(), ensureInitialized(), exists() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (59): arrayOfLaunchLimitations(), buildE2EScorecard(), buildLaunchLimitations(), buildReplayContract(), buildReplayDiagnostics(), check(), collectIds(), collectRecords() (+51 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (76): average(), booleanEvidencePassed(), buildPublicCorpusModel(), buildResultGraph(), buildSearchIndex(), buildVersionGroups(), compareShowcaseCandidates(), compareVersionedResults() (+68 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (38): ChemistryRecordAuditorResearchService, commandSummary(), containerNetoffValidationTest(), fixturePint(), happyDataset(), malformedRecord(), matrixRow(), pythonAuditorSource() (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (38): toAppError(), writeEvent(), appendFactoryCandidateDocs(), writeCandidatePrototype(), assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists() (+30 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (40): phase(), assertFactoryEnabled(), assertSandboxCommandAllowed(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId(), evidenceRefs() (+32 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (44): auditRef(), AuditService, countKind(), errorMessage(), fileNameFindings(), gate(), hasKind(), listFiles() (+36 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (50): appendLedger(), applyStagedCorpus(), autopublishRef(), average(), boolOrDefault(), candidateStatus(), clampInt(), copyExistingCorpusForStaging() (+42 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (32): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+24 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (39): analyzePublicResultQuality(), average(), buildReadabilityReport(), clampScore(), collectTextFiles(), fileText(), finding(), listFiles() (+31 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (31): factoryPriorArtFixtures(), readJson(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity(), buildRanking(), clampInt() (+23 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (23): asRecord(), assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), createResearchPlan(), listArtifactFiles(), LocalNodeAlphaBackend, nonEmpty() (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (50): concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent(), hashesBound() (+42 more)

### Community 17 - "Community 17"
Cohesion: 0.1
Nodes (25): createTemporaryCorpusRepo(), createTemporarySovrynRepo(), docsStatus(), exists(), gate(), productRoot(), publicBetaRef(), PublicBetaService (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (25): analyzeSafety(), assertSafeScope(), buildPrimaryHypothesis(), buildReviewGates(), buildRobustnessHypothesis(), containsUnsafeText(), containsUnsupportedClaimLanguage(), gate() (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (20): assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb(), errorMessage(), exists() (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (16): commandSummary(), containerValidationTest(), energyAuditorPython(), energyAuditorTestsPython(), energyDataset(), EnergyRecordAuditorResearchService, renderClaimFeatureMatrix(), renderCounterEvidence() (+8 more)

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
Cohesion: 0.17
Nodes (16): average(), buildTrialGates(), clampInt(), countBy(), gate(), isRecord(), number(), overnightExternalRef() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.28
Nodes (1): PostgresStore

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0):

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 26`** (2 nodes): `describeOpenInvention()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `prototype.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `writeJson()` connect `Community 7` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 8` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 193 inferred relationships involving `writeJson()` (e.g. with `makeTargetRepo()` and `writeResult()`) actually correct?**
  _`writeJson()` has 193 INFERRED edges - model-reasoned connections that need verification._
- **Are the 152 inferred relationships involving `nowIso()` (e.g. with `.check()` and `.demo()`) actually correct?**
  _`nowIso()` has 152 INFERRED edges - model-reasoned connections that need verification._
- **Are the 127 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 127 INFERRED edges - model-reasoned connections that need verification._
- **Are the 66 inferred relationships involving `executeCli()` (e.g. with `createPublicBetaFixture()` and `createStrictRunWithoutSharedState()`) actually correct?**
  _`executeCli()` has 66 INFERRED edges - model-reasoned connections that need verification._