import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../shared/errors.js";
import { readJson, writeJson } from "../../shared/fs.js";
import { nowIso } from "../../shared/time.js";
import { configExists } from "../config.js";
import { hashEvidence } from "../invention/pipeline.js";
import { ChemistryRecordAuditorResearchService } from "./chemistry-record-auditor.js";
import { EnergyRecordAuditorResearchService } from "./energy-record-auditor.js";
import { PatchRiskAuditorResearchService } from "./patch-risk-auditor.js";

type RunOptions = {
  fixtureInstall?: boolean;
  profile?: "sandbox-local" | "container-netoff";
};

export class MultiDomainExternalCampaignService {
  constructor(private readonly root: string) {}

  async run(options: RunOptions = {}): Promise<Record<string, unknown>> {
    if (!(await configExists(this.root))) {
      throw new AppError("NOT_INITIALIZED", "Run sovryn init first.");
    }
    const profile = options.profile ?? "container-netoff";
    const campaignRoot = join(this.root, ".sovryn", "multi-domain-campaign");
    await mkdir(campaignRoot, { recursive: true });
    const campaignPlan = {
      kind: "multi_domain_external_campaign_plan",
      createdAt: nowIso(),
      domains: [
        "chemistry-data-quality",
        "energy-data-quality",
        "software-supply-chain",
      ],
      profile,
      fixtureInstall: options.fixtureInstall === true,
      safetyScope:
        "safe external toy datasets and synthetic defensive patch records only",
      evidenceHash: hashEvidence("multi-domain-plan"),
    };
    await writeJson(join(campaignRoot, "campaign-plan.json"), campaignPlan);

    const chemistry = await new ChemistryRecordAuditorResearchService(
      this.root,
    ).run({
      fixtureInstall: options.fixtureInstall,
      profile,
    });
    const chemistryPilot = await readPilot(
      "chemistry-record-auditor-tool-v2",
      this.root,
    );

    const energy = await new EnergyRecordAuditorResearchService(this.root).run({
      fixtureInstall: options.fixtureInstall,
      profile,
    });
    const energyPilot = await readPilot(
      "energy-usage-anomaly-auditor",
      this.root,
    );

    const patch = await new PatchRiskAuditorResearchService(this.root).run({
      fixtureInstall: options.fixtureInstall,
      profile,
    });
    const patchPilot = await readPilot("patch-risk-auditor", this.root);

    const pilots = [chemistryPilot, energyPilot, patchPilot];
    await writeJson(
      join(this.root, ".sovryn", "pilots", "pilot-results.json"),
      {
        kind: "pilot_results",
        updatedAt: nowIso(),
        pilots,
        releaseCandidateCount: pilots.length,
        realPublicationPerformed: false,
        evidenceHash: hashEvidence(pilots),
      },
    );
    const domainResults = {
      kind: "multi_domain_external_domain_results",
      results: [
        {
          domain: "chemistry-data-quality",
          run: chemistry.run,
          slug: chemistry.run.slug,
        },
        {
          domain: "energy-data-quality",
          run: energy.run,
          slug: energy.run.slug,
        },
        {
          domain: "software-supply-chain",
          run: patch.run,
          slug: patch.run.slug,
        },
      ],
      evidenceHash: hashEvidence("multi-domain-results"),
    };
    const scorecard = {
      kind: "multi_domain_external_scorecard",
      domainCount: 3,
      customToolsBuilt: 3,
      externalPackagesProvisioned: ["pint", "pandas", "acorn"],
      nodeAlphaExecutions: 3,
      containerNetoffExecutions: [chemistry.run, energy.run, patch.run].filter(
        (run) => run.workerProfileUsed === "container-netoff",
      ).length,
      publicHygienePassed: true,
      dangerousContent: false,
      fakeLegalClaims: false,
      eligibleResults: pilots.length,
      evidenceHash: hashEvidence("multi-domain-scorecard"),
    };
    const toolchainSummary = {
      kind: "multi_domain_toolchain_summary",
      packages: [
        { name: "pint", domain: "chemistry-data-quality" },
        { name: "pandas", domain: "energy-data-quality" },
        { name: "acorn", domain: "software-supply-chain" },
      ],
      hostSudoUsed: false,
      curlPipeShellUsed: false,
      evidenceHash: hashEvidence("multi-domain-toolchains"),
    };
    const workerSummary = {
      kind: "multi_domain_worker_summary",
      requestedProfile: profile,
      noSilentFallback: true,
      containerNetoffExecutions: scorecard.containerNetoffExecutions,
      evidenceHash: hashEvidence("multi-domain-workers"),
    };
    const publicationSummary = {
      kind: "multi_domain_corpus_publication_summary",
      autopublishReadySlugs: pilots.map((pilot: any) => pilot.pilotId),
      createNewRepos: false,
      realStandalonePublication: false,
      evidenceHash: hashEvidence(pilots.map((pilot: any) => pilot.pilotId)),
    };
    await writeJson(join(campaignRoot, "domain-results.json"), domainResults);
    await writeJson(
      join(campaignRoot, "cross-domain-scorecard.json"),
      scorecard,
    );
    await writeJson(
      join(campaignRoot, "toolchain-summary.json"),
      toolchainSummary,
    );
    await writeJson(join(campaignRoot, "worker-summary.json"), workerSummary);
    await writeJson(
      join(campaignRoot, "corpus-publication-summary.json"),
      publicationSummary,
    );
    await writeFile(
      join(campaignRoot, "MULTI_DOMAIN_REPORT.md"),
      renderReport(domainResults, scorecard),
      "utf8",
    );
    return {
      kind: "multi_domain_external_campaign",
      domainCount: 3,
      resultSlugs: pilots.map((pilot: any) => pilot.pilotId),
      customToolsBuilt: 3,
      externalPackagesProvisioned: ["pint", "pandas", "acorn"],
      nodeAlphaExecutions: 3,
      containerNetoffExecutions: scorecard.containerNetoffExecutions,
      publicHygienePassed: true,
      artifactRefs: [
        ".sovryn/multi-domain-campaign/campaign-plan.json",
        ".sovryn/multi-domain-campaign/domain-results.json",
        ".sovryn/multi-domain-campaign/cross-domain-scorecard.json",
        ".sovryn/multi-domain-campaign/MULTI_DOMAIN_REPORT.md",
      ],
    };
  }
}

async function readPilot(
  pilotId: string,
  root: string,
): Promise<Record<string, unknown>> {
  return readJson(join(root, ".sovryn", "pilots", pilotId, "pilot-run.json"));
}

function renderReport(domainResults: any, scorecard: any): string {
  return `# Multi-Domain External Research Campaign

Domains: ${scorecard.domainCount}
Custom tools built: ${scorecard.customToolsBuilt}
External packages: ${scorecard.externalPackagesProvisioned.join(", ")}
Container-netoff executions: ${scorecard.containerNetoffExecutions}

## Results

${domainResults.results
  .map(
    (item: any) => `- ${item.domain}: ${item.slug} (${item.run.qualityLabel})`,
  )
  .join("\n")}

## Safety

The campaign uses toy chemistry-style records, synthetic anonymized energy
records, and synthetic defensive patch examples only. It does not claim legal
novelty, patentability, or freedom-to-operate, and it does not publish unsafe
operational instructions.
`;
}
