import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Task, TaskStatus, FocusLevel } from '../../domain/models/task.js';

export type MuriThreshold = { turns: number; cost: number };
export type MuriConfig = Record<string, MuriThreshold>;

export type HaltReason =
  | { kind: 'no_ready_tasks' }
  | { kind: 'stale_lock'; taskId: string; lockedAt: string }
  | { kind: 'budget_exceeded'; taskId: string; current: number; limit: number; type: 'turns' | 'cost' }
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
  const focusA = a.focus !== FocusLevel.NONE ? 0 : 1;
  const focusB = b.focus !== FocusLevel.NONE ? 0 : 1;
  if (focusA !== focusB) return focusA - focusB;

  // 2. Priority (P0 < P1 < P2 < P3)
  const pA = priorityOrder[a.priority] ?? 99;
  const pB = priorityOrder[b.priority] ?? 99;
  if (pA !== pB) return pA - pB;

  // 3. TASK-ID numerically ascending
  return taskIdNumber(a.id) - taskIdNumber(b.id);
}

export class SelectNextTask {
  constructor(private taskRepository: TaskRepository, private muriConfig?: MuriConfig) {}

  async execute(filter?: { sprintSlug?: string }): Promise<SelectNextResult> {
    const allTasks = await this.taskRepository.getAll();
    let activeTasks = await this.taskRepository.getActive();

    if (filter?.sprintSlug) {
      const slug = filter.sprintSlug;
      const normalised = slug.startsWith('sprint/') ? slug : `sprint/${slug}`;
      activeTasks = activeTasks.filter(t => t.sprint === normalised || t.sprint === slug);
    }

    // Check stale lock: any P0 IN_PROGRESS task locked > 3 days
    const staleP0 = activeTasks.find(
      t => t.status === TaskStatus.IN_PROGRESS && t.priority === 'P0' && t.lockedAt && isStale(t.lockedAt)
    );
    if (staleP0) {
      return { ok: false, halt: { kind: 'stale_lock', taskId: staleP0.id, lockedAt: staleP0.lockedAt! } };
    }

    // Check budget: any IN_PROGRESS task exceeding its muri threshold
    if (this.muriConfig) {
      for (const task of activeTasks) {
        if (task.status !== TaskStatus.IN_PROGRESS) continue;
        const threshold = this.muriConfig[task.size];
        if (!threshold) continue;
        if (task.steps !== undefined && task.steps > threshold.turns) {
          return { ok: false, halt: { kind: 'budget_exceeded', taskId: task.id, current: task.steps, limit: threshold.turns, type: 'turns' } };
        }
        if (task.cost !== undefined && task.cost > threshold.cost) {
          return { ok: false, halt: { kind: 'budget_exceeded', taskId: task.id, current: task.cost, limit: threshold.cost, type: 'cost' } };
        }
      }
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
