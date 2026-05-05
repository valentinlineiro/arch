import { Task } from '../models/task.js';

export class TaskValidator {
  private static TASK_HEADER_REGEX = /^## TASK-(?<id>\d{3}): (?<title>.+)$/;
  private static META_LINE_REGEX = /^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>[A-Z]+) \| (?<status>[A-Z_]+) \| (?<focus>Focus:yes|Focus:no) \| (?<class>[^|]+) \| (?<cli>[^|]+) \| (?<context>[^|]+?)(?: \| Cost: \$(?<cost>\d+\.\d{2}))?(?: \| Steps: (?<steps>\d+))?(?: \| Turns: (?<turns>\d+))?$/;
  private static DEPENDS_LINE_REGEX = /^\*\*Depends:\*\* (none|(TASK|ADR)-\d{3}(,\s?(TASK|ADR)-\d{3})*)$/;

  public static isValidHeader(header: string): boolean {
    return this.TASK_HEADER_REGEX.test(header);
  }

  public static isValidMeta(meta: string): boolean {
    return this.META_LINE_REGEX.test(meta);
  }

  public static isValidDepends(depends: string): boolean {
    return this.DEPENDS_LINE_REGEX.test(depends);
  }

  public static validateMeta(meta: string): string[] {
    const errors: string[] = [];
    const match = meta.match(this.META_LINE_REGEX);

    if (!match) {
      errors.push('Format mismatch: Meta line must follow "P[0-3] | Size | Status | Focus:yes/no | Class | CLI | Context"');
      return errors;
    }

    const { priority, size, status, focus, context } = match.groups!;
    
    if (!['XS', 'S', 'M', 'L', 'XL'].includes(size)) {
      errors.push(`Invalid Size: ${size}`);
    }
    
    if (!['IDEA', 'BACKLOG', 'READY', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED', 'REJECTED'].includes(status)) {
      errors.push(`Invalid Status: ${status}`);
    }

    if (!context || context.trim() === '') {
      errors.push('Missing Context paths');
    }

    return errors;
  }
}
