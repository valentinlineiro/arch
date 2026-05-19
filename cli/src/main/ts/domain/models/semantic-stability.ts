export type MetricType = 'VELOCITY' | 'QUALITY' | 'RELIABILITY' | 'EFFICIENCY';

export interface MetricDefinitionChange {
  timestamp: Date;
  description: string;
  impactEstimate: 'MINOR' | 'MAJOR';
}

export interface MetricIntegrityProfile {
  metricName: string;
  type: MetricType;
  
  // Historical stability
  varianceScore: number; // Unexpected spikes
  definitionChanges: MetricDefinitionChange[];
  
  // Cross-validation
  redundantMetrics: string[]; // e.g., 'LeadTime' relies on 'PRCycleTime'
  divergenceFromRedundancy: number; // 0-1, high means metric is drifting from its peers
  
  status: 'STABLE' | 'DRIFTING' | 'CORRUPTED';
}

export interface SemanticStabilityReport {
  timestamp: Date;
  overallStabilityScore: number; // 0-100
  compromisedMetrics: MetricIntegrityProfile[];
  safeToCalibrate: boolean; // False if > 30% of key metrics are corrupted
}
