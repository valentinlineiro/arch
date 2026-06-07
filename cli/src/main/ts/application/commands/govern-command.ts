import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import { GovernSystem } from '../use-cases/govern-system.js';
import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { SubprocessRunner } from '../../infrastructure/cli/subprocess-runner.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';
import { PathResolver } from '../../domain/services/path-resolver.js';
import type { EscalationEntry } from '../use-cases/escalation-store.js';

export class GovernCommand implements Command {
  private useCase: GovernSystem;
  private rootPath: string;

  constructor(
    taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    causalSignalLog?: CausalSignalLog,
    rootPath: string = '.'
  ) {
    this.rootPath = rootPath;
    this.useCase = new GovernSystem(taskRepository, gitRepository, fileSystem, causalSignalLog, rootPath);
  }

  async execute(args: string[] = []): Promise<number> {
    const noAnalyze = args.includes('--no-analyze') || args.includes('--no-conduct');
    const cleanInbox = args.includes('--clean-inbox');
    const force = args.includes('--force');

    // Circuit breaker: ANDON_HALT stops the autonomous loop
    if (!force) {
      try {
        const pr = PathResolver.from({});
        const notifPath = pr.notifications ?? 'docs/NOTIFICATIONS.md';
        const notifications = await this.fileSystem.readFile(notifPath).catch(() => '');
        const haltLines = notifications.split('\n').filter(l => l.includes('[ANDON_HALT]'));
        if (haltLines.length > 0) {
          console.log('\n  \x1b[31m✖\x1b[0m ANDON_HALT — autonomous loop halted\n');
          for (const line of haltLines.slice(0, 5)) {
            const summary = line.replace(/.*\[ANDON_HALT\]\s*/, '').slice(0, 80);
            console.log(`    ${summary}`);
          }
          console.log('\n  Remove [ANDON_HALT] entries from NOTIFICATIONS.md to resume.');
          console.log('  Use arch govern --force to override (human sessions only).\n');
          return 2;
        }
      } catch { /* no notifications file — proceed */ }
    }

    fmt.log('\n  ARCH — Governance Tick');
    const result = await this.useCase.execute(cleanInbox);

    try {
      const config = await ConfigLoader.load(this.fileSystem);
      const contextRules = (config.contextRules as Record<string, { taskClasses: string[] }>) ?? {};
      const buildIndex = new BuildIndex(this.fileSystem);
      await buildIndex.execute(contextRules, this.gitRepository);
      fmt.log('  \x1b[32m✔\x1b[0m context index rebuilt');
    } catch {
      throw new Error('failed to rebuild context index during govern');
    }

    try {
      await this.gitRepository.add(PathResolver.from({}).contextIndex);
      await this.gitRepository.commit('chore: [THINK] rebuild context index');
    } catch {
      // Nothing changed or git not available — acceptable
    }

    await this.compactEscalations();

    // Analysis side-effect: trigger arch analyze when replenishment or cadence conditions are met.
    // This is labeled explicitly as analysis — it never affects enforcement decisions.
    if (result.analysisNeeded && !noAnalyze) {
      fmt.log(`  → Triggering arch analyze [analysis] (reasons: ${result.reasons.join(', ')})`);
      SubprocessRunner.runSync('./scripts/arch.sh', ['analyze']);
    }

    fmt.log('');

    if (result.projectComplete === true) {
      return 2;
    }
    return 0;
  }

  private async compactEscalations(): Promise<void> {
    const pr = PathResolver.from({});
    const escalationsPath = `${this.rootPath}/${pr.escalations}`;
    const compactedPath = `${this.rootPath}/.arch/escalations-compacted.jsonl`;

    let raw: string;
    try {
      raw = await this.fileSystem.readFile(escalationsPath);
    } catch {
      return;
    }

    const records = raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(l => { try { return JSON.parse(l) as EscalationEntry; } catch { return null; } })
      .filter(Boolean) as EscalationEntry[];

    const openRecords = records.filter(r => r.status === 'OPEN');
    const compactedContent = openRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
    await this.fileSystem.writeFile(compactedPath, compactedContent);

    const total = records.length;
    const open = openRecords.length;
    fmt.log(`  Escalation compaction: ${total} total → ${open} OPEN records (compacted view: .arch/escalations-compacted.jsonl)`);
  }
}
