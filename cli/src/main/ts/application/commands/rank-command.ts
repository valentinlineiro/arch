import { RankTasks } from '../use-cases/rank-tasks.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class RankCommand {
  private useCase: RankTasks;

  constructor(private taskRepository: TaskRepository) {
    this.useCase = new RankTasks(taskRepository);
  }

  async execute(): Promise<void> {
    const rankedTasks = await this.useCase.execute();
    
    console.log('\n  ARCH — Backlog Ranking (Value / Size)\n');
    console.log('  ID        | P  | Size | Val | Ratio | Title');
    console.log('  ----------|----|------|-----|-------|-------------------------');
    
    const sizeMap: Record<string, number> = { 'XS': 1, 'S': 2, 'M': 3, 'L': 5, 'XL': 8 };

    for (const task of rankedTasks) {
      const sizeVal = sizeMap[task.size] || 1;
      const ratio = ((task.value || 0) / sizeVal).toFixed(2);
      
      console.log(`  ${task.id.padEnd(10)}| ${task.priority.padEnd(3)}| ${task.size.padEnd(5)}| ${task.value.toString().padEnd(4)}| ${ratio.padEnd(6)}| ${task.title}`);
    }
    console.log('');
  }
}
