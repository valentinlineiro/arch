import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import path from 'node:path';

export class MergeResolve {
  constructor(
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    private protectedPaths: string[] = []
  ) {}

  async execute() {
    const statusLines = await this.gitRepository.getStatusLines();
    const conflictingFiles = statusLines
      .filter(line => line.startsWith('UU') || line.startsWith('AA') || line.startsWith('AU') || line.startsWith('UA'))
      .map(line => {
        // Line format is "UU path"
        return line.slice(3).trim();
      });

    if (conflictingFiles.length === 0) {
      return { resolved: [], escalated: [] };
    }

    const resolved: string[] = [];
    const escalated: string[] = [];

    for (const file of conflictingFiles) {
      if (this.isProtected(file)) {
        escalated.push(file);
        continue;
      }

      const content = await this.fileSystem.readFile(file);
      const conflictResult = this.tryResolveConflict(file, content);

      if (conflictResult.success) {
        await this.fileSystem.writeFile(file, conflictResult.mergedContent);
        await this.gitRepository.add(file);
        resolved.push(file);
      } else {
        escalated.push(file);
      }
    }

    if (resolved.length > 0) {
      await this.logToInbox('MERGE_AUTO', resolved);
    }
    if (escalated.length > 0) {
      await this.logToInbox('MERGE_ESCALATE', escalated);
    }

    return { resolved, escalated };
  }

  private isProtected(file: string): boolean {
    return this.protectedPaths.some(p => file === p || file.startsWith(p + (p.endsWith('/') ? '' : '/')));
  }

  private tryResolveConflict(file: string, content: string): { success: boolean; mergedContent: string } {
    if (file === 'docs/INBOX.md') {
      return this.resolveInboxConflict(content);
    }
    if (file.startsWith('docs/tasks/') && file.endsWith('.md')) {
      return this.resolveTaskMetaConflict(content);
    }
    return { success: false, mergedContent: content };
  }

  private resolveInboxConflict(content: string): { success: boolean; mergedContent: string } {
    const conflictRegex = /<<<<<<< .*?\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> .*?\n/g;
    const matches = Array.from(content.matchAll(conflictRegex));
    
    if (matches.length === 0) return { success: false, mergedContent: content };

    // Check if it's "pure-append" - i.e. it's at the end of the file or only adds content
    // For INBOX, we just keep both.
    const mergedContent = content.replace(conflictRegex, (match, ours, theirs) => {
      return ours + theirs;
    });

    return { success: true, mergedContent };
  }

  private resolveTaskMetaConflict(content: string): { success: boolean; mergedContent: string } {
    const conflictRegex = /<<<<<<< .*?\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> .*?\n/g;
    const matches = Array.from(content.matchAll(conflictRegex));

    if (matches.length === 0) return { success: false, mergedContent: content };

    let onlyMetaConflict = true;
    const mergedContent = content.replace(conflictRegex, (match, ours, theirs) => {
      if (ours.trim().startsWith('**Meta:**') && theirs.trim().startsWith('**Meta:**')) {
        // Both sides modified the Meta line. We take 'theirs' as the more recent local intent.
        return theirs;
      } else {
        onlyMetaConflict = false;
        return match;
      }
    });

    return { success: onlyMetaConflict, mergedContent };
  }

  private async logToInbox(type: 'MERGE_AUTO' | 'MERGE_ESCALATE', files: string[]) {
    const inboxPath = 'docs/INBOX.md';
    const timestamp = new Date().toISOString();
    const entry = `\n## [${timestamp}] ${type} | ${files.join(', ')}\n`;
    
    let content = '';
    if (await this.fileSystem.exists(inboxPath)) {
      content = await this.fileSystem.readFile(inboxPath);
    }
    
    // If MERGE_AUTO, we already called git add on the resolved files.
    // If we are logging to INBOX, we should probably add INBOX too.
    await this.fileSystem.writeFile(inboxPath, content + entry);
    await this.gitRepository.add(inboxPath);
  }
}
