export type EvidenceSource = 'git' | 'github_api' | 'codeowners' | 'heuristic';

export interface ConfidenceModel {
  score: number; // 0.0 to 1.0
  source: EvidenceSource;
  rationale: string; // e.g., "Regex match in commit message" or "GitHub API Linked Issue"
}

export type ClaimType = 
  | 'LINKAGE'        // Commit -> Issue/PR
  | 'MODIFICATION'   // Commit -> File
  | 'CONTAINMENT'    // Module -> File
  | 'OWNERSHIP'      // Contributor -> File/Module
  | 'REVIEW'         // Contributor -> PR
  | 'IMPLEMENTATION'; // PR -> Issue

export interface EvidenceEvent {
  id: string;        // Event UUID
  timestamp: Date;
  
  // The Atomic Fact
  claim: {
    subject: string;  // Canonical ID (e.g., commit:abc)
    relation: ClaimType;
    object: string;   // Canonical ID (e.g., issue:123)
  };
  
  // The Proof (Audit Trail)
  evidence: {
    type: 'regex' | 'api_response' | 'diff_stat' | 'path_convention' | 'codeowners_entry';
    ref: string;      // e.g., "Fixes #123" or "PR #45 Metadata"
    snippet?: string; // The exact text or JSON fragment
  };
  
  confidence: ConfidenceModel;
}
