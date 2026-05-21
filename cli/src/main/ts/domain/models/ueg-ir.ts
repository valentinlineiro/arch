
export type EntityKind = 'FILE' | 'MODULE' | 'CLASS' | 'FUNCTION' | 'UNKNOWN_ENTITY';

export interface Entity {
  id: string;
  kind: EntityKind;
  name: string;
  location?: {
    file: string;
    startLine?: number;
    endLine?: number;
  };
}

export type EdgeType = 
  | 'IMPORT' 
  | 'CALL' 
  | 'INSTANTIATE' 
  | 'READ' 
  | 'WRITE' 
  | 'EXTENDS' 
  | 'IMPLEMENTS' 
  | 'UNKNOWN_DEPENDENCY';

export type Uncertainty = 'LOW' | 'MEDIUM' | 'HIGH';
export type EvidenceSource = 'STATIC' | 'HEURISTIC' | 'INFERRED';

export interface Edge {
  from: string; // Entity.id
  to: string;   // Entity.id
  type: EdgeType;
  uncertainty: Uncertainty;
  source: EvidenceSource;
}

export interface SignalValue {
  source: string;
  value: number; // 0-1
}

export interface BehavioralSignals {
  ioIntensity: SignalValue[];
  stateMutation: SignalValue[];
  asyncDensity: SignalValue[];
  configDependency: SignalValue[];
  externalDependencyRatio: SignalValue[];
}

export interface UEGGraph {
  entities: Entity[];
  edges: Edge[];
  signals: Record<string, BehavioralSignals>; // keyed by Entity.id

  metadata: {
    languageCoverage: string[];
    completeness: 'FULL' | 'PARTIAL' | 'UNKNOWN';
  };
}

export interface UEGGraphFragment {
  entities: Entity[];
  edges: Edge[];
  signals: Record<string, BehavioralSignals>;
  completeness: 'FULL' | 'PARTIAL' | 'UNKNOWN';
}

export interface SubsystemView {
  entities: Entity[];
  relations: Edge[];
  viewType: 'EMERGENT_VIEW';
}

export type StructuralState = 
  | 'CLEARLY_SEPARATED' 
  | 'PARTIALLY_OVERLAPPING' 
  | 'UNRESOLVED_OVERLAP';

export type RiskType = 
  | 'HIGH_COUPLING' 
  | 'DEPENDENCY_CYCLE' 
  | 'UNCONTROLLED_IO' 
  | 'STRUCTURAL_AMBIGUITY';

export interface Risk {
  type: RiskType;
  entities: string[];
  observation: string;
  structuralCondition: string;
}

export interface InstrumentationSuggestion {
  entityId: string;
  hookType: 'REQUEST_BOUNDARY' | 'DEPENDENCY_TRACK' | 'STATE_MUTATION_TRACK';
  reason: string;
}

export interface ARCHDeploymentMap {
  graph: UEGGraph;
  subsystems: SubsystemView[];
  risks: Risk[];
  instrumentation: InstrumentationSuggestion[];
}
