import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

interface EscalationRecord {
  escalation_id: string;
  timestamp: string;
  type: string;
  subject: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED';
  resolved_at: string | null;
  resolved_by: string | null;
}

export class ResumeCommand {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private taskRepository: TaskRepository,
    private rootPath: string = '.',
  ) {}

  async execute(args: string[]): Promise<number> {
    const taskId = args[0];
    if (!taskId || !taskId.startsWith('TASK-')) {
      fmt.error('\n  Usage: arch resume TASK-XXX\n');
      return 1;
    }

    fmt.log(`\n  \x1b[32mARCH\x1b[0m — Resume: ${taskId}\n`);

    // Find most recent OPEN ANDON record for this task
    const escalation = await this.findOpenHalt(taskId);

    if (!escalation) {
      fmt.log(`  No OPEN ANDON_HALT record found for ${taskId}.`);
      fmt.log(`  Run \x1b[36march review\x1b[0m to see current system state.\n`);
      return 0;
    }

    fmt.log(`  Halt reason: \x1b[33m${escalation.type}\x1b[0m`);
    fmt.log(`  Escalation: ${escalation.escalation_id}`);
    fmt.log(`  Evidence: ${escalation.reason.slice(0, 80)}\n`);

    // Execute recovery
    const recovered = await this.recover(taskId, escalation);

    if (recovered) {
      await this.closeEscalation(escalation);
      await this.appendFocusRecovered(taskId);
      fmt.log(`\n  \x1b[32m✔\x1b[0m Escalation closed. Running arch review...\n`);
      try {
        execSync(`node ${this.rootPath}/cli/dist/index.js check`, {
          stdio: 'inherit', cwd: this.rootPath, timeout: 30000,
        });
      } catch { /* check output already shown */ }
    }
    return 0;
  }

  private async recover(taskId: string, esc: EscalationRecord): Promise<boolean> {
    switch (esc.type) {
      case 'ANDON_HALT':
      case 'REVIEW_FAIL':
        return this.recoverReviewFail(taskId);

      case 'INTEGRITY_BREACH':
      case 'INTEGRITY_FIX':
        return this.recoverIntegrityBreach(taskId);

      case 'FOCUS_VIOLATION':
      case 'FOCUS_SOVEREIGNTY':
      case 'FOCUS_INTEGRITY_VIOLATION':
        return this.recoverFocusViolation();

      case 'BUDGET_EXHAUSTED':
        return this.recoverBudgetExhausted(taskId);

      case 'CORPUS_HALT':
        return this.recoverCorpusHalt();

      default: {
        fmt.log(`  \x1b[33m⚠ Unknown halt type: ${esc.type}\x1b[0m`);
        fmt.log(`  Reason: ${esc.reason}`);
        fmt.log(`  Manual intervention required. See ${PathResolver.from({}).inbox} for context.\n`);
        return false;
      }
    }
  }

  // ── REVIEW_FAIL recovery ──────────────────────────────────────────────────

  private async recoverReviewFail(taskId: string): Promise<boolean> {
    fmt.log(`  \x1b[36mRecovery: REVIEW_FAIL → reset to READY\x1b[0m`);

    // Find task in tasks or archive
    const taskPath = join(this.rootPath, 'docs', 'tasks', `${taskId}.md`);
    if (!existsSync(taskPath)) {
      fmt.log(`  Task file not found at ${taskPath}. May already be archived.`);
      return false;
    }

    let content = readFileSync(taskPath, 'utf8');

    // Reset status to READY, clear REVIEW
    content = content.replace(/\| REVIEW \| Focus:\w+/, '| READY | Focus:no');
    content = content.replace(/\| IN_PROGRESS \| Focus:\w+/, '| READY | Focus:no');
    writeFileSync(taskPath, content);

    fmt.log(`  ✔ ${taskId} reset to READY`);

    // Append REVIEW_RESET to focus ledger
    const ledgerPath = join(this.rootPath, '.arch', 'focus-ledger.jsonl');
    const entry = JSON.stringify({
      ruling: 'REVIEW_RESET',
      taskId,
      tick: Date.now(),
      timestamp: new Date().toISOString(),
      reason: 'arch resume REVIEW_FAIL recovery',
    });
    const existing = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : '';
    writeFileSync(ledgerPath, existing + (existing ? '\n' : '') + entry);

    try {
      await this.gitRepository.add(taskPath);
      await this.gitRepository.add(ledgerPath);
      await this.gitRepository.commit(`chore: [${taskId}] REVIEW_RESET via arch resume`);
      fmt.log(`  ✔ Committed REVIEW_RESET`);
    } catch (e: any) {
      if (!e.message?.includes('nothing to commit')) console.warn(`  ⚠ Commit skipped: ${e.message}`);
    }

    return true;
  }

  // ── INTEGRITY_BREACH recovery ─────────────────────────────────────────────

  private async recoverIntegrityBreach(taskId: string): Promise<boolean> {
    fmt.log(`  \x1b[36mRecovery: INTEGRITY_BREACH → append-only repair\x1b[0m`);

    // Run arch govern which has INTEGRITY_FIX logic built in
    try {
      execSync(`node ${this.rootPath}/cli/dist/index.js govern`, {
        stdio: 'inherit', cwd: this.rootPath, timeout: 60000,
      });
      fmt.log(`  ✔ Govern ran — INTEGRITY_FIX applied if needed`);
      return true;
    } catch {
      fmt.log(`  \x1b[31m✖ Govern failed — manual inspection required\x1b[0m`);
      fmt.log(`  Run: git status && git diff HEAD to see what changed`);
      return false;
    }
  }

  // ── FOCUS_VIOLATION recovery ──────────────────────────────────────────────

  private async recoverFocusViolation(): Promise<boolean> {
    fmt.log(`  \x1b[36mRecovery: FOCUS_VIOLATION → run arch govern tick\x1b[0m`);

    try {
      execSync(`node ${this.rootPath}/cli/dist/index.js govern`, {
        stdio: 'inherit', cwd: this.rootPath, timeout: 60000,
      });
      fmt.log(`  ✔ Govern tick ran — focus re-adjudicated`);
      return true;
    } catch {
      fmt.log(`  \x1b[31m✖ Govern failed\x1b[0m`);
      return false;
    }
  }

  // ── BUDGET_EXHAUSTED recovery ─────────────────────────────────────────────

  private async recoverBudgetExhausted(taskId: string): Promise<boolean> {
    fmt.log(`  \x1b[36mRecovery: BUDGET_EXHAUSTED → prompt for new size\x1b[0m`);

    const taskPath = join(this.rootPath, 'docs', 'tasks', `${taskId}.md`);
    if (!existsSync(taskPath)) {
      fmt.log(`  Task file not found.`);
      return false;
    }

    const { createInterface } = await import('node:readline');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const newSize = await new Promise<string>(resolve => {
      rl.question('  New size (XS/S/M/L/XL): ', answer => { rl.close(); resolve(answer.trim().toUpperCase()); });
    });

    if (!['XS', 'S', 'M', 'L', 'XL'].includes(newSize)) {
      fmt.log(`  Invalid size. No changes made.`);
      return false;
    }

    let content = readFileSync(taskPath, 'utf8');
    content = content.replace(
      /\*\*Meta:\*\* (P\d) \| (\S+) \|/,
      `**Meta:** $1 | ${newSize} |`,
    );
    writeFileSync(taskPath, content);

    try {
      await this.gitRepository.add(taskPath);
      await this.gitRepository.commit(`chore: [${taskId}] size extended to ${newSize} via arch resume`);
      fmt.log(`  ✔ Size updated to ${newSize}`);
    } catch (e: any) {
      if (!e.message?.includes('nothing to commit')) console.warn(`  ⚠ ${e.message}`);
    }

    return true;
  }

  // ── CORPUS_HALT recovery ──────────────────────────────────────────────────

  private async recoverCorpusHalt(): Promise<boolean> {
    fmt.log(`  \x1b[36mRecovery: CORPUS_HALT → run arch corpus audit\x1b[0m\n`);
    try {
      execSync(`node ${this.rootPath}/cli/dist/index.js corpus audit --verbose`, {
        stdio: 'inherit', cwd: this.rootPath, timeout: 60000,
      });
    } catch { /* output already shown */ }
    fmt.log(`\n  Fix the WARNINGs above, then run \x1b[36march resume ${'\x1b[0m'}again.`);
    return false; // Don't close escalation — user needs to fix corpus first
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOpenHalt(taskId: string): Promise<EscalationRecord | null> {
    const path = join(this.rootPath, '.arch', 'escalations.jsonl');
    if (!existsSync(path)) return null;

    const lines = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
    const haltTypes = new Set(['ANDON_HALT', 'REVIEW_FAIL', 'INTEGRITY_BREACH', 'INTEGRITY_FIX',
      'FOCUS_VIOLATION', 'FOCUS_SOVEREIGNTY', 'FOCUS_INTEGRITY_VIOLATION',
      'BUDGET_EXHAUSTED', 'CORPUS_HALT']);

    // Find the most recent OPEN record for this task
    let match: EscalationRecord | null = null;
    for (const line of lines.reverse()) {
      try {
        const r = JSON.parse(line) as EscalationRecord;
        if (r.status === 'OPEN' && r.subject === taskId && haltTypes.has(r.type)) {
          match = r;
          break;
        }
      } catch { /* skip */ }
    }
    return match;
  }

  private async closeEscalation(esc: EscalationRecord): Promise<void> {
    const path = join(this.rootPath, '.arch', 'escalations.jsonl');
    const lines = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
    const updated = lines.map(line => {
      try {
        const r = JSON.parse(line) as EscalationRecord;
        if (r.escalation_id === esc.escalation_id) {
          return JSON.stringify({ ...r, status: 'RESOLVED', resolved_at: new Date().toISOString(), resolved_by: 'arch-resume' });
        }
      } catch {}
      return line;
    });
    writeFileSync(path, updated.join('\n') + '\n');
  }

  private async appendFocusRecovered(taskId: string): Promise<void> {
    const ledgerPath = join(this.rootPath, '.arch', 'focus-ledger.jsonl');
    const entry = JSON.stringify({
      ruling: 'FOCUS_RECOVERED',
      taskId,
      tick: Date.now(),
      timestamp: new Date().toISOString(),
    });
    const existing = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : '';
    writeFileSync(ledgerPath, existing + (existing ? '\n' : '') + entry);
  }
}
