import { FileSystem } from '../repositories/file-system.js';

export interface DriftResult {
  check: string;
  status: 'OK' | 'WARN';
  details: string[];
}

const CLI_COMMANDS = new Set(['status', 'validate', 'review', 'task']);

export class DriftChecker {
  constructor(private fileSystem: FileSystem, private rootPath: string, private cliVersion: string) {}

  async check(): Promise<DriftResult[]> {
    return Promise.all([
      this.checkCommandDrift(),
      this.checkVersionDrift(),
      this.checkAgentsPaths(),
    ]);
  }

  private async checkCommandDrift(): Promise<DriftResult> {
    const readme = await this.fileSystem.readFile(`${this.rootPath}/README.md`);
    const documented = new Set<string>();
    for (const match of readme.matchAll(/^arch\s+([a-z][a-z-]+)/gm)) {
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

    if (configVersion === this.cliVersion) {
      return { check: 'Version', status: 'OK', details: [`v${configVersion}`] };
    }
    return {
      check: 'Version',
      status: 'WARN',
      details: [`arch.config.json: v${configVersion} — CLI: v${this.cliVersion}`],
    };
  }

  private async checkAgentsPaths(): Promise<DriftResult> {
    const agents = await this.fileSystem.readFile(`${this.rootPath}/docs/AGENTS.md`);
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
}
