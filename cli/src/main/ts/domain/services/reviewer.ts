import { Task, TaskStatus } from '../models/task.js';
import { TaskValidator } from './task-validator.js';

export interface ReviewResult {
  valid: boolean;
  violations: string[];
}

export class Reviewer {
  private static COMMIT_PREFIXES = ['feat:', 'fix:', 'chore:', 'docs:', 'refactor:', 'test:', 'idea:'];

  public reviewTask(task: Task, rawMetaLine?: string): ReviewResult {
    const violations: string[] = [];

    // Rule: Canonical format (regex v0.2)
    if (rawMetaLine && !TaskValidator.isValidMeta(rawMetaLine)) {
      violations.push(`Task ${task.id} does not follow canonical v0.2 format in Meta line.`);
    }

    // Rule: AC completion before DONE
    if (task.status === TaskStatus.DONE) {
      if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
        const pendingACs = task.acceptanceCriteria.filter(ac => !ac.completed);
        if (pendingACs.length > 0) {
          violations.push(`Task ${task.id} marked as DONE but has pending Acceptance Criteria: ${pendingACs.map(ac => ac.description).join(', ')}`);
        }
      } else {
        // If it's DONE but has NO ACs, that might be a violation too depending on guidelines
        // For now we assume some tasks might not have ACs defined in the markdown block
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

    if (!message.startsWith('idea:') && !/\[TASK-\d{3}\]/.test(message)) {
      violations.push('Commit message must reference a TASK-ID (e.g., [TASK-001])');
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}
