#!/usr/bin/env node
import { MarkdownTaskRepository } from './adapters/filesystem/markdown-task-repository.js';

async function main() {
  const repo = new MarkdownTaskRepository();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      // Port status logic
      break;
    case 'exec':
      // Port exec logic
      break;
    default:
      console.log('Usage: arch [conduct|exec|refine|retro|human|status|task]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
