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

  async execute(): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);
    const protectedPaths = config.governance?.protectedPaths || [];
    
    const useCase = new MergeResolve(this.gitRepository, this.fileSystem, protectedPaths);
    const result = await useCase.execute();

    if (result.resolved.length > 0) {
      console.log(`Auto-resolved: ${result.resolved.join(', ')}`);
    }
    if (result.escalated.length > 0) {
      console.error(`Escalated (manual resolution required): ${result.escalated.join(', ')}`);
      process.exit(1);
    }

    if (result.resolved.length === 0 && result.escalated.length === 0) {
      console.log('No merge conflicts detected.');
    }
  }
}
