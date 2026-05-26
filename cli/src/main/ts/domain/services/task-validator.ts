import { Task, TaskStatus, Hansei } from '../models/task.js';

export class TaskValidator {
  private static TASK_HEADER_REGEX = /^## TASK-(?<id>\d{3,}): (?<title>.+)$/;
  private static META_LINE_REGEX = /^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>[A-Z]+) \| (?<status>[A-Z_]+) \| (?<focus>Focus:yes|Focus:no) \| (?<class>[^|]+) \| (?<cli>[^|]+) \| (?<context>[^|]+?)(?: \| Cost: \$(?<cost>\d+\.\d{2}))?(?: \| Steps: (?<steps>\d+))?(?: \| Turns: (?<turns>\d+))?$/;
  private static DEPENDS_LINE_REGEX = /^\*\*Depends:\*\* (none|(TASK|ADR)-\d{3,}(,\s?(TASK|ADR)-\d{3,})*)$/;

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

    // Hansei is required for M+ tasks only. XS/S tasks have optional Hansei (triggered basis).
    const isMPlus = ['M', 'L', 'XL'].includes(task.size);

    if (!hansei) {
      if (isMPlus) {
        errors.push('Missing Hansei section: Required for M+ tasks');
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
    const vaguePhrases = [
      'temporary workaround', 'some debt', 'minor debt', 'cleanup later', 
      'later cleanup', 'due to complexity', 'no major impact', 'fix later'
    ];

    const validateFieldContent = (field: string, name: string) => {
      if (!field || field.length < 10) {
        errors.push(`Hansei ${name} is too brief (minimum 10 characters).`);
      } else if (vaguePhrases.some(v => field.toLowerCase().includes(v))) {
        errors.push(`Hansei ${name} contains vague phrasing; provide specific diagnostic detail.`);
      }
    };

    validateFieldContent(hansei.decision, 'Decision');
    validateFieldContent(hansei.constraint, 'Constraint');
    validateFieldContent(hansei.cost, 'Cost');

    // Status gate: specific content rules apply only to tasks that have been worked
    const isInPlay = task.status === TaskStatus.IN_PROGRESS ||
      task.status === TaskStatus.REVIEW ||
      task.status === TaskStatus.DONE;

    if (isInPlay) {
      // 1. Placeholder rejection — catch default template values and empty filler (all sizes)
      const placeholderPattern = /^(not yet started|none\.?|tbd|todo|none required|not applicable|n\/?a|nil)$/i;
      const textFields = [
        { value: hansei.decision, name: 'Decision' },
        { value: hansei.constraint, name: 'Constraint' },
        { value: hansei.cost, name: 'Cost' },
        { value: hansei.forwardAction, name: 'Forward Action' },
      ];
      for (const field of textFields) {
        if (field.value && placeholderPattern.test(field.value.trim())) {
          errors.push(`Hansei ${field.name} is a placeholder (${field.value.trim()}). Provide specific diagnostic content.`);
        }
      }

      // 2–3: Specific-content + H0 justification apply to M+ tasks only (XS/S are bounded enough that generic Hansei is acceptable)
      if (isMPlus) {
        const joined = textFields.map(f => f.value).filter(Boolean).join(' ');
        const hasSpecificRef = /(AC[- ]?\d|TASK-\d{3,}|IDEA-\d{3,}|`[^`]+`|\b\w+\.\w{2,4}\b|\b(src|docs|cli|test)\/)/i.test(joined);

        if (!hasSpecificRef) {
          errors.push('Hansei lacks task-specific references. Include at least one: AC number (e.g. "AC1"), TASK/IDEA reference, file path, or quoted command (`command`).');
        }

        if (hansei.severity === 'H0' && (!hansei.decision || hansei.decision.length < 30)) {
          errors.push('Hansei Severity H0 requires a justification explaining why no deviation occurred (Decision must be ≥30 characters).');
        }
      }
    }

    // Logic: H3a is a blocking invalidity — requires immediate rejection before closure
    if (hansei.severity === 'H3a') {
      errors.push('BLOCKING: Hansei Severity H3a (Blocking Invalidity) requires task rejection before closure. Resolve the constitutional violation before re-submitting.');
    }

    // Logic: H2 requires evidence (IDEA- link or repetition markers)
    if (hansei.severity === 'H2') {
      const hasIdeaLink = (hansei.forwardAction && hansei.forwardAction.includes('IDEA-'));
      const hasRepetitionMarker = (hansei.decision && (hansei.decision.toLowerCase().includes('repeated') || hansei.decision.toLowerCase().includes('occurrence')));
      
      if (!hasIdeaLink && !hasRepetitionMarker) {
        errors.push('Hansei Severity H2 requires systemic evidence: an IDEA-XXX link in Forward Action or evidence of repetition in Decision.');
      }
    }

    // Logic: H3b requires Expiry Task and Owner
    if (hansei.severity === 'H3b') {
      const hasExpiryTask = hansei.forwardAction && /(TASK|IDEA)-\d{3}/.test(hansei.forwardAction);
      const hasOwner = hansei.decision && /(Owner|Approved by):/i.test(hansei.decision);
      
      if (!hasExpiryTask) {
        errors.push('Hansei Severity H3b requires a specific Expiry Resource (TASK-XXX or IDEA-XXX) in Forward Action.');
      }
      if (!hasOwner) {
        errors.push('Hansei Severity H3b requires a clear Owner/Architect (e.g., "Owner: <Name>") in Decision field.');
      }
    }

    return errors;
  }
}
