
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { CachedSignalEntry } from '../../domain/models/audit-inference.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

const CACHE_PATH = `${PathResolver.from({}).archDir}/cache/git-signals.jsonl`;

export class SignalCache {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  private get path(): string {
    return `${this.rootPath}/${CACHE_PATH}`;
  }

  async load(): Promise<CachedSignalEntry[]> {
    try {
      const raw = await this.fileSystem.readFile(this.path);
      return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as CachedSignalEntry);
    } catch {
      return [];
    }
  }

  async append(entries: CachedSignalEntry[]): Promise<void> {
    if (entries.length === 0) return;
    
    // Ensure directory exists
    const dir = this.path.split('/').slice(0, -1).join('/');
    await this.fileSystem.mkdir(dir);
    
    const lines = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
    await this.fileSystem.appendFile(this.path, lines);
  }

  async clear(): Promise<void> {
    try {
      const dir = this.path.split('/').slice(0, -1).join('/');
      await this.fileSystem.mkdir(dir);
      await this.fileSystem.writeFile(this.path, "");
    } catch { /* ignore */ }
  }
}
