import type { FileSystem } from '../../domain/repositories/file-system.js';

export class CompressTask {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async execute(taskId: string): Promise<void> {
    const archivePath = `${this.rootPath}/docs/archive/${taskId}.md`;
    if (!(await this.fileSystem.exists(archivePath))) {
      throw new Error(`Archive file not found: ${archivePath}`);
    }
    const content = await this.fileSystem.readFile(archivePath);
    const compressed = this.compress(content);
    await this.fileSystem.writeFile(archivePath, compressed);
  }

  async executeAll(): Promise<string[]> {
    const archiveDir = `${this.rootPath}/docs/archive`;
    if (!(await this.fileSystem.exists(archiveDir))) return [];
    const files = await this.fileSystem.readDirectory(archiveDir);
    const compressed: string[] = [];
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const taskId = file.replace('.md', '');
      await this.execute(taskId);
      compressed.push(taskId);
    }
    return compressed;
  }

  compress(content: string): string {
    const lines = content.split('\n');
    const parts: string[] = [];

    // Header
    const headerLine = lines.find(l => /^## TASK-\d+:/.test(l));
    if (headerLine) parts.push(headerLine);

    // Meta, Closed-at, Rejected-at, Reason, Depends, Sprint
    const keepPrefixes = ['**Meta:**', '**Closed-at:**', '**Rejected-at:**', '**Reason:**', '**Depends:**', '**Sprint:**'];
    for (const line of lines) {
      if (keepPrefixes.some(p => line.startsWith(p))) {
        parts.push(line);
      }
    }

    // Hansei section
    const hanseiIdx = lines.findIndex(l => l.trim() === '## Hansei');
    if (hanseiIdx !== -1) {
      parts.push('');
      parts.push(...lines.slice(hanseiIdx));
    }

    return parts.join('\n').trimEnd() + '\n';
  }
}
