import { Task, TaskStatus } from '../models/task.js';
import { TaskValidator } from './task-validator.js';

export interface ReviewResult {
  valid: boolean;
  violations: string[];
}

export class Reviewer {
  private static COMMIT_PREFIXES = ['feat:', 'fix:', 'chore:', 'docs:', 'refactor:', 'test:', 'perf:', 'idea:', 'task:'];

  public reviewTask(task: Task, rawMetaLine?: string): ReviewResult {
    const violations: string[] = [];

    // Rule: Canonical format (regex v0.6)
    if (rawMetaLine && !TaskValidator.isValidMeta(rawMetaLine)) {
      violations.push(`Task ${task.id} does not follow canonical v0.6 format in Meta line.`);
    }

    if (task.rawDependsLine && !TaskValidator.isValidDepends(task.rawDependsLine)) {
      violations.push(`Task ${task.id} does not follow canonical format in Depends line.`);
    }

    // Rule: English-first — task titles must be ASCII only (core.md language policy)
    if (/[^\x00-\x7F]/.test(task.title)) {
      violations.push(`WARN Task ${task.id} title contains non-ASCII characters — translate to English per language policy.`);
    }

    // Rule: AC completion before DONE or REVIEW
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.REVIEW) {
      if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
        const pendingACs = task.acceptanceCriteria.filter(ac => !ac.completed);
        if (pendingACs.length > 0) {
          violations.push(`Task ${task.id} marked as ${task.status} but has pending Acceptance Criteria: ${pendingACs.map(ac => ac.description).join(', ')}`);
        }
      }
    }

    // REVIEW is a valid handoff state after implementation. Final archive remains
    // guarded by scripts/arch.sh task done, which rejects unchecked ACs.

    return {
      valid: violations.length === 0,
      violations
    };
  }

  public validateImmutability(
    changedFiles: string[],
    commitMessage: string,
    protectedPaths: string[],
    activeTasks: Task[]
  ): ReviewResult {
    const violations: string[] = [];

    const violatedPaths = changedFiles.filter(file =>
      protectedPaths.some(protectedPath => file.startsWith(protectedPath))
    );

    if (violatedPaths.length > 0) {
      const hasADRReferenceInCommit = /ADR-\d{3}/.test(commitMessage);
      const hasADRReferenceInTasks = activeTasks.some(task => {
        const content = `${task.description} ${task.acceptanceCriteria.map(ac => ac.description).join(' ')} ${task.rawDependsLine || ''}`;
        return /ADR-\d{3}/.test(content);
      });

      if (!hasADRReferenceInCommit && !hasADRReferenceInTasks) {
        violations.push(`Warning: Protected path(s) modified without ADR reference: ${violatedPaths.join(', ')}`);
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  public validateCommitMessage(message: string): ReviewResult {
    const violations: string[] = [];
    const hasPrefix = Reviewer.COMMIT_PREFIXES.some(prefix => message.startsWith(prefix));
    
    // Rule: Allow governance tags as prefixes
    const isGovernance = message.startsWith('[THINK]') || message.startsWith('[KAIZEN]') || message.startsWith('[SELF-PROMOTION]');

    if (!hasPrefix && !isGovernance) {
      violations.push(`Commit message must start with one of: ${Reviewer.COMMIT_PREFIXES.join(', ')} or a governance tag ([THINK], [KAIZEN], [SELF-PROMOTION])`);
    }

    if (!message.startsWith('idea:') && !message.startsWith('task:') && !/\[TASK-\d{3}\]/.test(message) && !isGovernance) {
      violations.push('Commit message must reference a TASK-ID (e.g., [TASK-001])');
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}
