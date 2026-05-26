import path from 'node:path';
import { createRequire } from 'node:module';
import { NodeFileSystem } from './infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from './infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from './infrastructure/cli/git-cli.js';
import { ChronicleEventRepository } from './infrastructure/filesystem/chronicle-event-repository.js';
import { EventLogger } from './domain/services/event-logger.js';
import { Reviewer } from './domain/services/reviewer.js';
import { DriftChecker } from './application/use-cases/drift-checker.js';
import { SandboxService } from './domain/services/sandbox.js';
import { HumanCoordinationService } from './domain/services/human-coordination-service.js';
import { CausalSignalLog } from './application/use-cases/causal-signal-log.js';
import { TemporalIndex } from './application/use-cases/temporal-index.js';
import { parseCommand } from './infrastructure/cli/command-parser.js';
import { CommandDispatcher } from './application/command-dispatcher.js';
import { ConfigLoader } from './domain/services/config-loader.js';

async function main(): Promise<number> {
  try {
    const fileSystem = new NodeFileSystem();
    const config = await ConfigLoader.load(fileSystem);
    const taskRepository = new MarkdownTaskRepository(fileSystem);
    const gitRepository = new GitCli();
    const eventRepository = new ChronicleEventRepository(fileSystem);
    const eventLogger = new EventLogger(fileSystem, gitRepository, config.paths?.events ?? 'docs/EVENTS.md');
    const reviewer = new Reviewer();
    const sandboxService = new SandboxService();
    const rootPath = path.resolve('.');
    const require = createRequire(import.meta.url);
    const { version: cliVersion } = require('../package.json') as { version: string };
    const driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath, cliVersion);
    const humanCoordinationService = new HumanCoordinationService(taskRepository, gitRepository);
    const causalSignalLog = new CausalSignalLog(fileSystem, rootPath);
    const temporalIndex = new TemporalIndex(fileSystem, rootPath);

    const dispatcher = new CommandDispatcher(
      fileSystem,
      taskRepository,
      gitRepository,
      eventRepository,
      eventLogger,
      reviewer,
      sandboxService,
      rootPath,
      cliVersion,
      driftChecker,
      humanCoordinationService,
      causalSignalLog,
      temporalIndex
    );

    const { name, args } = parseCommand(process.argv.slice(2));
    return await dispatcher.dispatch(name, args);
  } catch (err: any) {
    console.error(`Error: ${err.message ?? err}`);
    return 1;
  }
}

process.exit(await main());
