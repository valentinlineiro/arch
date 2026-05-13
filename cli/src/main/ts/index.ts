#!/usr/bin/env node
import path from 'node:path';
import { createRequire } from 'node:module';
import { NodeFileSystem } from './infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from './infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from './infrastructure/cli/git-cli.js';
import { EventLogger } from './domain/services/event-logger.js';
import { Reviewer } from './domain/services/reviewer.js';
import { DriftChecker } from './application/use-cases/drift-checker.js';
import { parseCommand } from './infrastructure/cli/command-parser.js';
import { StatusCommand } from './application/commands/status-command.js';
import { ValidateCommand } from './application/commands/validate-command.js';
import { ReviewCommand } from './application/commands/review-command.js';
import { TaskCommand } from './application/commands/task-command.js';
import { InboxCommand } from './application/commands/inbox-command.js';
import { NextCommand } from './application/commands/next-command.js';
import { VersionCommand } from './application/commands/version-command.js';
import { GovernCommand } from './application/commands/govern-command.js';
import { RankCommand } from './application/commands/rank-command.js';
import { BatchCommand } from './application/commands/batch-command.js';
import { ConductCommand } from './application/commands/conduct-command.js';
import { PromoteCommand } from './application/commands/promote-command.js';
import { LoopCommand } from './application/commands/loop-command.js';
import { SandboxCommand } from './application/commands/sandbox-command.js';
import { SandboxService } from './domain/services/sandbox.js';
import { HumanCoordinationService } from './domain/services/human-coordination-service.js';
import { LintCommand } from './application/commands/lint-command.js';
import { MoveCommand } from './application/commands/move-command.js';
import { ExecCommand } from './application/commands/exec-command.js';
import { MergeResolveCommand } from './application/commands/merge-resolve-command.js';
import { IndexCommand } from './application/commands/index-command.js';
import { ChronicleEventRepository } from './infrastructure/filesystem/chronicle-event-repository.js';
import { AskCommand } from './application/commands/ask-command.js';
import { AskCorpus } from './application/use-cases/ask-corpus.js';
import { CausalCommand } from './application/commands/causal-command.js';
import { CausalGraph } from './application/use-cases/causal-graph.js';
import { CausalSignalLog } from './application/use-cases/causal-signal-log.js';
import { ReflectCommand } from './application/commands/reflect-command.js';
import { ReportCommand } from './application/commands/report-command.js';

async function main() {
  const fileSystem = new NodeFileSystem();
  const taskRepository = new MarkdownTaskRepository(fileSystem);
  const gitRepository = new GitCli();
  const eventRepository = new ChronicleEventRepository(fileSystem);
  const eventLogger = new EventLogger(fileSystem);
  const reviewer = new Reviewer();
  const sandboxService = new SandboxService();
  const rootPath = path.resolve('.');
  const require = createRequire(import.meta.url);
  const { version: cliVersion } = require('../package.json') as { version: string };
  const driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath, cliVersion);
  const humanCoordinationService = new HumanCoordinationService(taskRepository, gitRepository);
  const causalSignalLog = new CausalSignalLog(fileSystem, rootPath);

  const { name, args } = parseCommand(process.argv.slice(2));

  if (name === '--version' || name === '-v') {
    await new VersionCommand(cliVersion).execute();
    return;
  }

  switch (name) {
    case 'validate':
      process.stderr.write("Warning: 'arch validate' is deprecated. Use 'arch review' or 'arch review --fast' instead.\n");
      await new ValidateCommand(taskRepository, fileSystem, rootPath).execute(args);
      break;
    case 'review':
      await new ReviewCommand(taskRepository, gitRepository, reviewer, driftChecker, fileSystem).execute(args);
      break;
    case 'task': {
      let muriConfig;
      try {
        const configRaw = await fileSystem.readFile(`${rootPath}/arch.config.json`);
        muriConfig = JSON.parse(configRaw).muri;
      } catch { /* use default */ }
      await new TaskCommand(taskRepository, reviewer, humanCoordinationService, fileSystem, rootPath, eventRepository, causalSignalLog, gitRepository, muriConfig, eventLogger).execute(args);
      break;
    }
    case 'inbox':
      await new InboxCommand(taskRepository, fileSystem, reviewer, driftChecker).execute();
      break;
    case 'next': {
      process.stderr.write("Warning: 'arch next' is deprecated. Use 'arch task next' instead.\n");
      let muriConfig;
      try {
        const configRaw = await fileSystem.readFile(`${rootPath}/arch.config.json`);
        muriConfig = JSON.parse(configRaw).muri;
      } catch { /* use default: no budget check */ }
      await new NextCommand(taskRepository, args, muriConfig).execute();
      break;
    }
    case 'version':
      await new VersionCommand(cliVersion).execute();
      break;
    case 'govern':
      await new GovernCommand(taskRepository, gitRepository, fileSystem, causalSignalLog, rootPath).execute(args);
      break;
    case 'rank':
      process.stderr.write("Warning: 'arch rank' is deprecated. Use 'arch task rank' instead.\n");
      await new RankCommand(taskRepository).execute();
      break;
    case 'batch':
      await new BatchCommand(fileSystem).execute(args);
      break;
    case 'drain':
      await new BatchCommand(fileSystem).execute(['drain']);
      break;
    case 'conduct':
      await new ConductCommand().execute(args);
      break;
    case 'promote':
      process.stderr.write("Warning: 'arch promote' is deprecated. Use 'arch task promote' instead.\n");
      await new PromoteCommand(taskRepository, gitRepository, fileSystem).execute(args);
      break;
    case 'loop':
      await new LoopCommand(taskRepository, gitRepository, fileSystem, reviewer, driftChecker).execute(args);
      break;
    case 'sandbox':
      await new SandboxCommand(sandboxService, taskRepository, fileSystem).execute(args);
      break;
    case 'lint':
      process.stderr.write("Warning: 'arch lint' is deprecated. Use 'arch review' or 'arch review --fast' instead.\n");
      await new LintCommand(taskRepository, fileSystem).execute(args);
      break;
    case 'mv':
      await new MoveCommand(taskRepository, gitRepository, fileSystem).execute(args);
      break;
    case 'exec':
      await new ExecCommand(taskRepository, fileSystem).execute(args);
      break;
    case 'merge-resolve':
      await new MergeResolveCommand(gitRepository, fileSystem).execute();
      break;
    case 'index':
      await new IndexCommand(fileSystem, gitRepository).execute();
      break;
    case 'ask':
      await new AskCommand(new AskCorpus(fileSystem, rootPath, new CausalGraph(fileSystem, rootPath)), {
        getArgs: () => args,
        log: (s) => console.log(s),
        error: (s) => console.error(s),
        exit: (code) => process.exit(code) as never,
      }).execute();
      break;
    case 'reflect':
      await new ReflectCommand(fileSystem, rootPath).execute(args);
      break;
    case 'report':
      await new ReportCommand(fileSystem, gitRepository).execute();
      break;
    case 'causal': {
      const causalGraph = new CausalGraph(fileSystem, rootPath);
      await new CausalCommand(causalGraph, {
        getArgs: () => args,
        log: (s) => console.log(s),
        error: (s) => console.error(s),
        exit: (code) => process.exit(code) as never,
      }, causalSignalLog).execute();
      break;
    }
    default:
      console.log('Usage: arch [review|task|inbox|version|govern|batch|drain|conduct|loop|sandbox|mv|exec|merge-resolve|index|ask|causal|reflect]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
