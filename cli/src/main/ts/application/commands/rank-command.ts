import { RankTasks } from '../use-cases/rank-tasks.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class RankCommand {
  private useCase: RankTasks;

  constructor(private taskRepository: TaskRepository) {
    this.useCase = new RankTasks(taskRepository);
  }

  async execute(): Promise<void> {
    const rankedTasks = await this.useCase.execute();
    
    console.log('\n  ARCH — Backlog Ranking (Priority > Size)\n');
    console.log('  ID        | P  | Size | Title');
    console.log('  ----------|----|------|-------------------------');
    
    for (const task of rankedTasks) {
      console.log(`  ${task.id.padEnd(10)}| ${task.priority.padEnd(3)}| ${task.size.padEnd(5)}| ${task.title}`);
    }
    console.log('');
  }
}
