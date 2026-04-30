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

async function main() {
  const fileSystem = new NodeFileSystem();
  const taskRepository = new MarkdownTaskRepository(fileSystem);
  const gitRepository = new GitCli();
  const reviewer = new Reviewer();
  const rootPath = path.resolve('.');
  const require = createRequire(import.meta.url);
  const { version: cliVersion } = require('../package.json') as { version: string };
  const driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath, cliVersion);

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
      await new ValidateCommand(taskRepository, fileSystem).execute();
      break;
    case 'review':
      await new ReviewCommand(taskRepository, gitRepository, reviewer, driftChecker).execute(args);
      break;
    case 'task':
      await new TaskCommand(taskRepository, reviewer).execute(args);
      break;
    case 'inbox':
      await new InboxCommand(taskRepository, gitRepository, fileSystem, reviewer, driftChecker).execute();
      break;
    case 'next':
      await new NextCommand(taskRepository, args).execute();
      break;
    case 'version':
      await new VersionCommand(cliVersion).execute();
      break;
    case 'govern':
      await new GovernCommand(taskRepository, gitRepository, fileSystem).execute();
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
      await new LoopCommand(taskRepository, gitRepository).execute(args);
      break;
    default:
      console.log('Usage: arch [status|validate|review|task|inbox|next|version|govern|rank|batch|drain|conduct|promote|loop]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
