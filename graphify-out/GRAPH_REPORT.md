# Graph Report - /Users/sovryn/Desktop/sovryn-os-v3  (2026-05-04)

## Corpus Check
- 113 files · ~359,222 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1745 nodes · 5320 edges · 24 communities detected
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
Cohesion: 0.02
Nodes (141): assertRejected(), candidate(), makeResultRoot(), makeTargetCorpusRepo(), policy(), writeCorpusResult(), writeExternalResult(), writeResultFiles() (+133 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (102): analyzePublicResultQuality(), average(), buildReadabilityReport(), clampScore(), collectTextFiles(), fileText(), finding(), listFiles() (+94 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (67): arrayOfRecords(), averageEvidenceStrength(), buildBenchmarkPlan(), buildCandidateInventions(), buildClaimElementMap(), buildCounterEvidence(), buildExperimentPlan(), buildFactoryScore() (+59 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (44): benchmarkCommand(), pilotCommand(), workerCommand(), AutonomyCampaignService, autonomyRef(), benchmarkRef(), buildHumanReviewChecklist(), clampInt() (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (60): arrayOfLaunchLimitations(), buildE2EScorecard(), buildLaunchLimitations(), buildReplayContract(), buildReplayDiagnostics(), check(), clampInt(), collectIds() (+52 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (54): loadConfig(), factoryPriorArtFixtures(), readJson(), researchCommand(), assertOpportunityEngineEnabled(), baseSignals(), boolOrDefault(), buildOpportunity() (+46 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (74): average(), booleanEvidencePassed(), buildPublicCorpusModel(), buildResultGraph(), buildSearchIndex(), buildVersionGroups(), compareShowcaseCandidates(), compareVersionedResults() (+66 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (42): ChemistryRecordAuditorResearchService, commandSummary(), containerNetoffValidationTest(), fixturePint(), happyDataset(), malformedRecord(), matrixRow(), pythonAuditorSource() (+34 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (43): appendFactoryCandidateDocs(), assertFactoryEnabled(), boolOrDefault(), clampInt(), copyIfExists(), createFactoryId(), evidenceRefs(), exists() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (56): assertRejected(), autopublishFixture(), candidate(), createAutopublishFixture(), gitStdout(), makeTargetRepo(), policy(), writePilotFixture() (+48 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (45): auditRef(), AuditService, countKind(), errorMessage(), fileNameFindings(), gate(), hasKind(), listFiles() (+37 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (39): createFactoryRun(), findGeneratedInvention(), priorArt(), readJson(), scoreInput(), ArxivSearchAdapter, asArray(), asRecord() (+31 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (44): factorySourceReadingFixtures(), patentSourceReadingFixture(), withReadingHash(), fetcher(), jsonResponse(), textResponse(), ArxivAbstractReader, asArray() (+36 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (31): arrayOfStrings(), buildCorpusGraph(), buildDuplicateMap(), buildQualityReport(), comparableTokens(), corpusGate(), CorpusService, exists() (+23 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (25): assertGitHubTargetSafe(), buildGhRepoCreateCommand(), copyIfExists(), exists(), GitHubPublisher, preparePublicEvidence(), writeFinalVerifySummary(), writePublicSourceSearchSummary() (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (51): check(), concreteSourceTypesRead(), directorySize(), evaluateFactoryGates(), evidenceHashValid(), exists(), findMissionById(), generatedSafetyReviewsPresent() (+43 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (20): assertOvernightEnabled(), boolOrDefault(), clampInt(), createRunId(), createStableId(), directorySizeMb(), errorMessage(), exists() (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (16): commandSummary(), containerValidationTest(), energyAuditorPython(), energyAuditorTestsPython(), energyDataset(), EnergyRecordAuditorResearchService, renderClaimFeatureMatrix(), renderCounterEvidence() (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (11): assertSandboxLocalCommandAllowed(), commandOutput(), copyIfExists(), listArtifactFiles(), LocalNodeAlphaBackend, shellQuote(), writeArtifactIndex(), backendForHost() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (14): average(), buildTrialGates(), clampInt(), countBy(), gate(), number(), overnightExternalRef(), OvernightExternalTrialService (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (11): createGitNexusPlugin(), executeGitNexus(), pluginCommand(), unavailable(), loadBuiltinPlugins(), loadConfiguredPlugins(), loadPlugin(), loadPlugins() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.28
Nodes (1): PostgresStore

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

- **Why does `writeJson()` connect `Community 7` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `nowIso()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `hashEvidence()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 182 inferred relationships involving `writeJson()` (e.g. with `makeTargetRepo()` and `writePilotFixture()`) actually correct?**
  _`writeJson()` has 182 INFERRED edges - model-reasoned connections that need verification._
- **Are the 143 inferred relationships involving `nowIso()` (e.g. with `.check()` and `.demo()`) actually correct?**
  _`nowIso()` has 143 INFERRED edges - model-reasoned connections that need verification._
- **Are the 122 inferred relationships involving `hashEvidence()` (e.g. with `replacePriorArtEvidence()` and `replaceSourceReadingsEvidence()`) actually correct?**
  _`hashEvidence()` has 122 INFERRED edges - model-reasoned connections that need verification._
- **Are the 55 inferred relationships involving `executeCli()` (e.g. with `createStrictRunWithoutSharedState()` and `createToolchainFixture()`) actually correct?**
  _`executeCli()` has 55 INFERRED edges - model-reasoned connections that need verification._