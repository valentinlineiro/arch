import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Task, TaskStatus } from '../../domain/models/task.js';

export class SelectNextTask {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<Task | null> {
    const allTasks = await this.taskRepository.getAll();
    const readyTasks = allTasks.filter(t => t.status === TaskStatus.READY);
    
    // Filter out blocked tasks (those with dependencies not DONE)
    const doneTaskIds = new Set(allTasks.filter(t => t.status === TaskStatus.DONE).map(t => t.id));
    const unblockedTasks = readyTasks.filter(t => {
      if (!t.depends || t.depends.length === 0 || (t.depends.length === 1 && t.depends[0].toLowerCase() === 'none')) {
        return true;
      }
      return t.depends.every(depId => doneTaskIds.has(depId));
    });

    if (unblockedTasks.length === 0) {
      return null;
    }

    // Sort:
    // 1. Priority (P0 < P1 < P2 < P3)
    // 2. Focus (yes < no) - but wait, Meta line has Focus:yes/no. 
    // The Task model currently doesn't have an explicit 'focus' boolean field.
    // It's in the rawMetaLine.
    
    const priorityOrder: Record<string, number> = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
    const sizeMap: Record<string, number> = { 'XS': 1, 'S': 2, 'M': 3, 'L': 5, 'XL': 8 };

    unblockedTasks.sort((a, b) => {
      // 1. Priority
      const pA = priorityOrder[a.priority] ?? 99;
      const pB = priorityOrder[b.priority] ?? 99;
      if (pA !== pB) return pA - pB;

      // 2. Size (Smaller is better: XS > S > M > L > XL)
      const sA = sizeMap[a.size] ?? 99;
      const sB = sizeMap[b.size] ?? 99;
      if (sA !== sB) return sA - sB;

      // 3. Focus (yes > no)
      const focusA = a.rawMetaLine?.includes('Focus:yes') ? 0 : 1;
      const focusB = b.rawMetaLine?.includes('Focus:yes') ? 0 : 1;
      if (focusA !== focusB) return focusA - focusB;

      // 4. ID (as proxy for oldest)
      return a.id.localeCompare(b.id);
    });

    return unblockedTasks[0];
  }
}
