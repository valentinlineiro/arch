
export type SignalCategory =
  | "database"
  | "network"
  | "logging"
  | "auth"
  | "config"
  | "queue"
  | "storage"
  | "internal";

export type SignalMatch = {
  signal: string;
  category: SignalCategory;
  confidence: number;
  line: string;
  polarity: "positive" | "negative";
  source: "regex" | "import" | "manifest";
  metadata?: Record<string, unknown>;
};

export type GitDiffChunk = {
  commit: string;
  timestamp: number;
  file: string;
  addedLines: string[];
  removedLines: string[];
};

export type CachedSignalEntry = {
  commit: string;
  file: string;
  timestamp: number;
  signals: SignalMatch[];
  hash: string;
  engineVersion: string;
};

export type SpreadMetrics = {
  fileCount: number;
  directoryCount: number;
  commitCount: number;
};

export type PatternStability = "stable" | "unstable" | "schism" | "transitional";

export type MigrationTrend = {
  direction: "increasing" | "decreasing" | "stable";
  velocity: number; // rate of change in dominance
  isDirected: boolean; // true if clear trajectory exists
};

export type Pattern = {
  id: string;
  domain: string;
  dominantSignals: string[];
  competingSignals: string[];
  frequency: number;
  consistency: number;
  recency: number;
  spread: number;
  stabilityScore: number;
  
  // Temporal Trajectory (v1.2+)
  trajectory?: MigrationTrend;
  stability: PatternStability;

  firstSeen: number;
  lastSeen: number;
  files: string[];
  directories: string[];
};

export type InferredArchitecturalPattern = {
  id: string;
  title: string;
  inferredDecision: string;
  domain: string;
  evidence: {
    dominantPattern: string;
    competingPatterns: string[];
    affectedFiles: string[];
    directories: string[];
    frequency: number;
    observedSince: number;
    
    // Confidence Explanation (Auditability)
    confidenceFactors: {
      dominance: string;
      spread: string;
      recency: string;
      consistency: string;
      trajectory?: string;
    };
  };
  confidence: number;
  status: "INFERRED";
};

export type AuditResultV2 = {
  patterns: Pattern[];
  inferredPatterns: InferredArchitecturalPattern[];
  initSuggestion?: InitSuggestion;
};
