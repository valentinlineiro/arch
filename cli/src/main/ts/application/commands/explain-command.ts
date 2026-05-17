import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { CausalSignalLog } from '../use-cases/causal-signal-log.js';

export class ExplainCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private causalSignalLog?: CausalSignalLog,
    private rootPath: string = '.',
  ) {}

  async execute(args: string[]): Promise<void> {
    const taskId = args.find(a => /^TASK-\d+$/.test(a));
    if (!taskId) {
      process.stderr.write('Usage: arch explain TASK-XXX\n');
      process.exit(1);
    }

    // Look in archive first (closed tasks have provenance), then active tasks
    let content: string | null = null;
    let source = '';
    try {
      content = await this.fileSystem.readFile(`${this.rootPath}/docs/archive/${taskId}.md`);
      source = 'archive';
    } catch {
      try {
        content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${taskId}.md`);
        source = 'tasks';
      } catch {
        process.stderr.write(`Task ${taskId} not found in archive or tasks/\n`);
        process.exit(1);
      }
    }

    if (!content) { process.exit(1); }

    console.log(`\n  \x1b[32mARCH\x1b[0m — ${taskId} Provenance\n`);

    // Title and status
    const titleMatch = content.match(/^## (TASK-\d+): (.*)/m);
    const metaMatch = content.match(/\*\*Meta:\*\*\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(\S+)/);
    if (titleMatch) console.log(`  ${titleMatch[1]}: ${titleMatch[2]}`);
    if (metaMatch) console.log(`  ${metaMatch[1]} ${metaMatch[2]} ${metaMatch[3]}\n`);

    // Origin: look for Spawned-from or matching IDEA in archive
    const spawnedFrom = content.match(/\*\*Spawned-from:\*\*\s*(TASK-\d+)/)?.[1];
    if (spawnedFrom) {
      console.log(`  Origin: decomposed from ${spawnedFrom}`);
    } else {
      // Search for IDEA that promoted to this task
      const ideaOrigin = await this.findIdeaOrigin(taskId);
      if (ideaOrigin) {
        console.log(`  Origin: promoted from ${ideaOrigin.slug}`);
        console.log(`    "${ideaOrigin.title}"`);
        if (ideaOrigin.decision) console.log(`    Decision: ${ideaOrigin.decision.slice(0, 80)}`);
      }
    }

    // Hansei
    const hansei = this.extractHansei(content);
    if (hansei) {
      console.log(`\n  Hansei:`);
      console.log(`    Severity:  ${hansei.severity}`);
      console.log(`    Category:  ${hansei.category}`);
      console.log(`    Decision:  ${hansei.decision.slice(0, 100)}`);
      if (hansei.constraint && hansei.constraint.toLowerCase() !== 'none.') {
        console.log(`    Constraint: ${hansei.constraint.slice(0, 100)}`);
      }
      if (hansei.forwardAction && hansei.forwardAction.toLowerCase() !== 'none required.') {
        console.log(`    Forward:   ${hansei.forwardAction.slice(0, 100)}`);
      }
    }

    // Causal signals emitted from this task
    if (this.causalSignalLog) {
      try {
        const signals = await this.causalSignalLog.all();
        const emitted = signals.filter(s => s.candidate_from === taskId || s.event?.includes(taskId));
        if (emitted.length > 0) {
          console.log(`\n  Signals emitted (${emitted.length}):`);
          for (const s of emitted.slice(0, 5)) {
            console.log(`    [${s.domain}] ${s.candidate_from} → ${s.candidate_to}`);
          }
        }
      } catch { /* causal log unavailable */ }
    }

    // Downstream: tasks that reference this as Forward Action or Spawned-from
    const related = await this.findRelated(taskId);
    if (related.length > 0) {
      console.log(`\n  Downstream (${related.length}):`);
      for (const r of related.slice(0, 5)) {
        console.log(`    → ${r.id}  ${r.status}  ${r.title?.slice(0, 50)}`);
      }
    }

    // Related: tasks with same Hansei category
    if (hansei?.category) {
      const sameCategory = await this.findSameCategory(taskId, hansei.category);
      if (sameCategory.length > 0) {
        console.log(`\n  Same category ${hansei.category} (${sameCategory.length} other tasks):`);
        for (const t of sameCategory.slice(0, 3)) {
          console.log(`    ${t.id}  ${t.title?.slice(0, 55)}`);
        }
      }
    }

    console.log('');
  }

  private extractHansei(content: string) {
    const idx = content.lastIndexOf('## Hansei');
    if (idx === -1) return null;
    const section = content.slice(idx);
    return {
      severity: section.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1] ?? '',
      category: section.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] ?? '',
      decision: section.match(/\*\*Decision:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim() ?? '',
      constraint: section.match(/\*\*Constraint:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim() ?? '',
      forwardAction: section.match(/\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim() ?? '',
    };
  }

  private async findIdeaOrigin(taskId: string): Promise<{ slug: string; title: string; decision: string } | null> {
    const archiveDir = `${this.rootPath}/docs/refinement/archive`;
    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(archiveDir); } catch { return null; }

    for (const file of files.filter(f => f.startsWith('IDEA-') && f.endsWith('.md'))) {
      try {
        const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
        if (content.includes(`PROMOTE → ${taskId}`) || content.includes(`→ ${taskId}`)) {
          const title = content.match(/^# IDEA: (.*)/m)?.[1]?.trim() ?? file.replace('.md', '');
          const decision = content.match(/## Decision\n([\s\S]*?)(?=\n##|$)/)?.[1]?.trim() ?? '';
          return { slug: file.replace('.md', ''), title, decision };
        }
      } catch { /* skip */ }
    }
    return null;
  }

  private async findRelated(taskId: string): Promise<Array<{ id: string; status: string; title: string }>> {
    const tasks = await this.taskRepository.getAll();
    return tasks
      .filter(t => t.id !== taskId && (
        t.content?.includes(taskId) ||
        (t as any).depends?.includes(taskId)
      ))
      .map(t => ({ id: t.id, status: t.status, title: t.title }))
      .slice(0, 10);
  }

  private async findSameCategory(taskId: string, category: string): Promise<Array<{ id: string; title: string }>> {
    const archiveDir = `${this.rootPath}/docs/archive`;
    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(archiveDir); } catch { return []; }

    const results: Array<{ id: string; title: string }> = [];
    for (const file of files.filter(f => f.startsWith('TASK-') && f.endsWith('.md')).slice(0, 50)) {
      const id = file.replace('.md', '');
      if (id === taskId) continue;
      try {
        const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
        if (content.includes(`**Category:** ${category}`)) {
          const title = content.match(/^## TASK-\d+: (.*)/m)?.[1]?.trim() ?? id;
          results.push({ id, title });
          if (results.length >= 5) break;
        }
      } catch { /* skip */ }
    }
    return results;
  }
}
