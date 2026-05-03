import type { InventionDossier } from "./invention-types.js";

export type ResearchProviderOutput = {
  summary: string;
  artifacts: string[];
};

export interface ResearchProvider {
  research(brief: string): Promise<ResearchProviderOutput>;
}

export interface PriorArtProvider {
  mapPriorArt(brief: string): Promise<ResearchProviderOutput>;
}

export interface InventionProvider {
  synthesize(brief: string): Promise<Partial<InventionDossier>>;
}

export interface PrototypeProvider {
  prototype(dossier: InventionDossier): Promise<ResearchProviderOutput>;
}

export interface DossierWriterProvider {
  write(dossier: InventionDossier): Promise<ResearchProviderOutput>;
}

export interface SafetyReviewProvider {
  review(dossier: InventionDossier): Promise<ResearchProviderOutput>;
}

export class TemplateResearchProvider implements ResearchProvider, PriorArtProvider, InventionProvider, PrototypeProvider, DossierWriterProvider, SafetyReviewProvider {
  async research(brief: string): Promise<ResearchProviderOutput> {
    return {
      summary: `Deterministic landscape scan prepared from the research brief: ${brief}`,
      artifacts: ["PRIOR_ART.md", "SPEC.md"]
    };
  }

  async mapPriorArt(brief: string): Promise<ResearchProviderOutput> {
    return {
      summary: `Prior-art mapping placeholder created. Manual or agent-assisted public research is required before serious use: ${brief}`,
      artifacts: ["PRIOR_ART.md"]
    };
  }

  async synthesize(brief: string): Promise<Partial<InventionDossier>> {
    return {
      abstract: `An open invention dossier for ${brief}.`,
      proposedSolution: `A deterministic, auditable workflow that turns a research brief into open-source artifacts, validation evidence, and a defensive publication.`,
      architecture: "Controller CLI, Node Alpha workspace, deterministic pipeline phases, publication policy, and GitHub publisher adapter.",
      algorithm: "Accept brief, create dossier, generate prototype scaffold, run validation, perform safety/license/prior-art gates, then publish only through Sovryn finalization."
    };
  }

  async prototype(dossier: InventionDossier): Promise<ResearchProviderOutput> {
    return {
      summary: `Prototype scaffold generated for ${dossier.title}.`,
      artifacts: [dossier.prototypePath, dossier.testsPath]
    };
  }

  async write(dossier: InventionDossier): Promise<ResearchProviderOutput> {
    return {
      summary: `Dossier documents generated for ${dossier.title}.`,
      artifacts: ["README.md", "SPEC.md", "DEFENSIVE_PUBLICATION.md", "NOVELTY_NOTES.md", "SAFETY_REVIEW.md"]
    };
  }

  async review(dossier: InventionDossier): Promise<ResearchProviderOutput> {
    return {
      summary: `Safety review generated for ${dossier.title}. This is not a legal or production safety certification.`,
      artifacts: ["SAFETY_REVIEW.md"]
    };
  }
}
