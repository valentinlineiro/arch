import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Task, TaskStatus } from '../../domain/models/task.js';

export class RankTasks {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<Task[]> {
    const allTasks = await this.taskRepository.getAll();
    const readyTasks = allTasks.filter(t => t.status === TaskStatus.READY);
    
    const sizeMap: Record<string, number> = { 'XS': 1, 'S': 2, 'M': 3, 'L': 5, 'XL': 8 };
    const priorityOrder: Record<string, number> = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };

    return readyTasks.sort((a, b) => {
      // 1. Priority
      const pA = priorityOrder[a.priority] ?? 99;
      const pB = priorityOrder[b.priority] ?? 99;
      if (pA !== pB) return pA - pB;

      // 2. Size (Smaller is better: XS > S > M > L > XL)
      const sA = sizeMap[a.size] ?? 99;
      const sB = sizeMap[b.size] ?? 99;
      if (sA !== sB) return sA - sB;

      return a.id.localeCompare(b.id);
    });
  }
}
