import { PathResolver } from '../services/path-resolver.js';

export type ArchProfile = 'minimal' | 'standard' | 'full';

export interface ModulesConfig {
  hansei?: 'advisory' | 'blocking' | 'disabled';
  sprint?: 'enabled' | 'disabled';
  corpus?: 'enabled' | 'disabled';
  driftChecks?: string[];
  coreFlows?: 'enabled' | 'disabled';
}

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
  archProfile?: ArchProfile;
  modules?: ModulesConfig;
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

export function resolveArchProfile(config: ArchConfig): ArchProfile {
  return config.archProfile ?? 'full';
}

export function resolveModules(config: ArchConfig): ModulesConfig {
  return config.modules ?? {};
}

export function isHanseiBlocking(config: ArchConfig): boolean {
  const profile = resolveArchProfile(config);
  const modules = resolveModules(config);
  if (modules.hansei === 'advisory' || modules.hansei === 'disabled') return false;
  if (profile === 'minimal') return false;
  return true;
}

export function shouldRunDriftGroup(config: ArchConfig, groupName: string): boolean {
  const profile = resolveArchProfile(config);
  const modules = resolveModules(config);
  if (modules.driftChecks) {
    return modules.driftChecks.includes(groupName);
  }
  if (profile === 'minimal') {
    return groupName === 'TaskHealth';
  }
  if (profile === 'standard') {
    return groupName === 'TaskHealth' || groupName === 'Governance';
  }
  return true;
}

export function shouldRunSubsystem(config: ArchConfig, subsystem: string): boolean {
  const profile = resolveArchProfile(config);
  const modules = resolveModules(config);
  const moduleKey = subsystem as keyof ModulesConfig;
  const moduleVal = modules[moduleKey];
  if (moduleVal === 'disabled') return false;
  if (profile === 'minimal') {
    return subsystem === 'sprint' ? false : subsystem === 'corpus' ? false : subsystem === 'coreFlows' ? false : true;
  }
  if (profile === 'standard') {
    return subsystem === 'corpus' ? false : true;
  }
  return true;
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
