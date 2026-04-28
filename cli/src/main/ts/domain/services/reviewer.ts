import { Task, TaskStatus } from '../models/task.js';
import { TaskValidator } from './task-validator.js';

export interface ReviewResult {
  valid: boolean;
  violations: string[];
}

export class Reviewer {
  private static COMMIT_PREFIXES = ['feat:', 'fix:', 'chore:', 'docs:', 'refactor:', 'test:', 'idea:', 'task:'];

  public reviewTask(task: Task, rawMetaLine?: string): ReviewResult {
    const violations: string[] = [];

    // Rule: Canonical format (regex v0.5)
    if (rawMetaLine && !TaskValidator.isValidMeta(rawMetaLine)) {
      violations.push(`Task ${task.id} does not follow canonical v0.5 format in Meta line.`);
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

    // Rule: Warning for REVIEW task with all ACs completed (TASK-083)
    if (task.status === TaskStatus.REVIEW) {
      if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
        const allCompleted = task.acceptanceCriteria.every(ac => ac.completed);
        if (allCompleted) {
          violations.push(`Warning: Task ${task.id} has all ACs completed but is still in REVIEW state. Suggested action: arch task done ${task.id}`);
        }
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
    if (!hasPrefix) {
      violations.push(`Commit message must start with one of: ${Reviewer.COMMIT_PREFIXES.join(', ')}`);
    }

    if (!message.startsWith('idea:') && !message.startsWith('task:') && !/\[TASK-\d{3}\]/.test(message)) {
      violations.push('Commit message must reference a TASK-ID (e.g., [TASK-001])');
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}
