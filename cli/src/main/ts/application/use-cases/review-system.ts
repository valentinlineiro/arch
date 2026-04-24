import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { Reviewer, ReviewResult } from '../../domain/services/reviewer.js';

export class ReviewSystem {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private reviewer: Reviewer
  ) {}

  async execute() {
    const violations: string[] = [];
    
    // 1. Review all tasks for state consistency and canonical format
    const tasks = await this.taskRepository.getAll();
    for (const task of tasks) {
      const result = this.reviewer.reviewTask(task, task.rawMetaLine);
      if (!result.valid) {
        violations.push(...result.violations);
      }
    }

    // 2. Review last commit message
    const lastCommit = await this.gitRepository.getLastCommitMessage();
    if (lastCommit) {
      const result = this.reviewer.validateCommitMessage(lastCommit);
      if (!result.valid) {
        violations.push(`Last commit message violation: ${result.violations.join('; ')}`);
      }
    }

    // 3. Review git diff
    const diff = await this.gitRepository.getDiff();
    if (diff && diff.length > 5000) {
      violations.push('Warning: Large git diff detected. Ensure commits remain atomic.');
    }

    return {
      success: violations.length === 0,
      violations
    };
  }
}
