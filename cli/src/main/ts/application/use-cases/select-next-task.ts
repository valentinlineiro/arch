import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Task, TaskStatus } from '../../domain/models/task.js';

export type HaltReason =
  | { kind: 'no_ready_tasks' }
  | { kind: 'stale_lock'; taskId: string; lockedAt: string }
  | { kind: 'winner_blocked'; taskId: string; blockedBy: string[] };

export type SelectNextResult =
  | { ok: true; task: Task }
  | { ok: false; halt: HaltReason };

const STALE_LOCK_DAYS = 3;

function taskIdNumber(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : Infinity;
}

function isStale(lockedAt: string): boolean {
  const locked = new Date(lockedAt).getTime();
  const now = Date.now();
  return (now - locked) > STALE_LOCK_DAYS * 24 * 60 * 60 * 1000;
}

function compareTasksForSort(a: Task, b: Task, priorityOrder: Record<string, number>): number {
  // 1. Focus:yes wins first
  const focusA = a.focus ? 0 : 1;
  const focusB = b.focus ? 0 : 1;
  if (focusA !== focusB) return focusA - focusB;

  // 2. Priority (P0 < P1 < P2 < P3)
  const pA = priorityOrder[a.priority] ?? 99;
  const pB = priorityOrder[b.priority] ?? 99;
  if (pA !== pB) return pA - pB;

  // 3. TASK-ID numerically ascending
  return taskIdNumber(a.id) - taskIdNumber(b.id);
}

export class SelectNextTask {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<SelectNextResult> {
    const allTasks = await this.taskRepository.getAll();
    const activeTasks = await this.taskRepository.getActive();

    // Check stale lock: any P0 IN_PROGRESS task locked > 3 days
    const staleP0 = activeTasks.find(
      t => t.status === TaskStatus.IN_PROGRESS && t.priority === 'P0' && t.lockedAt && isStale(t.lockedAt)
    );
    if (staleP0) {
      return { ok: false, halt: { kind: 'stale_lock', taskId: staleP0.id, lockedAt: staleP0.lockedAt! } };
    }

    const readyTasks = activeTasks.filter(t => t.status === TaskStatus.READY);

    if (readyTasks.length === 0) {
      return { ok: false, halt: { kind: 'no_ready_tasks' } };
    }

    const doneTaskIds = new Set(allTasks.filter(t => t.status === TaskStatus.DONE).map(t => t.id));

    function getUnresolvedDeps(task: Task): string[] {
      if (!task.depends || task.depends.length === 0) return [];
      if (task.depends.length === 1 && task.depends[0].toLowerCase() === 'none') return [];
      return task.depends.filter(dep => !doneTaskIds.has(dep));
    }

    const unblockedTasks = readyTasks.filter(t => getUnresolvedDeps(t).length === 0);

    const priorityOrder: Record<string, number> = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };

    unblockedTasks.sort((a, b) => compareTasksForSort(a, b, priorityOrder));

    if (unblockedTasks.length === 0) {
      // All ready tasks are blocked — report the top-priority ready task's blockers
      const sorted = [...readyTasks].sort((a, b) => compareTasksForSort(a, b, priorityOrder));
      const top = sorted[0];
      return { ok: false, halt: { kind: 'winner_blocked', taskId: top.id, blockedBy: getUnresolvedDeps(top) } };
    }

    return { ok: true, task: unblockedTasks[0] };
  }
}
