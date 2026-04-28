import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { Reviewer, ReviewResult } from '../../domain/services/reviewer.js';
import { DriftChecker, DriftResult } from '../../domain/services/drift-checker.js';

export class ReviewSystem {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private reviewer: Reviewer,
    private driftChecker?: DriftChecker
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

    // 3. Review git diff (excluding archive/)
    const diff = await this.gitRepository.getDiff(['--', ':!docs/archive/**']);
    if (diff && diff.length > 5000) {
      violations.push('Warning: Large git diff detected. Ensure commits remain atomic.');
    }

    const drift: DriftResult[] = this.driftChecker ? await this.driftChecker.check() : [];
    
    // 4. Critical drift checks as violations
    for (const d of drift) {
      if (d.status === 'WARN' && ['ConfigPaths', 'DocVersion', 'DeadPaths'].includes(d.check)) {
        violations.push(...d.details.map(detail => `[${d.check}] ${detail}`));
      }
    }

    return {
      success: violations.length === 0,
      violations,
      drift
    };
  }
}
