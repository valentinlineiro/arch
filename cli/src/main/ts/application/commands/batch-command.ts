import { BatchSystem } from '../use-cases/batch-system.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class BatchCommand {
  private batchSystem: BatchSystem;

  constructor(fileSystem: FileSystem) {
    this.batchSystem = new BatchSystem(fileSystem);
  }

  async execute(args: string[]): Promise<void> {
    const subCommand = args[0];

    switch (subCommand) {
      case 'add':
        const taskId = args[1];
        const promptPath = args[2];
        if (taskId && promptPath) {
          await this.batchSystem.add(taskId, promptPath);
        } else {
          console.error('Usage: arch batch add [TASK-ID] [PROMPT-PATH]');
        }
        break;
      
      case 'drain':
        console.log('\n  ARCH — Draining batch queue...');
        await this.batchSystem.drain();
        break;

      default:
        console.log('Usage: arch batch [add|drain]');
    }
  }
}
