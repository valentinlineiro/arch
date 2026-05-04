import { GenerateInbox, InboxData } from '../use-cases/generate-inbox.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../../domain/services/drift-checker.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class InboxCommand {
  private useCase: GenerateInbox;

  constructor(
    taskRepository: TaskRepository,
    fileSystem: FileSystem,
    reviewer: Reviewer,
    driftChecker: DriftChecker,
  ) {
    this.useCase = new GenerateInbox(taskRepository, fileSystem, reviewer, driftChecker);
  }

  async execute(): Promise<void> {
    try {
      const data = await this.useCase.execute();
      this.render(data);
    } catch (error: any) {
      fmt.warn(error.message);
    }
  }

  private render(data: InboxData): void {
    fmt.header('Interactive Inbox');

    console.log(`\n  Summary:`);
    console.log(`    - Active: ${data.summary.active}`);
    console.log(`    - Review: ${data.summary.review}`);
    console.log(`    - Ready:  ${data.summary.ready}`);

    console.log(`\n  Urgent / Actions Required:`);
    if (data.urgent.length > 0) {
      data.urgent.forEach(item => fmt.warn(item));
    } else {
      console.log(`    _No urgent items._`);
    }

    if (data.sprint) {
      console.log(`\n  Sprint: ${data.sprint.name} (${data.sprint.progress})`);
      if (data.sprint.openTasks.length > 0) {
        data.sprint.openTasks.forEach(t => {
          const focus = t.focus ? ' [FOCUS]' : '';
          console.log(`    - [${t.id}] ${t.title}${focus}`);
        });
      }
    }

    console.log(`\n  Refinement Queue:`);
    if (data.refinement.length > 0) {
      data.refinement.forEach(idea => console.log(`    - ${idea}`));
    } else {
      console.log(`    _No pending ideas._`);
    }

    console.log(`\n  Commands:`);
    console.log(`    arch task approve <task-id>  - Move REVIEW/IDEA to DONE/READY`);
    console.log(`    arch task redirect <task-id> --to "<msg>" - Move REVIEW to IN_PROGRESS`);
    console.log('');
  }
}
