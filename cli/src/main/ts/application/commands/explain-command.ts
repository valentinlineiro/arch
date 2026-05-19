import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { CausalSignalLog } from '../use-cases/causal-signal-log.js';

const GLOSSARY: Record<string, { definition: string; usage: string }> = {
  hansei: {
    definition: 'Structured diagnostic block required at task closure. Records what went wrong, why, cost, and forward action. Fields: Severity (H0–H3b), Category (controlled vocabulary), Decision, Constraint, Cost, Forward Action.',
    usage: 'Required for M/L/XL tasks. Optional for XS/S unless a trigger applies (blocker, size overrun, process anomaly). Evaluated by arch review and the Auditor.',
  },
  focus: {
    definition: 'Binary flag on a task meta line (Focus:yes/no). At most one task is Focus:yes at any time. Focus:yes signals the task arch govern selected as the active execution target.',
    usage: 'Set by arch govern via focus-ledger.jsonl. Agents must not set Focus:yes manually. arch review enforces FocusStatusAlignment.',
  },
  driftchecker: {
    definition: 'Deterministic TypeScript service that runs all structural checks in arch review. Emits DriftResult objects (PASS/WARN/FAIL). Never uses LLM. All WARNs are reproducible and traceable to a specific parsed line.',
    usage: 'Extended by adding a new check method to drift-checker.ts. Each check must emit PASS for the happy path and WARN/FAIL for violations.',
  },
  ready: {
    definition: 'Task status: fully specified, meets Definition of Ready, available for selection. Default Focus:no. arch govern may assign Focus:yes to the highest-priority READY task.',
    usage: 'Set when a task passes DoR validation. arch task start transitions READY → IN_PROGRESS.',
  },
  'in_progress': {
    definition: 'Task status: actively being implemented. Focus:yes is expected. Only one task should be IN_PROGRESS per agent session.',
    usage: 'Set by arch task start. Implementing agent commits status change before touching implementation files.',
  },
  review: {
    definition: 'Task status: implementation complete, waiting for Auditor verification. Agent writes Hansei, posts REVIEW_REQUEST to INBOX.md, and stops.',
    usage: 'M/L/XL tasks require human Auditor review. XS/S tasks use L3 self-archive when DeterministicACVerifier passes.',
  },
  done: {
    definition: 'Task status: all ACs verified, Hansei written, Approval present (M/L/XL). Closed-at timestamp added by Auditor. arch govern moves file to docs/archive/.',
    usage: 'Set by Auditor. arch govern archives on next tick.',
  },
  blocked: {
    definition: 'Task status: halted on a missing dependency. Cannot progress until the blocking task is DONE.',
    usage: 'Set manually with the blocking reason. arch review StaleDepends catches BLOCKED tasks whose dependency is already DONE.',
  },
  idea: {
    definition: 'Pre-task artifact in docs/refinement/. Describes a proposed intervention without committing to implementation. Statuses: DRAFT, EXTEND, REJECTED, PROMOTED.',
    usage: 'Created via idea: commit prefix or arch task capture. THINK evaluates IDEAs. Human writes PROMOTE → TASK-XXX in the Decision field to promote.',
  },
  'arch govern': {
    definition: 'Deterministic enforcement command. Archives DONE tasks, assigns Focus:yes via focus-ledger, checks thresholds. No LLM. Run it; do not replicate its logic.',
    usage: 'Run after each task is marked DONE. arch govern reflect triggers THINK mode (advisory only).',
  },
  'arch review': {
    definition: 'Read-only structural integrity check. Runs all DriftChecker checks and system-level gates. Non-zero exit means a blocking violation. Required before every commit via git hook.',
    usage: 'Run to verify system integrity. Any new violation introduced by a change is blocking — fix before committing.',
  },
  adr: {
    definition: 'Architecture Decision Record. Documents a settled architectural decision with context, decision, rationale, and consequences. Status: ACCEPTED, DEPRECATED, SUPERSEDED.',
    usage: 'ACCEPTED ADRs are enforced by drift checks (UnappliedADRs). New ADRs required for breaking changes.',
  },
  think: {
    definition: 'LLM analysis mode invoked by arch govern reflect. Produces IDEAs and proposals only. Never creates tasks directly. Output is ephemeral (terminal only).',
    usage: 'Triggered by arch govern reflect. THINK never satisfies a governance gate — all gates are deterministic.',
  },
  'arch task capture': {
    definition: 'Primary task intake command. Creates a task from natural language intent, applies class-appropriate AC templates, auto-fixes mechanical DoR violations, and moves to IN_PROGRESS in one step.',
    usage: 'arch task capture "<intent>" [--class <class>] [--size <size>]',
  },
  'definition of ready': {
    definition: 'Checklist a task must pass before being set to READY. Includes: title, size, priority, class, context paths, at least one AC with a verifiable predicate.',
    usage: 'Enforced by arch task start and arch review. arch task capture auto-fixes mechanical violations.',
  },
  'definition of done': {
    definition: 'Checklist a task must pass before being archived as DONE. Includes: all ACs verified, Hansei written (M+), Approval present (M+), arch review passes.',
    usage: 'Auditor verifies each AC. Self-archive (L3) applies for XS/S when DeterministicACVerifier passes.',
  },
  l3: {
    definition: 'L3 Autonomy: XS/S tasks may self-archive without human Auditor when DeterministicACVerifier returns pass:true with at least one cmd: or file: AC.',
    usage: 'Gate: size XS or S + DeterministicACVerifier pass:true + ≥1 cmd:/file: AC. See ADR-009.',
  },
  kaizen: {
    definition: 'Continuous improvement record. docs/KAIZEN-LOG.md documents recurring failure patterns, proposals, and retrospectives. THINK Phase 3 produces Kaizen proposals.',
    usage: 'THINK writes Kaizen entries with [KAIZEN] prefix. Humans review and promote to tasks.',
  },
  'causal graph': {
    definition: 'Append-only record in .arch/causal-graph.jsonl linking operational entities (tasks, ADRs, IDEAs) via typed edges. Queryable by arch ask.',
    usage: 'Written by causal-signal-log.ts after arbitration. Never mutated — resolution is a new record.',
  },
  'arch ask': {
    definition: 'Memory query command. Analyzes the full ARCH corpus and returns causal patterns, recurring failure signatures, and related tasks/ADRs for a plain-language question.',
    usage: 'arch ask "<question>" — works locally, no API key required.',
  },
  'focus ledger': {
    definition: 'Append-only log at .arch/focus-ledger.jsonl. Records all Focus rulings (FOCUS_ACQUIRED, FOCUS_SOVEREIGNTY, FOCUS_INTEGRITY_VIOLATION) per govern tick.',
    usage: 'Written by arch govern. Source of truth for Focus state. Never mutated — rulings are immutable entries.',
  },
  inbox: {
    definition: 'docs/INBOX.md — human-readable escalation surface. Agents write; humans read. Contains REVIEW_REQUEST, ANDON_HALT, and AWAITING_PROMOTION entries.',
    usage: 'Agents append entries. Automated processes must never read it — use .arch/escalations.jsonl for machine-readable state.',
  },
};

function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/[-_]/g, ' ').trim();
}

export class ExplainCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private causalSignalLog?: CausalSignalLog,
    private rootPath: string = '.',
  ) {}

  private explainTerm(term: string): void {
    const normalized = normalizeTerm(term);
    const entry = GLOSSARY[normalized] ?? Object.entries(GLOSSARY).find(([k]) => k.includes(normalized) || normalized.includes(k))?.[1];

    if (!entry) {
      console.log(`\n  \x1b[32mARCH\x1b[0m — No entry found for "${term}"\n`);
      console.log('  Known terms:');
      for (const key of Object.keys(GLOSSARY)) {
        console.log(`    ${key}`);
      }
      console.log('');
      return;
    }

    console.log(`\n  \x1b[32mARCH\x1b[0m — ${term}\n`);
    console.log(`  ${entry.definition}\n`);
    console.log(`  Usage: ${entry.usage}\n`);
  }

  async execute(args: string[]): Promise<void> {
    const taskId = args.find(a => /^TASK-\d+$/.test(a));
    if (!taskId) {
      const term = args.find(a => !a.startsWith('-'));
      if (term) {
        this.explainTerm(term);
        return;
      }
      process.stderr.write('Usage: arch explain <term>  — look up an ARCH ontology term\n');
      process.stderr.write('       arch explain TASK-XXX — show task provenance\n\n');
      process.stderr.write('Terms: ' + Object.keys(GLOSSARY).join(', ') + '\n');
      process.exit(1);
    }

    // Look in archive first (closed tasks have provenance), then active tasks
    let content: string | null = null;
    let source = '';
    try {
      content = await this.fileSystem.readFile(`${this.rootPath}/docs/archive/${taskId}.md`);
      source = 'archive';
    } catch {
      try {
        content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${taskId}.md`);
        source = 'tasks';
      } catch {
        process.stderr.write(`Task ${taskId} not found in archive or tasks/\n`);
        process.exit(1);
      }
    }

    if (!content) { process.exit(1); }

    console.log(`\n  \x1b[32mARCH\x1b[0m — ${taskId} Provenance\n`);

    // Title and status
    const titleMatch = content.match(/^## (TASK-\d+): (.*)/m);
    const metaMatch = content.match(/\*\*Meta:\*\*\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(\S+)/);
    if (titleMatch) console.log(`  ${titleMatch[1]}: ${titleMatch[2]}`);
    if (metaMatch) console.log(`  ${metaMatch[1]} ${metaMatch[2]} ${metaMatch[3]}\n`);

    // Origin: look for Spawned-from or matching IDEA in archive
    const spawnedFrom = content.match(/\*\*Spawned-from:\*\*\s*(TASK-\d+)/)?.[1];
    if (spawnedFrom) {
      console.log(`  Origin: decomposed from ${spawnedFrom}`);
    } else {
      // Search for IDEA that promoted to this task
      const ideaOrigin = await this.findIdeaOrigin(taskId);
      if (ideaOrigin) {
        console.log(`  Origin: promoted from ${ideaOrigin.slug}`);
        console.log(`    "${ideaOrigin.title}"`);
        if (ideaOrigin.decision) console.log(`    Decision: ${ideaOrigin.decision.slice(0, 80)}`);
      }
    }

    // Hansei
    const hansei = this.extractHansei(content);
    if (hansei) {
      console.log(`\n  Hansei:`);
      console.log(`    Severity:  ${hansei.severity}`);
      console.log(`    Category:  ${hansei.category}`);
      console.log(`    Decision:  ${hansei.decision.slice(0, 100)}`);
      if (hansei.constraint && hansei.constraint.toLowerCase() !== 'none.') {
        console.log(`    Constraint: ${hansei.constraint.slice(0, 100)}`);
      }
      if (hansei.forwardAction && hansei.forwardAction.toLowerCase() !== 'none required.') {
        console.log(`    Forward:   ${hansei.forwardAction.slice(0, 100)}`);
      }
    }

    // Causal signals emitted from this task
    if (this.causalSignalLog) {
      try {
        const signals = await this.causalSignalLog.all();
        const emitted = signals.filter(s => s.candidate_from === taskId || s.event?.includes(taskId));
        if (emitted.length > 0) {
          console.log(`\n  Signals emitted (${emitted.length}):`);
          for (const s of emitted.slice(0, 5)) {
            console.log(`    [${s.domain}] ${s.candidate_from} → ${s.candidate_to}`);
          }
        }
      } catch { /* causal log unavailable */ }
    }

    // Downstream: tasks that reference this as Forward Action or Spawned-from
    const related = await this.findRelated(taskId);
    if (related.length > 0) {
      console.log(`\n  Downstream (${related.length}):`);
      for (const r of related.slice(0, 5)) {
        console.log(`    → ${r.id}  ${r.status}  ${r.title?.slice(0, 50)}`);
      }
    }

    // Related: tasks with same Hansei category
    if (hansei?.category) {
      const sameCategory = await this.findSameCategory(taskId, hansei.category);
      if (sameCategory.length > 0) {
        console.log(`\n  Same category ${hansei.category} (${sameCategory.length} other tasks):`);
        for (const t of sameCategory.slice(0, 3)) {
          console.log(`    ${t.id}  ${t.title?.slice(0, 55)}`);
        }
      }
    }

    console.log('');
  }

  private extractHansei(content: string) {
    const idx = content.lastIndexOf('## Hansei');
    if (idx === -1) return null;
    const section = content.slice(idx);
    return {
      severity: section.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1] ?? '',
      category: section.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] ?? '',
      decision: section.match(/\*\*Decision:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim() ?? '',
      constraint: section.match(/\*\*Constraint:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim() ?? '',
      forwardAction: section.match(/\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim() ?? '',
    };
  }

  private async findIdeaOrigin(taskId: string): Promise<{ slug: string; title: string; decision: string } | null> {
    const archiveDir = `${this.rootPath}/docs/refinement/archive`;
    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(archiveDir); } catch { return null; }

    for (const file of files.filter(f => f.startsWith('IDEA-') && f.endsWith('.md'))) {
      try {
        const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
        if (content.includes(`PROMOTE → ${taskId}`) || content.includes(`→ ${taskId}`)) {
          const title = content.match(/^# IDEA: (.*)/m)?.[1]?.trim() ?? file.replace('.md', '');
          const decision = content.match(/## Decision\n([\s\S]*?)(?=\n##|$)/)?.[1]?.trim() ?? '';
          return { slug: file.replace('.md', ''), title, decision };
        }
      } catch { /* skip */ }
    }
    return null;
  }

  private async findRelated(taskId: string): Promise<Array<{ id: string; status: string; title: string }>> {
    const tasks = await this.taskRepository.getAll();
    return tasks
      .filter(t => t.id !== taskId && (
        t.content?.includes(taskId) ||
        (t as any).depends?.includes(taskId)
      ))
      .map(t => ({ id: t.id, status: t.status, title: t.title }))
      .slice(0, 10);
  }

  private async findSameCategory(taskId: string, category: string): Promise<Array<{ id: string; title: string }>> {
    const archiveDir = `${this.rootPath}/docs/archive`;
    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(archiveDir); } catch { return []; }

    const results: Array<{ id: string; title: string }> = [];
    for (const file of files.filter(f => f.startsWith('TASK-') && f.endsWith('.md')).slice(0, 50)) {
      const id = file.replace('.md', '');
      if (id === taskId) continue;
      try {
        const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
        if (content.includes(`**Category:** ${category}`)) {
          const title = content.match(/^## TASK-\d+: (.*)/m)?.[1]?.trim() ?? id;
          results.push({ id, title });
          if (results.length >= 5) break;
        }
      } catch { /* skip */ }
    }
    return results;
  }
}
