export interface ArchPaths {
  tasks: string;
  archive: string;
  guidelines: string;
  agents: string;
  refinement: string;
  refinementArchive: string;
  adr: string;
  inbox: string;
  events: string;
  statusProjection: string;
}

export interface ArchConfig {
  version: string;
  protocolVersion: string;
  minimumCliVersion: string;
  currentSprint?: string;
  paths: ArchPaths;
  governance?: {
    conductEveryN?: number;
    corpusAuditEveryN?: number;
    corpusAuditThresholdWarn?: number;
    corpusAuditThresholdHalt?: number;
    protectedPaths?: string[];
    hanseiSinceTaskId?: number;
  };
  reflect?: {
    deepCadenceN?: number;
    thresholds?: Record<string, any>;
  };
  muri?: Record<string, { turns: number; cost?: number }>;
}

// arch-allow-hardcoded-path — canonical fallback defaults, overridden by arch.config.json
export const DEFAULT_PATHS: ArchPaths = {
  tasks: 'docs/tasks',
  archive: 'docs/archive',
  guidelines: 'docs/guidelines',
  agents: 'docs/agents',
  refinement: 'docs/refinement',
  refinementArchive: 'docs/refinement/archive',
  adr: 'docs/adr',
  inbox: 'docs/INBOX.md',
  events: 'docs/EVENTS.md',
  statusProjection: '.arch/status-projection.json',
};
