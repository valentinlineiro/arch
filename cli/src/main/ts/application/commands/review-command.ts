import { ReviewSystem } from '../use-cases/review-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../../domain/services/drift-checker.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

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

  async execute(args: string[] = []): Promise<void> {
    const isJson = args.includes('--json');
    const result = await this.useCase.execute();

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    }

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
}
