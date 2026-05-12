import { GovernSystem } from '../use-cases/govern-system.js';
import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';

export class GovernCommand {
  private useCase: GovernSystem;

  constructor(
    taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    causalSignalLog?: CausalSignalLog
  ) {
    this.useCase = new GovernSystem(taskRepository, gitRepository, fileSystem, causalSignalLog);
  }

  async execute(args: string[] = []): Promise<void> {
    const noConduct = args.includes('--no-conduct');
    console.log('\n  ARCH — Governance Tick');
    await this.useCase.execute(noConduct);

    try {
      const config = await ConfigLoader.load(this.fileSystem);
      const contextRules = (config.contextRules as Record<string, { taskClasses: string[] }>) ?? {};
      const buildIndex = new BuildIndex(this.fileSystem);
      await buildIndex.execute(contextRules, this.gitRepository);
      console.log('  \x1b[32m✔\x1b[0m context index rebuilt');
    } catch {
      throw new Error('failed to rebuild context index during govern');
    }

    try {
      await this.gitRepository.add('.arch/context-index.json');
      await this.gitRepository.commit('chore: [THINK] rebuild context index');
    } catch {
      // Nothing changed or git not available — acceptable
    }

    console.log('');
  }
}
