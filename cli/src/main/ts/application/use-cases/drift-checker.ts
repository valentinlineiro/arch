/**
 * DriftChecker — thin orchestrator.
 * Delegates to three focused sub-checkers:
 *   - TaskHealthChecker   (task lifecycle, hansei, depends)
 *   - StructuralChecker   (repo structure, ADRs, config)
 *   - GovernanceChecker   (escalations, halt policy, version)
 * Plus checkCensus which spans all domains.
 */
import { FileSystem } from '../../domain/repositories/file-system.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { PathResolver } from '../../domain/services/path-resolver.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { TaskHealthChecker } from './checkers/task-health-checker.js';
import { StructuralChecker } from './checkers/structural-checker.js';
import { GovernanceChecker } from './checkers/governance-checker.js';

export interface DriftResult {
  check: string;
  status: 'OK' | 'WARN' | 'FAIL';
  details: string[];
}

const CLI_COMMANDS = new Set([
  'check', 'review', 'init', 'version', 'status', 'sentinel', 'task', 'govern',
  'memory', 'corpus', 'capture', 'inbox', 'reflect', 'report', 'ask', 'causal',
  'index', 'audit', 'analyze', 'resume', 'explain', 'fix', 'triage', 'upgrade',
]);

export class DriftChecker {
  private readonly pr: PathResolver;
  private taskHealth: TaskHealthChecker;
  private structural: StructuralChecker;
  private governance: GovernanceChecker;

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string,
    private cliVersion: string,
    pathResolver?: PathResolver
  ) {
    this.pr = pathResolver ?? PathResolver.from({});
    const args: [FileSystem, GitRepository, string, string, PathResolver?] =
      [fileSystem, gitRepository, rootPath, cliVersion, this.pr];
    this.taskHealth = new TaskHealthChecker(...args);
    this.structural = new StructuralChecker(...args);
    this.governance = new GovernanceChecker(...args);
  }

  async check(): Promise<DriftResult[]> {
    const [taskResults, structuralResults, governanceResults, census] = await Promise.all([
      this.taskHealth.check(),
      this.structural.check(),
      this.governance.check(),
      this.checkCensus(),
    ]);
    return [...taskResults, ...structuralResults, ...governanceResults, census];
  }

  /** checkCensus spans all domains — kept in orchestrator */
  private async checkCensus(): Promise<DriftResult> {
    let config: any = {};
    try {
      const raw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
      config = JSON.parse(raw);
    } catch { /* config absent — defaults */ }

    const archiveFiles = await this.fileSystem.readDirectory(`${this.rootPath}/${this.pr.archive}`).catch(() => []);
    const taskFiles = await this.fileSystem.readDirectory(`${this.rootPath}/${this.pr.tasks}`).catch(() => []);
    const adrFiles = await this.fileSystem.readDirectory(`${this.rootPath}/${this.pr.adr}`).catch(() => []);

    const details: string[] = [
      `Archive: ${archiveFiles.filter(f => f.endsWith('.md')).length} tasks`,
      `Open: ${taskFiles.filter(f => f.endsWith('.md')).length} tasks`,
      `ADRs: ${adrFiles.filter(f => f.endsWith('.md')).length}`,
      `CLI version: ${this.cliVersion}`,
      `archVersion: ${(config as any).archVersion ?? 'unset'}`,
    ];

    // contextBudget check: warn when directory token count exceeds budget
    const contextBudget: Record<string, number> = (config as any).contextBudget ?? {};
    let warnCount = 0;

    for (const [dir, budget] of Object.entries(contextBudget)) {
      const dirPath = `${this.rootPath}/${dir}`;
      try {
        const files = await this.fileSystem.readDirectory(dirPath);
        let totalLines = 0;
        for (const f of files.filter(x => x.endsWith('.md'))) {
          const content = await this.fileSystem.readFile(`${dirPath}/${f}`).catch(() => '');
          totalLines += content.split('\n').length;
        }
        if (totalLines > budget) {
          const isArchive = dir.includes('archive');
          const suggestion = isArchive ? 'PURGE old entries' : 'REFACTOR or split';
          details.push(`${dir}: ${totalLines} lines exceeds budget ${budget} — ${suggestion}`);
          warnCount++;
        }
      } catch { /* dir missing — skip */ }
    }

    return {
      check: 'Census',
      status: warnCount > 0 ? 'WARN' : 'OK',
      details,
    };
  }
}
