import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

interface PendingWrite {
  path: string;
  content: string;
  mode: 'write' | 'append';
}

export class GovernTransaction {
  private pending: PendingWrite[] = [];
  private committed = false;
  private readonly archPrefix: string;

  constructor(private fileSystem: FileSystem, pathResolver?: PathResolver) {
    const pr = pathResolver ?? PathResolver.from({});
    this.archPrefix = pr.archDir + '/';
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (this.isArchPath(path)) {
      // Replace any existing pending write for same path
      this.pending = this.pending.filter(p => p.path !== path);
      this.pending.push({ path, content, mode: 'write' });
    } else {
      await this.fileSystem.writeFile(path, content);
    }
  }

  async appendFile(path: string, content: string): Promise<void> {
    if (this.isArchPath(path)) {
      // Find existing pending write for this path and append to it
      const existing = this.pending.find(p => p.path === path);
      if (existing) {
        existing.content += content;
      } else {
        // Read current content first so we can append correctly
        let current = '';
        try { current = await this.fileSystem.readFile(path); } catch {}
        this.pending.push({ path, content: current + content, mode: 'write' });
      }
    } else {
      await this.fileSystem.appendFile(path, content);
    }
  }

  /** Read passes through — always reads from disk (current state). */
  async readFile(path: string): Promise<string> {
    return this.fileSystem.readFile(path);
  }

  /**
   * Flush all buffered writes atomically.
   * If any write fails, throws and no subsequent writes happen.
   * Call this immediately before the git commit step.
   */
  async flush(): Promise<void> {
    if (this.committed) throw new Error('GovernTransaction already flushed');

    for (const { path, content } of this.pending) {
      await this.fileSystem.writeFile(path, content);
    }

    this.committed = true;
    this.pending = [];
  }

  /** Discard buffered writes without writing anything. */
  rollback(): void {
    this.pending = [];
    this.committed = false;
  }

  get pendingCount(): number { return this.pending.length; }

  private isArchPath(path: string): boolean {
    return path.startsWith(this.archPrefix) || path.includes('/' + this.archPrefix);
  }
}
