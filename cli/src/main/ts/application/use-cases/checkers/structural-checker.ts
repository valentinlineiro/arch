import { FileSystem } from '../../../domain/repositories/file-system.js';
import { GitRepository } from '../../../domain/repositories/git-repository.js';
import { HanseiAuditor } from '../../../domain/services/hansei-auditor.js';
import semver from 'semver';
import { FocusLevel, ConflictSeverity, FocusConflict, TaskStatus, Hansei, Task } from '../../../domain/models/task.js';
import { PathResolver } from '../../../domain/services/path-resolver.js';
import { ConfigLoader } from '../../../domain/services/config-loader.js';
import type { DriftResult } from './checker-types.js';

const ROOT_RUNTIME_ARTIFACTS = new Set(['.codex']);
const CLI_COMMANDS = new Set([
  'check', 'review', 'init', 'version', 'status', 'sentinel', 'task', 'govern',
  'memory', 'corpus', 'capture', 'inbox', 'reflect', 'report', 'ask', 'causal',
  'index', 'audit', 'analyze', 'resume', 'explain', 'fix', 'triage', 'upgrade',
]);


export class StructuralChecker {
  private readonly pr: PathResolver;
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string,
    private cliVersion: string,
    pathResolver?: PathResolver
  ) {
    this.pr = pathResolver ?? PathResolver.from({});
  }

  async check(): Promise<DriftResult[]> {
    return Promise.all([
      this.checkMaxTopLevelFiles(),
      this.checkDeadPaths(),
      this.checkDocVersion(),
      this.checkConfigPaths(),
      this.checkAgentsPaths(),
      this.checkWorktreeHygiene(),
      this.checkTaskArchiveDrift(),
      this.checkObsoleteGuidelines(),
      this.checkUnappliedADRs(),
      this.checkStructuralPolicies(),
      this.checkDecompositionRationale(),
    ]);
  }

  async checkMaxTopLevelFiles(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const thresholds = config.governance?.sprawlThresholds ?? {
      '.arch': 30,
      docs: 25,
      '.': 25,
    };
    const details: string[] = [];

    for (const [dir, threshold] of Object.entries(thresholds) as [string, number][]) {
      const dirPath = dir === '.' ? this.rootPath : `${this.rootPath}/${dir}`;
      if (!(await this.fileSystem.exists(dirPath))) continue;

      let entries: string[];
      try {
        entries = await this.fileSystem.readDirectory(dirPath);
      } catch {
        continue;
      }

      // Filter out git-only tracked files and hidden entries for a "top-level files" count
      const topLevel = entries.filter(e => !e.startsWith('.') && !e.startsWith('node_modules'));
      if (topLevel.length > threshold) {
        details.push(`${dir}: ${topLevel.length} top-level entries exceeds threshold of ${threshold}`);
      }
    }

    return {
      check: 'Sprawl',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkDeadPaths(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const details: string[] = [];
    const deadPaths = ['sprint', 'backlog', 'done'];

    if (config.paths) {
      for (const path of deadPaths) {
        if (config.paths[path]) {
          details.push(`Deprecated path '${path}' found in arch.config.json. Remove it.`);
        }
      }
    }

    return {
      check: 'DeadPaths',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkDocVersion(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const version = config.version;
    const details: string[] = [];

    const filesToCheck = [
      'AGENTS.md',
      'GEMINI.md',
      'docs/AGENTS.md',
      'docs/ONBOARDING.html',
      'docs/index.html',
      'docs/agents/DO.md',
      'docs/agents/THINK.md',
    ];

    for (const file of filesToCheck) {
      if (await this.fileSystem.exists(`${this.rootPath}/${file}`)) {
        const content = await this.fileSystem.readFile(`${this.rootPath}/${file}`);
        // Match v0.4, v0.4.0, etc.
        const versionRegex = /v\d+\.\d+(\.\d+)?/g;
        const matches = content.match(versionRegex);
        if (matches) {
          for (const match of matches) {
            if (!version.startsWith(match.substring(1))) {
              details.push(`${file}: found ${match}, expected v${version}`);
            }
          }
        }
      }
    }

    return {
      check: 'DocVersion',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkConfigPaths(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const details: string[] = [];

    if (config.paths) {
      for (const [key, relPath] of Object.entries(config.paths)) {
        const exists = await this.fileSystem.exists(`${this.rootPath}/${relPath}`);
        if (!exists) {
          details.push(`Configured path for '${key}' does not exist: ${relPath}`);
        }
      }
    }

    return {
      check: 'ConfigPaths',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkAgentsPaths(): Promise<DriftResult> {
    let agentsPath = `${this.rootPath}/docs/AGENTS.md`;
    if (!(await this.fileSystem.exists(agentsPath))) {
      agentsPath = `${this.rootPath}/AGENTS.md`;
    }
    if (!(await this.fileSystem.exists(agentsPath))) {
      return { check: 'Paths', status: 'WARN', details: ['AGENTS.md not found'] };
    }
    const agents = await this.fileSystem.readFile(agentsPath);
    const refs = new Set<string>();

    for (const match of agents.matchAll(/`([a-zA-Z][a-zA-Z0-9/_\-\.]+\.[a-zA-Z]{1,5})`/g)) {
      refs.add(match[1]);
    }
    for (const match of agents.matchAll(/`(docs\/[a-zA-Z0-9/_\-\.]*)`/g)) {
      refs.add(match[1]);
    }

    const missing: string[] = [];
    for (const ref of refs) {
      const exists = await this.fileSystem.exists(`${this.rootPath}/${ref}`);
      if (!exists) missing.push(ref);
    }

    return {
      check: 'Paths',
      status: missing.length === 0 ? 'OK' : 'WARN',
      details: missing.length > 0 ? missing.map(p => `Missing: ${p}`) : [],
    };
  }

  async checkWorktreeHygiene(): Promise<DriftResult> {
    const statusLines = await this.gitRepository.getStatusLines();
    const details: string[] = [];

    for (const line of statusLines) {
      const status = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      if (!filePath) continue;

      if (status.includes('D')) {
        // Skip tracked deletions as they are intentional
        continue;
      }

      if (status === '??') {
        const normalized = filePath.replace(/\/$/, '');
        if (!normalized.includes('/') && ROOT_RUNTIME_ARTIFACTS.has(normalized)) {
          details.push(`Runtime artifact not ignored locally: ${normalized}`);
        }
      }
    }

    return {
      check: 'Worktree',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkTaskArchiveDrift(): Promise<DriftResult> {
    const details: string[] = [];
    const taskFiles = await this.getMarkdownFiles(this.pr.tasks);
    const archiveFiles = await this.getMarkdownFiles(this.pr.archive);

    const duplicateIds = taskFiles.filter(file => archiveFiles.includes(file));
    for (const file of duplicateIds) {
      details.push(`Task exists in both active and archive: ${file.replace('.md', '')}`);
    }

    return {
      check: 'TaskArchive',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkObsoleteGuidelines(): Promise<DriftResult> {
    const guidelinesDir = `${this.rootPath}/docs/guidelines`;
    if (!(await this.fileSystem.exists(guidelinesDir))) {
      return { check: 'ObsoleteGuidelines', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(guidelinesDir)).filter(f => f.endsWith('.md'));
    const details: string[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${guidelinesDir}/${file}`);
      const refs = new Set<string>();

      for (const match of content.matchAll(/`([a-zA-Z][a-zA-Z0-9/_\-\.]+\.[a-zA-Z]{1,5})`/g)) {
        refs.add(match[1]);
      }
      for (const match of content.matchAll(/`(docs\/[a-zA-Z0-9/_\-\.]*)`/g)) {
        refs.add(match[1]);
      }

      for (const ref of refs) {
        if (ref.includes('*')) continue;
        const normalizedRef = ref.replace(/\/$/, '');
        const exists = await this.fileSystem.exists(`${this.rootPath}/${normalizedRef}`);
        if (!exists) {
          details.push(`docs/guidelines/${file}: dead reference '${ref}'`);
        }
      }
    }

    return { check: 'ObsoleteGuidelines', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  async checkUnappliedADRs(): Promise<DriftResult> {
    const adrDir = `${this.rootPath}/${this.pr.adr}`;
    if (!(await this.fileSystem.exists(adrDir))) {
      return { check: 'UnappliedADRs', status: 'OK', details: [] };
    }

    const adrFiles = (await this.fileSystem.readDirectory(adrDir)).filter(f => f.endsWith('.md'));

    // Build combined search corpus from tasks + archive
    const searchDirs = [this.pr.tasks, this.pr.archive];
    const corpus: string[] = [];
    for (const dir of searchDirs) {
      const dirPath = `${this.rootPath}/${dir}`;
      if (!(await this.fileSystem.exists(dirPath))) continue;
      const files = (await this.fileSystem.readDirectory(dirPath)).filter(f => f.endsWith('.md'));
      for (const file of files) {
        corpus.push(await this.fileSystem.readFile(`${dirPath}/${file}`));
      }
    }
    const combinedCorpus = corpus.join('\n');

    const details: string[] = [];
    for (const adrFile of adrFiles) {
      const content = await this.fileSystem.readFile(`${adrDir}/${adrFile}`);
      const statusMatch = content.match(/^\*\*Status:\*\*\s*(.+)/m);
      if (!statusMatch || statusMatch[1].trim() !== 'ACCEPTED') continue;

      const idMatch = adrFile.match(/^(ADR-\d+)/);
      if (!idMatch) continue;
      const adrId = idMatch[1];

      if (!combinedCorpus.includes(adrId)) {
        details.push(`${adrId}: ACCEPTED but never referenced in any task file.`);
      }
    }

    return { check: 'UnappliedADRs', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  async checkStructuralPolicies(): Promise<DriftResult> {
    const config = await ConfigLoader.load(this.fileSystem).catch(() => null);
    const policies = (config as any)?.policies;

    if (!policies) return { check: 'StructuralPolicies', status: 'OK', details: ['No policies configured'] };

    const details: string[] = [];

    // forbiddenDependencies: { from: 'infrastructure/', to: 'domain/' } means infra must not import domain
    if (Array.isArray(policies.forbiddenDependencies)) {
      for (const rule of policies.forbiddenDependencies) {
        const { from, to, message } = rule as { from: string; to: string; message?: string };
        if (!from || !to) continue;
        try {
          const files = await this.fileSystem.readDirectory(`${this.rootPath}/${from}`).catch(() => [] as string[]);
          for (const file of files.filter(f => f.endsWith('.ts') || f.endsWith('.js'))) {
            const content = await this.fileSystem.readFile(`${this.rootPath}/${from}/${file}`).catch(() => '');
            const importLines = content.split('\n').filter(l => l.includes('import') && l.includes(to));
            if (importLines.length > 0) {
              const msg = message ?? `Forbidden dependency: ${from} imports from ${to}`;
              details.push(`[StructuralPolicy] ${from}/${file}: ${msg}`);
            }
          }
        } catch { /* directory may not exist */ }
      }
    }

    // requiredTestCoverage: minimum % of src files that have a corresponding test
    if (typeof policies.requiredTestCoverage === 'number') {
      const threshold = policies.requiredTestCoverage as number;
      try {
        const srcFiles = await this.fileSystem.readDirectory(`${this.rootPath}/cli/src/main/ts`).catch(() => [] as string[]);
        const testFiles = await this.fileSystem.readDirectory(`${this.rootPath}/cli/src/test/ts`).catch(() => [] as string[]);
        const srcCount = srcFiles.filter(f => f.endsWith('.ts')).length;
        const testCount = testFiles.filter(f => f.endsWith('.test.ts')).length;
        if (srcCount > 0) {
          const coverage = Math.round((testCount / srcCount) * 100);
          if (coverage < threshold) {
            details.push(`[StructuralPolicy] Test coverage: ${coverage}% < required ${threshold}% (${testCount} test files / ${srcCount} src files)`);
          }
        }
      } catch { /* non-blocking */ }
    }

    // namingInvariants: { pattern, glob, message } — files matching glob must match pattern
    if (Array.isArray(policies.namingInvariants)) {
      for (const rule of policies.namingInvariants) {
        const { pattern, glob: g, message } = rule as { pattern: string; glob: string; message?: string };
        if (!pattern || !g) continue;
        const re = new RegExp(pattern);
        try {
          const dir = g.split('/').slice(0, -1).join('/');
          const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dir}`).catch(() => [] as string[]);
          for (const f of files) {
            if (!re.test(f)) {
              details.push(`[StructuralPolicy] ${dir}/${f} violates naming invariant: ${message ?? pattern}`);
            }
          }
        } catch { /* non-blocking */ }
      }
    }

    return {
      check: 'StructuralPolicies',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkDecompositionRationale(): Promise<DriftResult> {
    const details: string[] = [];
    try {
      const taskFiles = await this.fileSystem.readDirectory(this.pr.tasks);
      for (const file of taskFiles.filter(f => f.startsWith('TASK-') && f.endsWith('.md'))) {
        const content = await this.fileSystem.readFile(`${this.pr.tasks}/${file}`).catch(() => '');
        // Check only READY tasks with size M or L
        const meta = content.match(/\*\*Meta:\*\*[^\n]+\|\s*(M|L)\s*\|\s*READY/);
        if (!meta) continue;
        const hasGaps = content.includes('### Gaps');
        if (!hasGaps) {
          const id = file.replace('.md', '');
          details.push(`${id} is ${meta[1]}-sized READY task — add ### Gaps section with decomposition rationale`);
        }
      }
    } catch { /* non-blocking */ }
    return {
      check: 'DecompositionRationale',
      status: details.length === 0 ? 'OK' : 'ADVISORY',
      details,
    };
  }

  private async getMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dir}`);
      return files.filter(f => f.endsWith('.md'));
    } catch { return []; }
  }

}
