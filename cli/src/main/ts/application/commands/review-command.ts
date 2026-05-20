import { ReviewSystem } from '../use-cases/review-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../use-cases/drift-checker.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';
import { HanseiWizard } from '../use-cases/hansei-wizard.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class ReviewCommand {
  private useCase: ReviewSystem;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private reviewer: Reviewer,
    private driftChecker: DriftChecker,
    private fileSystem: FileSystem,
  ) {
    this.useCase = new ReviewSystem(taskRepository, gitRepository, reviewer, fileSystem, driftChecker);
  }


  private async executeScopedReview(taskId: string): Promise<void> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      fmt.fail(`Task ${taskId} not found`);
      process.exit(1);
    }

    fmt.header(`Scoped Review — ${taskId}`);
    console.log('');

    let allPass = true;

    // 1. AC verification
    console.log('  Acceptance Criteria:');
    const verifier = new DeterministicACVerifier();
    const acResult = await verifier.verify(task);
    for (const ev of acResult.evidence) {
      const icon = ev.pass ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
      const typeTag = `[${ev.type}]`.padEnd(8);
      console.log(`    ${icon} ${typeTag} ${ev.ac.slice(0, 70)}`);
      if (!ev.pass) {
        console.log(`           ${ev.detail.split('\n')[0]}`);
        allPass = false;
      }
    }
    if (acResult.evidence.length === 0) {
      console.log('    (no predicates to verify)');
    }

    // 2. Hansei completeness
    console.log('');
    console.log('  Hansei:');
    const hanseiComplete = HanseiWizard.isHanseiComplete(task.content ?? '');
    const hanseiIcon = hanseiComplete ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
    console.log(`    ${hanseiIcon} [hansei]  ${hanseiComplete ? 'Complete' : 'Incomplete — missing or placeholder fields'}`);
    if (!hanseiComplete) allPass = false;

    // 3. Meta line compliance
    console.log('');
    console.log('  Meta compliance:');
    const VALID_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
    const VALID_SIZES = new Set(['XS', 'S', 'M', 'L']);
    const metaChecks: Array<{ label: string; pass: boolean }> = [
      { label: 'Priority', pass: VALID_PRIORITIES.has(task.priority?.trim() ?? '') },
      { label: 'Size', pass: VALID_SIZES.has(task.size?.trim() ?? '') },
      { label: 'Class', pass: !!task.class?.trim() },
    ];
    for (const check of metaChecks) {
      const icon = check.pass ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
      console.log(`    ${icon} [meta]    ${check.label}`);
      if (!check.pass) allPass = false;
    }

    console.log('');
    if (allPass) {
      console.log('  \x1b[32m✔\x1b[0m All checks passed. Task is ready for DONE.');
    } else {
      console.error('  \x1b[31m✖\x1b[0m Review failed — resolve issues before closing.');
      process.exit(1);
    }
  }
  async execute(args: string[] = []): Promise<void> {
    const isJson = args.includes('--json');
    const isFast = args.includes('--fast');
    const isPush = args.includes('--push');
    const isStaged = args.includes('--staged');
    const isFull = args.includes('--full');

    // --task TASK-XXX: scoped Auditor review
    const taskArgIdx = args.indexOf('--task');
    if (taskArgIdx !== -1 && args[taskArgIdx + 1]) {
      await this.executeScopedReview(args[taskArgIdx + 1]);
      return;
    }

    const scope = isStaged ? 'delta' : isFull ? 'full' : 'hybrid';
    const system = isFast
      ? new ReviewSystem(this.taskRepository, this.gitRepository, this.reviewer, this.fileSystem)
      : this.useCase;
    const result = await system.execute({ scope });

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

    if (isPush && result.success) {
      const { execSync } = await import('child_process');
      console.log('  Pushing to remote...');
      execSync('git push', { stdio: 'inherit' });
    }

    process.exit(result.success ? 0 : 1);
  }
}
