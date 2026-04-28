import { Task } from '../models/task.js';

export class TaskValidator {
  private static TASK_HEADER_REGEX = /^## TASK-(?<id>\d{3}): (?<title>.+)$/;
  private static META_LINE_REGEX = /^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>XS|S|M|L|XL) \| (?<value>10|[1-9]) \| (?<status>IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED) \| (?<sprint>Sprint \d+|Backlog|Focus:yes|Focus:no) \| (?<class>\d-[a-z-]+) \| (?<cli>[a-z-]+) \| (?<context>.+)$/;
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

  public static parseMeta(meta: string): any {
    const match = meta.match(this.META_LINE_REGEX);
    return match?.groups || null;
  }
}
