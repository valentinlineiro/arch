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
      .filter(line => {
        const status = line.slice(0, 2);
        return status.includes('U') || status === 'AA' || status === 'DD';
      })
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
    
    // Safety: singleton lines that should NEVER be auto-merged
    const singletons = [
      '# INBOX',
      '## Status Summary',
      '- **Active Tasks:**',
      '- **In Review:**',
      '- **Backlog (Ready):**',
      '## Urgent / Actions Required',
      '## Refinement Queue',
      '## Current Sprint',
      '## Recent Activity',
      '- **Last Commit:**'
    ];

    let allResolved = true;
    const mergedContent = content.replace(conflictRegex, (match, ours, theirs) => {
      const combined = (ours + theirs).trim();
      if (combined === '') return '';

      // Check for singletons in either side
      const hasSingleton = singletons.some(s => ours.includes(s) || theirs.includes(s));
      if (hasSingleton) {
        allResolved = false;
        return match;
      }

      // Verify both sides only contain valid entries (headers or bullet points)
      const lines = [...ours.split('\n'), ...theirs.split('\n')].filter(l => l.trim() !== '');
      const onlyEntries = lines.every(l => l.startsWith('## [') || l.startsWith('- ') || l.startsWith('**Task:**') || l.startsWith('**ACs:**') || l.startsWith('**Changed files:**'));
      
      if (!onlyEntries) {
        allResolved = false;
        return match;
      }

      return ours + theirs;
    });

    return { success: allResolved && content.match(conflictRegex) !== null, mergedContent };
  }

  private resolveTaskMetaConflict(content: string): { success: boolean; mergedContent: string } {
    const conflictRegex = /<<<<<<< .*?\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> .*?\n/g;
    
    // Status ranking for merging (higher is more "advanced")
    const statusRank: Record<string, number> = {
      'IDEA': 0,
      'BACKLOG': 1,
      'READY': 2,
      'IN_PROGRESS': 3,
      'REVIEW': 4,
      'DONE': 5,
      'BLOCKED': -1,
      'REJECTED': -1
    };

    const metaRegex = /^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>[A-Z]+) \| (?<status>[A-Z_]+) \| (?<focus>Focus:yes|Focus:no) \| (?<class>[^|]+) \| (?<cli>[^|]+) \| (?<context>[^|]+?)(?: \| Cost: \$(?<cost>\d+\.\d{2}))?(?: \| Steps: (?<steps>\d+))?(?: \| Turns: (?<turns>\d+))?$/;

    let allResolved = true;
    const mergedContent = content.replace(conflictRegex, (match, ours, theirs) => {
      const ourMatch = ours.trim().match(metaRegex);
      const theirMatch = theirs.trim().match(metaRegex);

      if (!ourMatch || !theirMatch) {
        allResolved = false;
        return match;
      }

      const o = ourMatch.groups!;
      const t = theirMatch.groups!;

      // 1. Immutable fields must match
      if (o.size !== t.size || o.class.trim() !== t.class.trim() || o.cli.trim() !== t.cli.trim()) {
        allResolved = false;
        return match;
      }

      // 2. Status check (Blocked/Rejected escalate)
      if (statusRank[o.status] === -1 || statusRank[t.status] === -1) {
        allResolved = false;
        return match;
      }

      // 3. Merge fields
      const priority = `P${Math.min(parseInt(o.priority), parseInt(t.priority))}`;
      const status = statusRank[o.status] >= statusRank[t.status] ? o.status : t.status;
      const focus = (o.focus === 'Focus:yes' || t.focus === 'Focus:yes') ? 'Focus:yes' : 'Focus:no';
      
      // Context union
      const contextO = o.context.split(',').map(s => s.trim());
      const contextT = t.context.split(',').map(s => s.trim());
      const context = Array.from(new Set([...contextO, ...contextT])).join(', ');

      // Metrics max
      const cost = Math.max(parseFloat(o.cost || '0'), parseFloat(t.cost || '0'));
      const steps = Math.max(parseInt(o.steps || '0'), parseInt(t.steps || '0'));
      const turns = Math.max(parseInt(o.turns || '0'), parseInt(t.turns || '0'));

      // 4. Reconstruct
      let mergedLine = `**Meta:** ${priority} | ${o.size} | ${status} | ${focus} | ${o.class.trim()} | ${o.cli.trim()} | ${context}`;
      if (cost > 0) mergedLine += ` | Cost: $${cost.toFixed(2)}`;
      if (steps > 0) mergedLine += ` | Steps: ${steps}`;
      if (turns > 0) mergedLine += ` | Turns: ${turns}`;

      return mergedLine + '\n';
    });

    return { success: allResolved && content.match(conflictRegex) !== null, mergedContent };
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
