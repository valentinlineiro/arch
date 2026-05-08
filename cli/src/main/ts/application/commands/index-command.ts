import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';

export class IndexCommand {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
  ) {}

  async execute(): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);
    const contextRules = (config.contextRules as Record<string, { taskClasses: string[] }>) ?? {};
    const buildIndex = new BuildIndex(this.fileSystem);
    await buildIndex.execute(contextRules, this.gitRepository);
    console.log('  \x1b[32m✔\x1b[0m context index rebuilt → .arch/context-index.json');
  }
}
