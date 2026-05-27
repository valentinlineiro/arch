import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import { RankTasks } from '../use-cases/rank-tasks.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class RankCommand implements Command {
  private useCase: RankTasks;

  constructor(private taskRepository: TaskRepository) {
    this.useCase = new RankTasks(taskRepository);
  }

  async execute(): Promise<number> {
    const rankedTasks = await this.useCase.execute();
    
    fmt.log('\n  ARCH — Backlog Ranking (Priority > Size)\n');
    fmt.log('  ID        | P  | Size | Title');
    fmt.log('  ----------|----|------|-------------------------');
    
    for (const task of rankedTasks) {
      fmt.log(`  ${task.id.padEnd(10)}| ${task.priority.padEnd(3)}| ${task.size.padEnd(5)}| ${task.title}`);
    }
    fmt.log('');
    return 0;
  }
}
