import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import { BatchSystem } from '../use-cases/batch-system.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class BatchCommand implements Command {
  private batchSystem: BatchSystem;

  constructor(fileSystem: FileSystem) {
    this.batchSystem = new BatchSystem(fileSystem);
  }

  async execute(args: string[]): Promise<number> {
    const subCommand = args[0];

    switch (subCommand) {
      case 'add':
        const taskId = args[1];
        const promptPath = args[2];
        if (taskId && promptPath) {
          await this.batchSystem.add(taskId, promptPath);
        } else {
          fmt.error('Usage: arch batch add [TASK-ID] [PROMPT-PATH]');
        }
        break;
      
      case 'drain':
        fmt.log('\n  ARCH — Draining batch queue...');
        await this.batchSystem.drain();
        break;

      default:
        fmt.log('Usage: arch batch [add|drain]');
    }
    return 0;
  }
}
