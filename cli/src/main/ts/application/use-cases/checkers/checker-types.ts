import type { FileSystem } from '../../../domain/repositories/file-system.js';
import type { GitRepository } from '../../../domain/repositories/git-repository.js';
import type { PathResolver } from '../../../domain/services/path-resolver.js';
import type { ConfigLoader } from '../../../domain/services/config-loader.js';

export interface DriftResult {
  check: string;
  status: 'OK' | 'WARN' | 'FAIL';
  details: string[];
}

export interface CheckerContext {
  fileSystem: FileSystem;
  gitRepository: GitRepository;
  rootPath: string;
  cliVersion: string;
  pr: PathResolver;
  config: ReturnType<ConfigLoader['load']> extends Promise<infer T> ? T : never;
}

export const CLI_COMMANDS = new Set([
  'check', 'review', 'init', 'version', 'status', 'sentinel', 'task', 'govern',
  'memory', 'corpus', 'capture', 'inbox', 'reflect', 'report', 'ask', 'causal',
  'index', 'audit', 'analyze', 'resume', 'explain', 'fix', 'triage', 'upgrade',
]);
