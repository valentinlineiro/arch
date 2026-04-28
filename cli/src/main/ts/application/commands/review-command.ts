import { ReviewSystem } from '../use-cases/review-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../../domain/services/drift-checker.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { TaskStatus } from '../../domain/models/task.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export class ReviewCommand {
  private useCase: ReviewSystem;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private reviewer: Reviewer,
    private driftChecker: DriftChecker,
  ) {
    this.useCase = new ReviewSystem(taskRepository, gitRepository, reviewer, driftChecker);
  }

  public async nextTaskId(): Promise<string> {
    return this.taskRepository.getNextId();
  }

  async execute(): Promise<void> {
    const result = await this.useCase.execute();
    if (result.success) {
      fmt.ok('System Review: OK');
    } else {
      fmt.fail('System Review: FAILED');
      result.violations.forEach(v => console.log(`    - ${v}`));
    }
    if (result.drift.length > 0) {
      console.log(`\n  Drift`);
      for (const d of result.drift) {
        console.log(`    ${fmt.driftIcon(d.status)} ${d.check}`);
        d.details.forEach(detail => console.log(`        ${detail}`));
      }
    }
    console.log('');
    process.exit(result.success ? 0 : 1);
  }

  private async handleReviewFailure(violations: string[]): Promise<void> {
    const activeTasks = await this.taskRepository.getAll();
    const existingBugTask = activeTasks.find(t => 
      t.title === 'Fix arch review violations' && 
      (t.status === TaskStatus.READY || t.status === TaskStatus.IN_PROGRESS)
    );

    if (existingBugTask) {
      console.log(`\n  ${fmt.driftIcon('WARN')} Existing bug task found: ${existingBugTask.id}`);
      return;
    }

    const nextId = await this.nextTaskId();
    const bugTask = {
      id: nextId,
      title: 'Fix arch review violations',
      priority: 'P0',
      size: 'XS',
      value: 5,
      status: TaskStatus.READY,
      sprint: 'Focus:yes',
      class: '7-operations',
      cli: 'local',
      context: ['docs/tasks/'],
      acceptanceCriteria: violations.map(v => ({ description: v, completed: false })),
      rawMetaLine: `**Meta:** P0 | XS | 5 | READY | Focus:yes | 7-operations | local | docs/tasks/`
    };

    await this.taskRepository.save(bugTask);
    console.log(`\n  ${fmt.driftIcon('OK')} Created P0 bug task: ${nextId}`);

    // Commit atomically
    try {
      await execAsync(`git add docs/tasks/${nextId}.md && git commit -m "fix: [${nextId}] auto-create bug task for review violations"`);
      console.log(`  ${fmt.driftIcon('OK')} Committed bug task: ${nextId}`);
    } catch (error) {
      console.error(`  ${fmt.driftIcon('FAIL')} Failed to commit bug task: ${error}`);
    }
  }
}
