import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { DriftChecker } from '../../domain/services/drift-checker.js';
import { TaskStatus } from '../../domain/models/task.js';
import { SelectNextTask } from './select-next-task.js';
import { GovernSystem } from './govern-system.js';
import { ReviewSystem } from './review-system.js';
import { MarkTaskDone } from './mark-task-done.js';
import { SubprocessRunner } from '../../infrastructure/cli/subprocess-runner.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { BridgeProvider } from '../../domain/services/bridge-provider.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export interface LoopOptions {
  sprint?: string;
  dryRun?: boolean;
  resume?: boolean;
  verbose?: boolean;
}

const ANDON_MAX_FAILURES = 3;
const ARCH_SH = './scripts/arch.sh';

export class LoopEngine {
  private reviewFailures = new Map<string, number>();
  private governSystem: GovernSystem;
  private reviewSystem: ReviewSystem;
  private markTaskDone: MarkTaskDone;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    private reviewer: Reviewer,
    private driftChecker?: DriftChecker,
    private providerRegistry?: ProviderRegistry
  ) {
    this.governSystem = new GovernSystem(taskRepository, gitRepository, fileSystem);
    this.reviewSystem = new ReviewSystem(taskRepository, gitRepository, reviewer, fileSystem, driftChecker);
    this.markTaskDone = new MarkTaskDone(taskRepository, reviewer, fileSystem);
  }

  private log(message: string) {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] ${message}`);
  }

  async execute(options: LoopOptions): Promise<void> {
    if (options.resume) {
      await this.handleResume(options);
      return;
    }

    const config = await ConfigLoader.load(this.fileSystem);
    const timeoutMinutes = config.governance?.execTimeoutMinutes ?? 10;
    const EXEC_TIMEOUT_MS = timeoutMinutes * 60 * 1000;

    const scopeLabel = options.sprint ? ` [sprint: ${options.sprint}]` : '';
    this.log(`[LOOP] Starting arch loop${options.dryRun ? ' (dry-run)' : ''}${scopeLabel}`);

    while (true) {
      // 1. GOVERN — select next task, handle replenishment (skip AI conduct when in loop)
      this.log('[LOOP] Phase: GOVERN');
      if (!options.dryRun) {
        await this.governSystem.execute(true);
      } else {
        this.log('[dry-run] Would run: arch govern --no-conduct');
      }

      // 2. SELECT — prioritize focused task, otherwise find next unblocked task
      this.log('[LOOP] Phase: SELECT');
      const activeTasks = await this.taskRepository.getActive();
      let task = activeTasks.find(t => t.focus && (t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.READY || t.status === TaskStatus.REVIEW));

      if (!task) {
        const selector = new SelectNextTask(this.taskRepository);
        task = await selector.execute();
      }

      if (!task) {
        this.log('[LOOP] No unblocked READY tasks. Loop complete.');
        break;
      }

      // Sprint scope: skip tasks outside the requested sprint
      if (options.sprint) {
        const sprintValue = task.sprint ?? '';
        const normalised = options.sprint.startsWith('sprint/') ? options.sprint : `sprint/${options.sprint}`;
        if (sprintValue !== normalised && sprintValue !== options.sprint) {
          this.log(`[LOOP] Next task ${task.id} is outside sprint ${options.sprint}. No matching tasks remain.`);
          break;
        }
      }

      this.log(`[LOOP] Selected: ${task.id} — ${task.title} (${task.priority} | ${task.size})`);

      if (options.dryRun) {
        this.log(`[dry-run] Would execute cycle for ${task.id}`);
        break;
      }

      const cycleStart = Date.now();

      // 3. EXEC — use provider directly if registry available, else fall back to arch.sh subprocess
      this.log(`[LOOP] Phase: EXEC (${task.id})`);

      if (this.providerRegistry) {
        const { provider, name, model } = this.providerRegistry.resolve(
          task.class ?? '',
          task.size ?? '',
          bin => spawnSync('which', [bin]).status === 0
        );

        if (!provider || name === 'local') {
          const reason = 'No provider resolved for task — halting';
          await this.appendInbox(task.id, 'ANDON_HALT', reason);
          console.error(`[LOOP] ${reason}`);
          process.exit(1);
        }

        this.log(`[LOOP] Provider: ${name} | Model: ${model || 'default'}`);

        let turns: number | undefined;
        let cost: string | undefined;

        if (provider instanceof BridgeProvider) {
          const DO_PROMPT_FILE = 'docs/agents/DO.md';
          const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
          const cmd = provider.buildCommand(promptContent, model, DO_PROMPT_FILE);
          const start = Date.now();
          const result = spawnSync('sh', ['-c', cmd], {
            stdio: ['ignore', 'pipe', 'inherit'],
            encoding: 'utf8',
            timeout: EXEC_TIMEOUT_MS,
          });
          if (result.status !== 0) {
            const reason = result.signal === 'SIGTERM'
              ? `EXEC timeout exceeded (${timeoutMinutes}m)`
              : `provider exited with code ${result.status}`;
            await this.appendInbox(task.id, 'ANDON_HALT', reason);
            console.error(`[LOOP] Exec failed for ${task.id}. ${reason}. INBOX updated. Halting.`);
            process.exit(1);
          }
          const meta = provider.parseMetadata(result.stdout ?? '', Date.now() - start);
          turns = meta.turns;
          cost = meta.cost;
        } else {
          // NativeProvider: async completion
          try {
            const DO_PROMPT_FILE = 'docs/agents/DO.md';
            const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
            const response = await provider.complete({
              model,
              messages: [{ role: 'user', content: promptContent }],
            });
            console.log(response.content);
            turns = response.usage.turns;
            cost = response.usage.cost;
          } catch (err: any) {
            await this.appendInbox(task.id, 'ANDON_HALT', `Provider error: ${err.message}`);
            console.error(`[LOOP] Provider error for ${task.id}: ${err.message}. Halting.`);
            process.exit(1);
          }
        }

        if (turns !== undefined || cost !== undefined) {
          const summary = [turns ? `${turns} turns` : '', cost ? `cost ${cost}` : ''].filter(Boolean).join(', ');
          this.log(`[LOOP] Agent activity: ${summary}`);
        }
      } else {
        // Legacy path: shell out to arch.sh exec
        const { code: execCode, stdout } = await SubprocessRunner.runWithOutput(ARCH_SH, ['exec'], {
          stream: true,
          timeoutMs: EXEC_TIMEOUT_MS,
        });

        if (execCode !== 0) {
          const reason = execCode === 124
            ? `EXEC timeout exceeded (${timeoutMinutes}m)`
            : `arch exec exited with code ${execCode}`;
          await this.appendInbox(task.id, 'ANDON_HALT', reason);
          console.error(`[LOOP] Exec failed for ${task.id}. ${reason}. INBOX updated. Halting.`);
          process.exit(1);
        }

        const turnMatch = stdout.match(/Turns: (\d+)/);
        const costMatch = stdout.match(/Cost: (\$\d+\.\d+)/);
        if (turnMatch || costMatch) {
          const summary = [
            turnMatch ? `${turnMatch[1]} turns` : '',
            costMatch ? `cost ${costMatch[1]}` : '',
          ].filter(Boolean).join(', ');
          this.log(`[LOOP] Agent activity: ${summary}`);
        }
      }

      // 4. REVIEW — in-process check; track consecutive failures per task
      this.log(`[LOOP] Phase: REVIEW (${task.id})`);
      const reviewResult = await this.reviewSystem.execute();

      if (!reviewResult.success) {
        const failures = (this.reviewFailures.get(task.id) ?? 0) + 1;
        this.reviewFailures.set(task.id, failures);
        console.warn(`[LOOP] Review failed for ${task.id} (${failures}/${ANDON_MAX_FAILURES}).`);
        reviewResult.violations.forEach(v => console.warn(`    - ${v}`));

        if (failures >= ANDON_MAX_FAILURES) {
          await this.appendInbox(task.id, 'ANDON_HALT', `arch review failed ${failures} consecutive times. Write APPROVE or REDIRECT in INBOX then run arch loop --resume.`);
          console.error(`[LOOP] Andon Cord: ${task.id} halted after ${failures} review failures.`);
          process.exit(1);
        }

        this.log(`[LOOP] Retrying ${task.id} (${ANDON_MAX_FAILURES - failures} attempt(s) remaining).`);
        continue;
      }

      this.reviewFailures.delete(task.id);

      // 5. ARCHIVE — mark done in-process; govern at the top of the next iteration handles archival
      this.log(`[LOOP] Phase: ARCHIVE (${task.id})`);
      try {
        await this.markTaskDone.execute(task.id);
        this.log(`[LOOP] Marked ${task.id} as DONE.`);
      } catch (err: any) {
        console.error(`[LOOP] Archive failed for ${task.id}: ${err.message}. Halting.`);
        process.exit(1);
      }

      const elapsed = Math.round((Date.now() - cycleStart) / 1000);
      this.log(`[LOOP] ✓ ${task.id} done in ${elapsed}s.`);
    }

    this.log('[LOOP] Done.');
  }

  private async handleResume(options: LoopOptions): Promise<void> {
    const inboxPath = 'docs/INBOX.md';
    let inbox = '';
    try {
      inbox = await this.fileSystem.readFile(inboxPath);
    } catch {
      console.log('[LOOP] No INBOX.md found. Starting fresh.');
      await this.execute({ ...options, resume: false });
      return;
    }

    const halts = [...inbox.matchAll(/^## \[.*?\] (ANDON_HALT|AWAITING_\w+) \| (TASK-\d{3})/gm)];
    if (halts.length === 0) {
      console.log('[LOOP] No pending halt conditions in INBOX. Resuming loop...');
      await this.execute({ ...options, resume: false });
      return;
    }

    console.log('[LOOP] Pending INBOX items (resolve before resuming):');
    for (const m of halts) {
      console.log(`  ${m[1]}: ${m[2]}`);
    }
    console.log('\n  Write APPROVE or REDIRECT: <instruction> inline in INBOX, then run arch loop --resume.');
  }

  private async appendInbox(taskId: string, type: string, evidence: string): Promise<void> {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const entry = `\n## [${ts}] ${type} | ${taskId}\nEvidence: ${evidence}\n`;
    const inboxPath = 'docs/INBOX.md';
    let existing = '';
    try { existing = await this.fileSystem.readFile(inboxPath); } catch {}
    await this.fileSystem.writeFile(inboxPath, existing + entry);
  }
}
