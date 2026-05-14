import { Task, TaskStatus, Hansei } from '../models/task.js';

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

    const { size, status, context } = match.groups!;
    
    if (!['XS', 'S', 'M', 'L', 'XL'].includes(size)) {
      errors.push(`Invalid Size: ${size}`);
    }
    
    if (!['IDEA', 'READY', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED', 'REJECTED'].includes(status)) {
      errors.push(`Invalid Status: ${status}`);
    }

    if (!context || context.trim() === '') {
      errors.push('Missing Context paths');
    }

    return errors;
  }

  public static validateHansei(task: Task): string[] {
    const errors: string[] = [];
    const hansei = task.hansei;

    // Hansei is required for M+ tasks, or if status is REVIEW/DONE
    const isMPlus = ['M', 'L', 'XL'].includes(task.size);
    const isClosing = [TaskStatus.REVIEW, TaskStatus.DONE].includes(task.status);

    if (!hansei) {
      if (isMPlus || isClosing) {
        errors.push('Missing Hansei section: Required for M+ tasks and when moving to REVIEW/DONE');
      }
      return errors;
    }

    // Validate Severity
    const validSeverities = ['H0', 'H1', 'H2', 'H3a', 'H3b'];
    if (!validSeverities.includes(hansei.severity)) {
      errors.push(`Invalid Hansei Severity: ${hansei.severity}. Must be one of ${validSeverities.join(', ')}`);
    }

    // Validate Category
    const validCategories = [
      '[TypeHack]', '[LeakyAbstraction]', '[DeferredTest]', '[ContextWaste]', '[SymbolDiscovery]', '[HiddenDependency]', '[SpecDrift]',
      '[ProcessViolation]', '[PrematureOptimization]', '[ReviewBlindspot]', '[MissingDecisionRecord]',
      '[ProvenanceBreak]', '[IntegrityCorruption]', '[FailOpenBehavior]', '[AuditGap]'
    ];
    if (!validCategories.includes(hansei.category)) {
      errors.push(`Invalid Hansei Category: ${hansei.category}. Extension requires a new ADR.`);
    }

    // Validate Fields
    if (!hansei.decision || hansei.decision.length < 5) {
      errors.push('Hansei Decision is too brief or missing.');
    }
    if (!hansei.constraint || hansei.constraint.length < 5) {
      errors.push('Hansei Constraint is too brief or missing.');
    }
    if (!hansei.cost || hansei.cost.length < 5) {
      errors.push('Hansei Cost is too brief or missing.');
    }

    // Logic: H2 requires evidence (Forward Action or Decision)
    if (hansei.severity === 'H2') {
      const hasEvidence = (hansei.forwardAction && hansei.forwardAction.includes('TASK-')) || 
                          (hansei.decision && (hansei.decision.includes('repeated') || hansei.decision.includes('occurrence')));
      if (!hasEvidence) {
        errors.push('Hansei Severity H2 requires evidence of systemic friction (e.g., link to IDEA/TASK in Forward Action).');
      }
    }

    // Logic: H3b requires Expiry Task and Owner
    if (hansei.severity === 'H3b') {
      const hasExpiry = hansei.forwardAction && /TASK-\d{3}/.test(hansei.forwardAction);
      const hasOwner = hansei.decision && (hansei.decision.includes('Owner:') || hansei.decision.includes('Approved by:'));
      if (!hasExpiry) {
        errors.push('Hansei Severity H3b requires an Expiry Task in Forward Action.');
      }
      if (!hasOwner) {
        errors.push('Hansei Severity H3b requires an Owner/Architect in Decision field.');
      }
    }

    return errors;
  }
}
