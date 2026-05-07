#!/usr/bin/env node
import path from 'node:path';
import { createRequire } from 'node:module';
import { NodeFileSystem } from './infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from './infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from './infrastructure/cli/git-cli.js';
import { Reviewer } from './domain/services/reviewer.js';
import { DriftChecker } from './domain/services/drift-checker.js';
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
import { MarkdownIntentRepository } from './infrastructure/filesystem/markdown-intent-repository.js';
import { CaptureIntent } from './application/use-cases/capture-intent.js';
import { CaptureCommand } from './application/commands/capture-command.js';
import { IndexCommand } from './application/commands/index-command.js';
import { ChronicleEventRepository } from './infrastructure/filesystem/chronicle-event-repository.js';

async function main() {
  const fileSystem = new NodeFileSystem();
  const taskRepository = new MarkdownTaskRepository(fileSystem);
  const gitRepository = new GitCli();
  const eventRepository = new ChronicleEventRepository(fileSystem);
  const reviewer = new Reviewer();
  const sandboxService = new SandboxService();
  const rootPath = path.resolve('.');
  const require = createRequire(import.meta.url);
  const { version: cliVersion } = require('../package.json') as { version: string };
  const driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath, cliVersion);
  const humanCoordinationService = new HumanCoordinationService(taskRepository, gitRepository);

  const { name, args } = parseCommand(process.argv.slice(2));

  if (name === '--version' || name === '-v') {
    await new VersionCommand(cliVersion).execute();
    return;
  }

  switch (name) {
    case 'status':
      await new StatusCommand(taskRepository, fileSystem).execute();
      break;
    case 'validate':
      await new ValidateCommand(taskRepository, fileSystem, rootPath).execute(args);
      break;
    case 'review':
      await new ReviewCommand(taskRepository, gitRepository, reviewer, driftChecker, fileSystem).execute(args);
      break;
    case 'task':
      await new TaskCommand(taskRepository, reviewer, humanCoordinationService, fileSystem, rootPath, eventRepository).execute(args);
      break;
    case 'inbox':
      await new InboxCommand(taskRepository, fileSystem, reviewer, driftChecker).execute();
      break;
    case 'next': {
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
      await new GovernCommand(taskRepository, gitRepository, fileSystem).execute(args);
      break;
    case 'rank':
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
      await new PromoteCommand(taskRepository, gitRepository, fileSystem).execute(args);
      break;
    case 'loop':
      await new LoopCommand(taskRepository, gitRepository, fileSystem, reviewer, driftChecker).execute(args);
      break;
    case 'sandbox':
      await new SandboxCommand(sandboxService, taskRepository, fileSystem).execute(args);
      break;
    case 'lint':
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
    case 'capture': {
      const intentRepository = new MarkdownIntentRepository(fileSystem);
      const captureIntent = new CaptureIntent(intentRepository, gitRepository);
      await new CaptureCommand(captureIntent).execute(args);
      break;
    }
    case 'index':
      await new IndexCommand(fileSystem).execute();
      break;
    default:
      console.log('Usage: arch [status|validate|review|task|inbox|next|version|govern|rank|batch|drain|conduct|promote|loop|sandbox|lint|mv|exec|merge-resolve|capture|index]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
