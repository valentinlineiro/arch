import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';

const EXPORT_SYMBOL_RE = /export\s+(?:abstract\s+)?(?:class|function|interface|type|enum|const|default\s+class)\s+(\w+)/g;

export class CodebaseContextInjector {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
  ) {}

  async execute(taskId: string, contextPaths: string[]): Promise<string | null> {
    if (contextPaths.length === 0) return null;

    const displayPath = contextPaths[0];

    let commits;
    try {
      commits = await this.gitRepository.getCommitHistory(20);
    } catch {
      return null;
    }

    if (!commits || commits.length === 0) return null;

    const fileCount = new Map<string, number>();
    for (const commit of commits) {
      for (const file of commit.files) {
        if (contextPaths.some(p => file.path.startsWith(p))) {
          fileCount.set(file.path, (fileCount.get(file.path) ?? 0) + 1);
        }
      }
    }

    if (fileCount.size === 0) return null;

    const topFiles = [...fileCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const results: Array<{ path: string; count: number; symbols: string[] }> = [];
    for (const [filePath, count] of topFiles) {
      let content: string;
      try {
        content = await this.fileSystem.readFile(filePath);
      } catch {
        results.push({ path: filePath, count, symbols: [] });
        continue;
      }

      const symbols: string[] = [];
      let match: RegExpExecArray | null;
      const re = new RegExp(EXPORT_SYMBOL_RE);
      while ((match = re.exec(content)) !== null) {
        symbols.push(match[1]);
      }
      results.push({ path: filePath, count, symbols });
    }

    const lines: string[] = [
      `## [CODEBASE-CONTEXT] ${displayPath}`,
      `  Recently modified across the last 20 commits:`,
      ``,
    ];

    for (const r of results) {
      lines.push(`- ${r.path} (${r.count} commits)`);
      if (r.symbols.length > 0) {
        lines.push(`  - exports: ${r.symbols.join(', ')}`);
      }
    }

    return lines.join('\n');
  }
}
