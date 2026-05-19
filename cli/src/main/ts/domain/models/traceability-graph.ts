export type NodeType = 'Commit' | 'Issue' | 'PR' | 'File' | 'Module' | 'Contributor';
export type EdgeType = 'modifies' | 'contains' | 'links_to' | 'implements' | 'owns' | 'reviewed_by';
export type EvidenceType = 'git_diff' | 'regex_match' | 'github_api' | 'codeowners';

export interface GraphNode {
  id: string; // Canonical ID from IdentityResolver
  type: NodeType;
  source: 'git' | 'github' | 'derived';
  timestamps: { created: Date; updated?: Date };
  rawRefs: string[]; // Original identifiers (e.g. commit hash, issue number)
}

export interface GraphEdge {
  id: string; // hash(from + to + type) for tracking across re-projections
  from: string;
  to: string;
  type: EdgeType;
  evidence: Evidence[];
  
  createdAt: Date;
  updatedAt?: Date;
  
  validity: {
    status: 'active' | 'deprecated';
    reason?: string;
  };
}

export interface Evidence {
  type: EvidenceType;
  ref: string; 
  snippet?: string;
}

/**
 * Event-Sourcing: The graph is built from a stream of evidence.
 */
export type TraceabilityEvent = 
  | { type: 'NODE_DISCOVERED'; node: GraphNode }
  | { type: 'EDGE_DECLARED'; edge: GraphEdge }
  | { type: 'EDGE_DEPRECATED'; edgeId: string; reason: string; timestamp: Date };
