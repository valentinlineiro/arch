import { ClaimType, EvidenceSource } from './evidence.js';

export interface ConflictRecord {
  subject: string;
  relation: ClaimType;
  conflictingObjects: Array<{
    object: string;
    source: EvidenceSource;
    confidence: number;
    evidenceRef: string;
  }>;
}

export interface CoverageStats {
  totalRawEvents: number;
  enrichedEvents: number;
  coverageRate: number; // 0-1
  bySource: Record<EvidenceSource, number>;
  byClaimType: Record<ClaimType, number>;
  unclassifiedSubjects: string[]; // IDs of Raw objects with 0 claims
}

export interface EpistemicReport {
  timestamp: Date;
  stats: CoverageStats;
  conflicts: ConflictRecord[];
  integrityScore: number; // 0-100 (f(coverage, conflicts))
}
