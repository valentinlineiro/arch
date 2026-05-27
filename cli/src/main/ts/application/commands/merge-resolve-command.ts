import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import { MergeResolve } from '../use-cases/merge-resolve.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';

export class MergeResolveCommand implements Command {
  constructor(
    private gitRepository: GitRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(): Promise<number> {
    const config = await ConfigLoader.load(this.fileSystem);
    const protectedPaths = config.governance?.protectedPaths || [];
    
    const useCase = new MergeResolve(this.gitRepository, this.fileSystem, protectedPaths);
    const result = await useCase.execute();

    if (result.resolved.length > 0) {
      fmt.log(`Auto-resolved: ${result.resolved.join(', ')}`);
    }
    if (result.escalated.length > 0) {
      fmt.error(`Escalated (manual resolution required): ${result.escalated.join(', ')}`);
      return 1;
    }

    if (result.resolved.length === 0 && result.escalated.length === 0) {
      fmt.log('No merge conflicts detected.');
    }
    return 0;
  }
}
