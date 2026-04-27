#!/usr/bin/env node
import path from 'node:path';
import { createRequire } from 'node:module';
import { NodeFileSystem } from './infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from './infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from './infrastructure/cli/git-cli.js';
import { Reviewer } from './domain/services/reviewer.js';
import { DriftChecker } from './domain/services/drift-checker.js';
import { GetSprintStatus } from './application/use-cases/get-sprint-status.js';
import { MarkTaskInProgress } from './application/use-cases/mark-task-in-progress.js';
import { ReviewSystem } from './application/use-cases/review-system.js';
import { ValidateSystem } from './application/use-cases/validate-system.js';
import { MarkTaskDone } from './application/use-cases/mark-task-done.js';
import { GenerateInbox } from './application/use-cases/generate-inbox.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

async function main() {
  const fileSystem = new NodeFileSystem();
  const taskRepository = new MarkdownTaskRepository(fileSystem);
  const gitRepository = new GitCli();
  const reviewer = new Reviewer();
  const rootPath = path.resolve('.');
  const require = createRequire(import.meta.url);
  const { version: cliVersion } = require('../package.json') as { version: string };
  const driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath, cliVersion);
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status': {
      const useCase = new GetSprintStatus(taskRepository);
      const status = await useCase.execute();
      console.log(`\n  ${GREEN}ARCH${NC} — Sprint Status`);
      console.log(`  READY: ${status.ready} | IN_PROGRESS: ${status.inProgress} | REVIEW: ${status.review} | DONE: ${status.done}\n`);
      break;
    }
    case 'validate': {
      const useCase = new ValidateSystem(taskRepository, fileSystem);
      const result = await useCase.execute();
      if (result.success) {
        console.log(`\n  ${GREEN}✔${NC} System Validation: OK\n`);
        process.exit(0);
      } else {
        console.log(`\n  ${RED}✖${NC} System Validation: FAILED`);
        result.errors.forEach(err => console.log(`    - ${err}`));
        console.log('');
        process.exit(1);
      }
      break;
    }
    case 'review': {
      const useCase = new ReviewSystem(taskRepository, gitRepository, reviewer, driftChecker);
      const result = await useCase.execute();
      if (result.success) {
        console.log(`\n  ${GREEN}✔${NC} System Review: OK`);
      } else {
        console.log(`\n  ${RED}✖${NC} System Review: FAILED`);
        result.violations.forEach(v => console.log(`    - ${v}`));
      }
      if (result.drift.length > 0) {
        console.log(`\n  Drift`);
        for (const d of result.drift) {
          const icon = d.status === 'OK' ? `${GREEN}✔${NC}` : `${YELLOW}⚠${NC}`;
          console.log(`    ${icon} ${d.check}`);
          d.details.forEach(detail => console.log(`        ${detail}`));
        }
      }
      console.log('');
      process.exit(result.success ? 0 : 1);
      break;
    }
    case 'task': {
      const subCommand = args[1];
      const taskId = args[2];
      if (subCommand === 'start' && taskId) {
        const useCase = new MarkTaskInProgress(taskRepository);
        try {
          await useCase.execute(taskId, 'cli');
          console.log(`  ${GREEN}→${NC} marking ${taskId} as IN_PROGRESS`);
        } catch (error: any) {
          console.error(`  ${YELLOW}Error:${NC} ${error.message}`);
        }
      } else if (subCommand === 'done' && taskId) {
        const useCase = new MarkTaskDone(taskRepository);
        try {
          await useCase.execute(taskId);
          console.log(`  ${GREEN}✓${NC} marking ${taskId} as DONE`);
        } catch (error: any) {
          console.error(`  ${YELLOW}Error:${NC} ${error.message}`);
        }
      } else {
        console.log('Usage: arch task [start|done] [TASK-ID]');
      }
      break;
    }
    case 'inbox': {
      const useCase = new GenerateInbox(taskRepository, gitRepository, fileSystem, reviewer, driftChecker);
      try {
        const path = await useCase.execute();
        console.log(`\n  ${GREEN}✔${NC} Inbox updated: ${path}\n`);
      } catch (error: any) {
        console.error(`  ${YELLOW}Error:${NC} ${error.message}`);
      }
      break;
    }
    default:
      console.log('Usage: arch [status|validate|review|task|inbox]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
