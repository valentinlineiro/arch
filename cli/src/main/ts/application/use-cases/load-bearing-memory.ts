import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { Task } from '../../domain/models/task.js';
import { TaskStatus } from '../../domain/models/task.js';
import type { ContextIndex } from '../../domain/models/context-index.js';

const HEADER = '--- LOAD-BEARING CONTEXT ---';
const FOOTER = '----------------------------';
const MAX_DECISION_LENGTH = 120;

interface EnforcedAdr { id: string; title: string }
interface HanseiFailure { taskId: string; category: string; decision: string; cost: string }

export class LoadBearingMemory {
  private readonly indexPath = '.arch/context-index.json';

  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(task: Task): Promise<string | null> {
    const [adrs, failures] = await Promise.all([
      this.findEnforcedAdrs(task),
      this.findHanseiFailures(task),
    ]);

    if (adrs.length === 0 && failures.length === 0) return null;

    return this.format(adrs, failures);
  }

  private async findEnforcedAdrs(task: Task): Promise<EnforcedAdr[]> {
    try {
      const raw = await this.fileSystem.readFile(this.indexPath);
      const index = JSON.parse(raw) as ContextIndex;
      const results: EnforcedAdr[] = [];

      for (const [adrId, adr] of Object.entries(index.adrs)) {
        if (adr.strength !== 'enforced') continue;
        const overlaps = adr.affectedModules.some(mod =>
          task.context.some(ctx => mod.startsWith(ctx) || ctx.startsWith(mod))
        );
        if (overlaps) results.push({ id: adrId, title: adr.title });
      }

      return results.slice(0, 3);
    } catch {
      return [];
    }
  }

  private async findHanseiFailures(task: Task): Promise<HanseiFailure[]> {
    try {
      const all = await this.taskRepository.getAll();
      return all
        .filter(t =>
          t.id !== task.id &&
          t.status === TaskStatus.DONE &&
          t.hansei != null &&
          ['H1', 'H2', 'H3a', 'H3b'].includes(t.hansei.severity) &&
          t.class === task.class &&
          t.context.some(ctx =>
            task.context.some(tc => ctx === tc || ctx.startsWith(tc) || tc.startsWith(ctx))
          )
        )
        .slice(-3)
        .map(t => ({
          taskId: t.id,
          category: t.hansei!.category,
          decision: t.hansei!.decision.slice(0, MAX_DECISION_LENGTH),
          cost: t.hansei!.cost,
        }));
    } catch {
      return [];
    }
  }

  private format(adrs: EnforcedAdr[], failures: HanseiFailure[]): string {
    const lines: string[] = ['', HEADER];

    if (adrs.length > 0) {
      lines.push('');
      lines.push('Enforced ADRs:');
      for (const adr of adrs) {
        lines.push(`  ${adr.id}: ${adr.title} (enforced)`);
      }
    }

    if (failures.length > 0) {
      lines.push('');
      lines.push('Past Hansei Failures (same domain):');
      for (const f of failures) {
        lines.push(`  ${f.taskId} ${f.category}`);
        lines.push(`    Decision: ${f.decision}`);
        lines.push(`    Cost: ${f.cost}`);
      }
    }

    lines.push('');
    lines.push(FOOTER);

    return lines.join('\n');
  }
}
