import { PathResolver } from '../services/path-resolver.js';

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

const _pr = PathResolver.from({});
export const DEFAULT_PATHS: ArchPaths = {
  tasks: _pr.tasks,
  archive: _pr.archive,
  guidelines: _pr.guidelines,
  agents: _pr.agents,
  refinement: _pr.refinement,
  refinementArchive: _pr.refinementArchive,
  adr: _pr.adr,
  inbox: _pr.inbox,
  events: _pr.events,
  statusProjection: _pr.statusProjection,
};
