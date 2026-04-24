#!/usr/bin/env node
import { NodeFileSystem } from './infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from './infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from './infrastructure/cli/git-cli.js';
import { Reviewer } from './domain/services/reviewer.js';
import { GetSprintStatus } from './application/use-cases/get-sprint-status.js';
import { MarkTaskInProgress } from './application/use-cases/mark-task-in-progress.js';
import { ReviewSystem } from './application/use-cases/review-system.js';
import { ValidateSystem } from './application/use-cases/validate-system.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

async function main() {
  const fileSystem = new NodeFileSystem();
  const taskRepository = new MarkdownTaskRepository(fileSystem);
  const gitRepository = new GitCli();
  const reviewer = new Reviewer();
  
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
      const useCase = new ReviewSystem(taskRepository, gitRepository, reviewer);
      const result = await useCase.execute();
      if (result.success) {
        console.log(`\n  ${GREEN}✔${NC} System Review: OK\n`);
        process.exit(0);
      } else {
        console.log(`\n  ${RED}✖${NC} System Review: FAILED`);
        result.violations.forEach(v => console.log(`    - ${v}`));
        console.log('');
        process.exit(1);
      }
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
      } else {
        console.log('Usage: arch task start [TASK-ID]');
      }
      break;
    }
    default:
      console.log('Usage: arch [status|validate|review|task]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
