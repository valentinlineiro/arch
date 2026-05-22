import { Command } from '../../domain/models/command.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

const SENTINEL_LOG_PATH = 'docs/SENTINEL-LOG.md';

const SENTINEL_LOG_HEADER = `# SENTINEL-LOG

Append-only log of Sentinel preflight reasoning calls. Each entry records the task, trigger reason, and outcome (GO or HALT). Entries are written by \`arch sentinel log\` before high-cost or high-risk operations.

| Timestamp | Task | Trigger | Outcome | Note |
|-----------|------|---------|---------|------|
`;

interface SentinelEntry {
  timestamp: string;
  taskId: string;
  trigger: string;
  outcome: 'GO' | 'HALT';
  note: string;
}

export class SentinelCommand implements Command {
  constructor(private fileSystem: FileSystem) {}

  async execute(args: string[]): Promise<void> {
    const sub = args[0];

    if (sub === 'log') {
      await this.log(args.slice(1));
    } else if (sub === 'show') {
      await this.show(args.slice(1));
    } else {
      process.stderr.write('Usage: arch sentinel log TASK-XXX --trigger "<reason>" --outcome GO|HALT [--note "<note>"]\n');
      process.stderr.write('       arch sentinel show [TASK-XXX]\n');
      process.exit(1);
    }
  }

  private async log(args: string[]): Promise<void> {
    const taskId = args.find(a => /^TASK-\d+$/.test(a));
    if (!taskId) {
      process.stderr.write('Usage: arch sentinel log TASK-XXX --trigger "<reason>" --outcome GO|HALT\n');
      process.exit(1);
    }

    const triggerIdx = args.indexOf('--trigger');
    const outcomeIdx = args.indexOf('--outcome');
    const noteIdx = args.indexOf('--note');

    const trigger = triggerIdx >= 0 ? args[triggerIdx + 1] : '';
    const outcomeRaw = outcomeIdx >= 0 ? args[outcomeIdx + 1] : '';
    const note = noteIdx >= 0 ? args[noteIdx + 1] : '';

    if (!trigger) {
      process.stderr.write('Error: --trigger "<reason>" is required\n');
      process.exit(1);
    }

    if (outcomeRaw !== 'GO' && outcomeRaw !== 'HALT') {
      process.stderr.write('Error: --outcome must be GO or HALT\n');
      process.exit(1);
    }

    const entry: SentinelEntry = {
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      taskId,
      trigger: trigger.replace(/\|/g, '/'),
      outcome: outcomeRaw as 'GO' | 'HALT',
      note: note.replace(/\|/g, '/'),
    };

    await this.appendEntry(entry);
    console.log(`  ✔ Sentinel logged: ${taskId} → ${entry.outcome}`);
    if (entry.outcome === 'HALT') {
      console.log(`  ⚠ HALT recorded. Review trigger before proceeding.`);
    }
  }

  private async appendEntry(entry: SentinelEntry): Promise<void> {
    let existing = '';
    try {
      existing = await this.fileSystem.readFile(SENTINEL_LOG_PATH);
    } catch {
      existing = SENTINEL_LOG_HEADER;
    }

    const row = `| ${entry.timestamp} | ${entry.taskId} | ${entry.trigger} | ${entry.outcome} | ${entry.note} |`;
    await this.fileSystem.writeFile(SENTINEL_LOG_PATH, existing + row + '\n');
  }

  private async show(args: string[]): Promise<void> {
    const taskId = args.find(a => /^TASK-\d+$/.test(a));
    let content = '';
    try {
      content = await this.fileSystem.readFile(SENTINEL_LOG_PATH);
    } catch {
      console.log('  No sentinel log found.');
      return;
    }

    const lines = content.split('\n').filter(l => l.startsWith('|') && !l.includes('Timestamp') && !l.includes('---'));
    const filtered = taskId ? lines.filter(l => l.includes(taskId)) : lines;

    if (filtered.length === 0) {
      console.log(taskId ? `  No sentinel entries for ${taskId}.` : '  No sentinel entries.');
      return;
    }

    console.log(`\n  \x1b[32mARCH\x1b[0m — Sentinel Log${taskId ? ` (${taskId})` : ''}\n`);
    for (const line of filtered.slice(-20)) {
      console.log(`  ${line}`);
    }
    console.log('');
  }
}
