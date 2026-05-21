
export type Intensity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Subsystem {
  id: string;
  files: string[];

  dependencyProfile: {
    inbound: number;
    outbound: number;
    externalDependencies: string[];
  };

  behavioralProfile: {
    ioIntensity: Intensity;
    asyncDensity: Intensity;
    stateMutationDensity: Intensity;
    configDependency: Intensity;
  };

  inferredRole: {
    label: string; // Freeform hypothesis (e.g., "Probable data-access boundary")
    basis: string[]; // Explicit evidence signals
  };
}

export interface DependencyGraph {
  nodes: Array<{ id: string; type: 'file' | 'subsystem' }>;
  edges: Array<{ from: string; to: string; weight: number }>;
}

export type RiskType = 
  | 'COUPLING' 
  | 'HIDDEN_BOUNDARY' 
  | 'UNCONTROLLED_IO' 
  | 'TEMPORAL_COHERENCE'
  | 'STRUCTURAL_AMBIGUITY';

export interface Risk {
  type: RiskType;
  severity: Intensity;
  locations: string[];
  description?: string;
}

export type HookType = 
  | 'REQUEST_BOUNDARY' 
  | 'DEPENDENCY_TRACKING' 
  | 'STATE_MUTATION_TRACKING' 
  | 'EVENT_FLOW_MONITORING';

export interface InstrumentationHook {
  location: string;
  reason: string;
  type: HookType;
}

export interface InstrumentationPlan {
  highPriority: string[];   // Critical boundaries, high risk areas
  mediumPriority: string[]; // Shared or transitional systems
  lowPriority: string[];    // Stable computation zones
  recommendedHooks: InstrumentationHook[];
}

export interface ExtractionResult {
  languages: string[];
  entrypoints: string[];
  buildSystem: string[];
  graph: DependencyGraph;
  files: string[];
}

export interface ARCHDeploymentMap {
  repository: {
    languages: string[];
    entrypoints: string[];
    buildSystem: string[];
  };

  subsystems: Subsystem[];
  dependencyGraph: DependencyGraph;
  riskMap: Risk[];
  instrumentationPlan: InstrumentationPlan;
}
