export interface ProposalAc {
  description: string;
  predicate: string;
}

export interface NoveltyInfo {
  score: number;
  nearestPrecedents: Array<{ id: string; distance: number }>;
  clusterSize: number;
  isHighNovelty: boolean;
}

export interface UncertaintyEntry {
  field: string;
  note: string;
}

export interface PromotionProposal {
  ideaSlug: string;
  ideaPath: string;
  title: string;
  class: string;
  size: string;
  rationale: string;
  acs: ProposalAc[];
  novelty: NoveltyInfo;
  uncertainties: UncertaintyEntry[];
  advisory: boolean;
  /** Fields absent from the IDEA file that prevent AC generation. Empty when all required fields present. */
  missingFields?: string[];
}
