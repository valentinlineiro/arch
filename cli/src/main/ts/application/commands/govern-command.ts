import { Command } from '../../domain/models/command.js';
import { GovernSystem } from '../use-cases/govern-system.js';
import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { SubprocessRunner } from '../../infrastructure/cli/subprocess-runner.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class GovernCommand implements Command {
  private useCase: GovernSystem;

  constructor(
    taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    causalSignalLog?: CausalSignalLog,
    rootPath: string = '.'
  ) {
    this.useCase = new GovernSystem(taskRepository, gitRepository, fileSystem, causalSignalLog, rootPath);
  }

  async execute(args: string[] = []): Promise<void> {
    const noConduct = args.includes('--no-conduct');
    console.log('\n  ARCH — Governance Tick');
    const result = await this.useCase.execute(noConduct);

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
      await this.gitRepository.add(PathResolver.from({}).contextIndex);
      await this.gitRepository.commit('chore: [THINK] rebuild context index');
    } catch {
      // Nothing changed or git not available — acceptable
    }

    // Analysis side-effect: trigger arch analyze when replenishment or cadence conditions are met.
    // This is labeled explicitly as analysis — it never affects enforcement decisions.
    if (result.analysisNeeded && !noConduct) {
      console.log(`  → Triggering arch analyze [analysis] (reasons: ${result.reasons.join(', ')})`);
      SubprocessRunner.runSync('./scripts/arch.sh', ['analyze']);
    }

    console.log('');

    if (result.projectComplete === true) {
      process.exit(2);
    }
  }
}
