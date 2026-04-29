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
      this.checkDeadContext(),
      this.checkStaleDepends(),
      this.checkPriorityDrift(),
      this.checkStaleTasks(),
    ]);
  }

  private async checkStaleTasks(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const status = parts[3];
        
        if (status === 'READY' || status === 'BLOCKED') {
          const lastMod = await this.gitRepository.getFileLastModifiedDate(`docs/tasks/${file}`);
          if (lastMod && (now - lastMod.getTime() > THIRTY_DAYS_MS)) {
            const days = Math.floor((now - lastMod.getTime()) / (24 * 60 * 60 * 1000));
            details.push(`${file.replace('.md', '')} is ${status} but has not been modified in ${days} days.`);
          }
        }
      }
    }

    return {
      check: 'StaleTasks',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkPriorityDrift(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    
    const doneTaskIds = new Set(archiveFiles.map(f => f.replace('.md', '')));
    const allActiveTasks: any[] = [];

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const headerMatch = content.match(/^## (TASK-\d{3}): (.*)/m);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      
      if (headerMatch && metaMatch) {
        const id = headerMatch[1];
        const metaLine = metaMatch[0];
        const parts = metaLine.split('|').map(s => s.trim());
        const priority = parts[0].replace('**Meta:** ', '');
        const status = parts[3];
        const focus = parts[4];
        
        allActiveTasks.push({
          id,
          priority: parseInt(priority.substring(1), 10),
          status,
          isFocused: focus === 'Focus:yes',
          depends: dependsMatch ? dependsMatch[1].split(',').map(s => s.trim()) : []
        });
      }
    }

    const focusedTasks = allActiveTasks.filter(t => t.isFocused && t.status !== 'DONE');
    if (focusedTasks.length === 0) {
      return { check: 'PriorityDrift', status: 'OK', details: [] };
    }

    const minFocusedPriority = Math.min(...focusedTasks.map(t => t.priority));

    for (const task of allActiveTasks) {
      if (task.status === 'READY' && !task.isFocused && task.priority < minFocusedPriority) {
        // Check if unblocked
        const isUnblocked = task.depends.every((dep: string) => dep === 'none' || doneTaskIds.has(dep));
        if (isUnblocked) {
          details.push(`${task.id} (P${task.priority}) is READY and unblocked, but not focused while a P${minFocusedPriority} task is focused.`);
        }
      }
    }

    return {
      check: 'PriorityDrift',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkDeadContext(): Promise<DriftResult> {
    const details: string[] = [];
    const taskFiles = await this.getMarkdownFiles('docs/tasks');

    for (const file of taskFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const contextPart = parts[7];
        if (contextPart) {
          const paths = contextPart.split(',').map(s => s.trim());
          for (const p of paths) {
            if (!p || p === '' || p === 'none') continue;
            // Check if it's a glob
            if (p.includes('*')) continue;
            
            const exists = await this.fileSystem.exists(`${this.rootPath}/${p}`);
            if (!exists) {
              details.push(`${file.replace('.md', '')}: dead context path '${p}'`);
            }
          }
        }
      }
    }

    return {
      check: 'DeadContext',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkStaleDepends(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    
    const allTaskFiles = [...activeFiles, ...archiveFiles];
    const existingTaskIds = new Set(allTaskFiles.map(f => f.replace('.md', '')));

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      if (dependsMatch) {
        const deps = dependsMatch[1].split(',').map(s => s.trim());
        for (const dep of deps) {
          if (!dep || dep === 'none') continue;
          if (!existingTaskIds.has(dep)) {
            details.push(`${file.replace('.md', '')}: stale dependency '${dep}'`);
          }
        }
      }
    }

    return {
      check: 'StaleDepends',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
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
