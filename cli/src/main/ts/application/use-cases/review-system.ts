import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Task, TaskStatus } from '../../domain/models/task.js';
import { Reviewer, ReviewResult } from '../../domain/services/reviewer.js';
import { DriftChecker, DriftResult } from '../use-cases/drift-checker.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { FOCUS_LEDGER_PATH, parseLedger, committedRulings, LedgerState } from './focus-ledger.js';

export type ReviewCondition = 'NONE' | 'FOCUS_SOVEREIGNTY' | 'FOCUS_INTEGRITY_VIOLATION';

export class ReviewSystem {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private reviewer: Reviewer,
    private fileSystem: FileSystem,
    private driftChecker?: DriftChecker
  ) {}

  async execute() {
    const violations: string[] = [];
    
    // 1. Review active tasks only — archive uses legacy formats and is excluded
    const tasks = await this.taskRepository.getActive();
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

    // 3. Immutability Check (TASK-154)
    try {
      const config = await ConfigLoader.load(this.fileSystem);
      const protectedPaths = config.governance?.protectedPaths || [];
      if (protectedPaths.length > 0) {
        const changedFiles = await this.gitRepository.getChangedFilesInLastCommit();
        if (lastCommit) {
          const immutabilityResult = this.reviewer.validateImmutability(
            changedFiles,
            lastCommit,
            protectedPaths,
            tasks
          );
          if (!immutabilityResult.valid) {
            violations.push(...immutabilityResult.violations);
          }
        }
      }
    } catch {
      // Ignore config read errors here, drift checker will catch them
    }

    // 4. Review git diff (excluding archive/)
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

    // 5. Focus sovereignty check
    const config = await ConfigLoader.load(this.fileSystem).catch(() => ({}));
    const sovereigntyCondition = await this.checkFocusSovereignty(tasks, config);
    if (sovereigntyCondition === 'FOCUS_INTEGRITY_VIOLATION') {
      violations.push('[FocusSovereignty] FOCUS_INTEGRITY_VIOLATION: task holds Focus:yes with no FOCUS_ACQUIRED ruling in committed ledger — run arch govern to recover');
    } else if (sovereigntyCondition === 'FOCUS_SOVEREIGNTY') {
      violations.push('[FocusSovereignty] FOCUS_SOVEREIGNTY: eligible higher-priority task exists and inercia window has expired — run arch govern to adjudicate');
    }

    return {
      success: violations.length === 0,
      violations,
      drift,
      sovereigntyCondition,
    };
  }

  private async checkFocusSovereignty(activeTasks: Task[], config: any): Promise<ReviewCondition> {
    try {
      let ledger: LedgerState = { lastCommittedTick: 0, rulings: [] };
      if (await this.fileSystem.exists(FOCUS_LEDGER_PATH)) {
        const content = await this.fileSystem.readFile(FOCUS_LEDGER_PATH);
        ledger = parseLedger(content);
      }
      const committed = committedRulings(ledger);

      // FOCUS_INTEGRITY_VIOLATION: task has Focus:yes with no FOCUS_ACQUIRED in committed ledger
      for (const t of activeTasks) {
        if (!t.focus) continue;
        const hasAcquisition = committed.some(r => r.action === 'FOCUS_ACQUIRED' && r.taskId === t.id);
        if (!hasAcquisition) return 'FOCUS_INTEGRITY_VIOLATION';
      }

      const focused = activeTasks.find(t => t.focus) ?? null;
      if (!focused) return 'NONE';

      // Build doneTaskIds from all tasks (including archived)
      const allTasks = await this.taskRepository.getAll();
      const doneTaskIds = new Set(allTasks.filter(t => t.status === TaskStatus.DONE).map(t => t.id));

      const eligible = activeTasks.filter(t => {
        if (t.status !== TaskStatus.READY) return false;
        if (t.focus) return false;
        const deps = (t.depends ?? []).filter(d => d.toLowerCase() !== 'none');
        return deps.every(dep => doneTaskIds.has(dep));
      });

      const minTicks: number = config?.minTicksBeforeSwitch ?? 2;
      const acquiredRulings = committed.filter(r => r.action === 'FOCUS_ACQUIRED');
      const lastAcquired = acquiredRulings[acquiredRulings.length - 1] ?? null;
      const nextTick = ledger.lastCommittedTick + 1;
      const ticksSinceAcquired = nextTick - (lastAcquired?.tick ?? 0);

      if (ticksSinceAcquired < minTicks) return 'NONE';

      const focusedPriority = parseInt(focused.priority.replace('P', ''), 10);
      const preemptor = eligible.find(c => parseInt(c.priority.replace('P', ''), 10) < focusedPriority);
      if (!preemptor) return 'NONE';

      // Sovereignty: preemptor has higher priority, window expired, and focus is still on lower-priority task
      const lastAcquiredId = lastAcquired?.taskId ?? null;
      if (preemptor.id !== lastAcquiredId) return 'FOCUS_SOVEREIGNTY';

      return 'NONE';
    } catch {
      return 'NONE';
    }
  }
}
