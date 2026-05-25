import { ArchEvent, EventRepository } from '../models/event.js';
import { FileSystem } from '../repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class ChronicleEventRepository implements EventRepository {
  private readonly filePath = `${PathResolver.from({}).archDir}/chronicle.jsonl`;

  constructor(private fileSystem: FileSystem) {}

  async append(event: ArchEvent): Promise<void> {
    const line = JSON.stringify(event) + '\n';
    
    // Ensure .arch directory exists
    if (!(await this.fileSystem.exists('.arch'))) {
      await this.fileSystem.mkdir('.arch');
    }

    await this.fileSystem.appendFile(this.filePath, line);
  }
}
