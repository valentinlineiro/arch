import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';

export interface DriftResult {
  check: string;
  status: 'OK' | 'WARN';
  details: string[];
}

const CLI_COMMANDS = new Set(['status', 'validate', 'review', 'task', 'inbox', 'next']);
const ROOT_RUNTIME_ARTIFACTS = new Set(['.codex']);

export class DriftChecker {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string,
    private cliVersion: string
  ) {}

  async check(): Promise<DriftResult[]> {
    return Promise.all([
      this.checkCommandDrift(),
      this.checkVersionDrift(),
      this.checkAgentsPaths(),
      this.checkConfigPaths(),
      this.checkWorktreeHygiene(),
      this.checkTaskArchiveDrift(),
      this.checkDocVersion(),
      this.checkDeadPaths(),
    ]);
  }

  private async checkDeadPaths(): Promise<DriftResult> {
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

  private async checkDocVersion(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const version = config.version;
    const details: string[] = [];

    const filesToCheck = [
      'AGENTS.md',
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

  private async checkConfigPaths(): Promise<DriftResult> {
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

  private async checkCommandDrift(): Promise<DriftResult> {
    if (!(await this.fileSystem.exists(`${this.rootPath}/README.md`))) {
      return { check: 'Commands', status: 'WARN', details: ['README.md not found'] };
    }
    const readme = await this.fileSystem.readFile(`${this.rootPath}/README.md`);
    const documented = new Set<string>();
    for (const match of readme.matchAll(/^(?:\.\/scripts\/arch\.sh|arch)\s+([a-z][a-z-]+)/gm)) {
      documented.add(match[1]);
    }

    const missing = [...documented].filter(c => !CLI_COMMANDS.has(c));
    const extra = [...CLI_COMMANDS].filter(c => !documented.has(c));
    const details: string[] = [];

    if (missing.length > 0) details.push(`Documented but not implemented: ${missing.join(', ')}`);
    if (extra.length > 0) details.push(`Implemented but not documented: ${extra.join(', ')}`);

    return { check: 'Commands', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  private async checkVersionDrift(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const configVersion = JSON.parse(configRaw).version as string;

    const details: string[] = [];

    if (configVersion !== this.cliVersion) {
      details.push(`arch.config.json: v${configVersion} — CLI: v${this.cliVersion}`);
    }

    const pkgPath = `${this.rootPath}/cli/package.json`;
    if (await this.fileSystem.exists(pkgPath)) {
      const pkgRaw = await this.fileSystem.readFile(pkgPath);
      const pkgVersion = JSON.parse(pkgRaw).version as string;
      if (pkgVersion !== configVersion) {
        details.push(`cli/package.json: v${pkgVersion} — arch.config.json: v${configVersion}`);
      }
    }

    if (details.length === 0) {
      return { check: 'Version', status: 'OK', details: [`v${this.cliVersion}`] };
    }

    return {
      check: 'Version',
      status: 'WARN',
      details,
    };
  }

  private async checkAgentsPaths(): Promise<DriftResult> {
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

  private async checkWorktreeHygiene(): Promise<DriftResult> {
    const statusLines = await this.gitRepository.getStatusLines();
    const details: string[] = [];

    for (const line of statusLines) {
      const status = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      if (!filePath) continue;

      if (status.includes('D')) {
        details.push(`Tracked deletion in worktree: ${filePath}`);
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

  private async checkTaskArchiveDrift(): Promise<DriftResult> {
    const details: string[] = [];
    const taskFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');

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

  private async getMarkdownFiles(dirPath: string): Promise<string[]> {
    if (!(await this.fileSystem.exists(`${this.rootPath}/${dirPath}`))) {
      return [];
    }

    const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dirPath}`);
    return files.filter(file => file.endsWith('.md'));
  }
}
