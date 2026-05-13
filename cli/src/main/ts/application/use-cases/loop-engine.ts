import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { DriftChecker } from '../use-cases/drift-checker.js';
import { Task, TaskStatus } from '../../domain/models/task.js';
import { SelectNextTask } from './select-next-task.js';
import { GovernSystem } from './govern-system.js';
import { ReviewSystem } from './review-system.js';
import { MarkTaskDone } from './mark-task-done.js';
import { EscalationStore } from './escalation-store.js';
import { NodeFeedbackRepository } from '../../infrastructure/filesystem/node-feedback-repository.js';
import { SubprocessRunner } from '../../infrastructure/cli/subprocess-runner.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { BridgeProvider } from '../../domain/services/bridge-provider.js';
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';

export interface LoopOptions {
  sprint?: string;
  dryRun?: boolean;
  resume?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

const ANDON_MAX_FAILURES = 3;
const SPRINT_ANDON_MAX = 2;
const ARCH_SH = './scripts/arch.sh';

export class LoopEngine {
  private reviewFailures = new Map<string, number>();
  private sprintAndonCount = 0;
  private checkpointWritten = false;
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
    this.markTaskDone = new MarkTaskDone(taskRepository, reviewer, fileSystem, undefined, new NodeFeedbackRepository(fileSystem));
  }

  private log(message: string) {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] ${message}`);
  }

  private normalizeSprintSlug(slug: string): string {
    return slug.startsWith('sprint/') ? slug : `sprint/${slug}`;
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

      // 2. SELECT — scoped to sprint if --sprint, then focused task, then priority order
      this.log('[LOOP] Phase: SELECT');
      const activeTasks = await this.taskRepository.getActive();

      let sprintCandidates = activeTasks;
      if (options.sprint) {
        const normalised = this.normalizeSprintSlug(options.sprint);
        sprintCandidates = activeTasks.filter(t => t.sprint === normalised || t.sprint === options.sprint);
      }

      let task: Task | undefined = sprintCandidates.find(
        t => t.focus && (t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.READY || t.status === TaskStatus.REVIEW)
      );

      if (!task) {
        const selector = new SelectNextTask(this.taskRepository);
        const result = await selector.execute(options.sprint ? { sprintSlug: options.sprint } : undefined);
        if (!result.ok) {
          this.log('[LOOP] No unblocked READY tasks. Loop complete.');
          break;
        }
        task = result.task;
      }

      this.log(`[LOOP] Selected: ${task.id} — ${task.title} (${task.priority} | ${task.size})`);

      if (options.dryRun) {
        this.log(`[dry-run] Would execute cycle for ${task.id}`);
        break;
      }

      const cycleStart = Date.now();

      // 3. EXEC — try candidate providers until one succeeds or all fail
      this.log(`[LOOP] Phase: EXEC (${task.id})`);

      if (this.providerRegistry) {
        const candidates = this.providerRegistry.resolveAll(
          task.class ?? '',
          task.size ?? '',
          bin => spawnSync('which', [bin]).status === 0
        );

        if (candidates.length === 0) {
          const reason = `No AI provider detected for task class "${task.class}" size "${task.size}" — halting`;
          const shouldContinue = await this.triggerAndon(task.id, reason, options);
          if (!shouldContinue) {
            console.error(`[LOOP] ${reason}`);
            process.exit(1);
          }
          continue;
        }

        let success = false;
        for (const { provider, name, model } of candidates) {
          if (name === 'local') {
            const reason = 'Routing: local (human intervention required) — halting autonomous loop';
            await this.appendInbox(task.id, 'ANDON_HALT', reason);
            console.log(`[LOOP] ${reason}`);
            process.exit(1);
          }

          if (!provider) continue;

          this.log(`[LOOP] Attempting ${name} | Model: ${model || 'default'}`);

          let turns: number | undefined;
          let cost: string | undefined;

          if (provider instanceof BridgeProvider) {
            const DO_PROMPT_FILE = 'docs/agents/DO.md';
            const cmd = provider.buildCommand(model || '', DO_PROMPT_FILE);
            const result = await this.runStreaming(cmd, EXEC_TIMEOUT_MS, !options.quiet);
            if (result.status !== 0) {
              const reason = result.signal === 'SIGTERM'
                ? `EXEC timeout exceeded (${timeoutMinutes}m)`
                : `provider ${name} exited with code ${result.status}`;
              this.log(`[LOOP] Provider ${name} failed: ${reason}. Trying next...`);
              continue;
            }
            const meta = provider.parseMetadata(result.stdout, Date.now() - cycleStart);
            turns = meta.turns;
            cost = meta.cost;
          } else {
            // NativeProvider: async completion
            try {
              const DO_PROMPT_FILE = 'docs/agents/DO.md';
              const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
              const response = await provider.complete({
                model: model || '',
                messages: [{ role: 'user', content: promptContent }],
              });
              console.log(response.content);
              turns = response.usage.turns;
              cost = response.usage.cost;
            } catch (err: any) {
              this.log(`[LOOP] Provider ${name} error: ${err.message}. Trying next...`);
              continue;
            }
          }

          if (turns !== undefined || cost !== undefined) {
            const summary = [turns ? `${turns} turns` : '', cost ? `cost ${cost}` : ''].filter(Boolean).join(', ');
            this.log(`[LOOP] Agent activity: ${summary}`);
          }
          success = true;
          break;
        }

        if (!success) {
          const reason = 'All candidate providers failed — halting';
          const shouldContinue = await this.triggerAndon(task.id, reason, options);
          if (!shouldContinue) {
            console.error(`[LOOP] ${reason}. INBOX updated.`);
            process.exit(1);
          }
          continue;
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
          const shouldContinue = await this.triggerAndon(task.id, reason, options);
          if (!shouldContinue) {
            console.error(`[LOOP] Exec failed for ${task.id}. ${reason}. INBOX updated. Halting.`);
            process.exit(1);
          }
          continue;
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
          const reason = `arch review failed ${failures} consecutive times. Write APPROVE or REDIRECT in INBOX then run arch loop --resume.`;
          const shouldContinue = await this.triggerAndon(task.id, reason, options);
          if (!shouldContinue) {
            console.error(`[LOOP] Andon Cord: ${task.id} halted after ${failures} review failures.`);
            process.exit(1);
          }
          continue;
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

      // Reset sprint Andon counter on successful task completion
      this.sprintAndonCount = 0;

      const elapsed = Math.round((Date.now() - cycleStart) / 1000);
      this.log(`[LOOP] ✓ ${task.id} done in ${elapsed}s.`);

      // 6. SPRINT_CHECKPOINT — pause at 50% for async human review
      if (options.sprint && !this.checkpointWritten) {
        const allTasks = await this.taskRepository.getAll();
        const normalised = this.normalizeSprintSlug(options.sprint);
        const sprintTasks = allTasks.filter(t => t.sprint === normalised || t.sprint === options.sprint);
        const doneTasks = sprintTasks.filter(t => t.status === TaskStatus.DONE);

        if (sprintTasks.length > 0 && doneTasks.length / sprintTasks.length >= 0.5) {
          const alreadyWritten = await this.hasSprintCheckpoint(options.sprint);
          if (!alreadyWritten) {
            this.log(`[LOOP] Sprint checkpoint: ${doneTasks.length}/${sprintTasks.length} tasks done. Pausing for review.`);
            await this.appendSprintCheckpoint(options.sprint, doneTasks.length, sprintTasks.length);
            this.checkpointWritten = true;
            this.log('[LOOP] SPRINT_CHECKPOINT written to INBOX. Run arch loop --sprint --resume to continue.');
            break;
          }
          this.checkpointWritten = true;
        }
      }
    }

    this.log('[LOOP] Done.');
  }

  private runStreaming(
    cmd: string,
    timeoutMs: number,
    stream: boolean
  ): Promise<{ status: number; signal: string | null; stdout: string }> {
    return new Promise((resolve) => {
      const chunks: string[] = [];
      const child = spawn('sh', ['-c', cmd], {
        stdio: ['ignore', 'pipe', 'inherit'],
        timeout: timeoutMs,
      });
      child.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        if (stream) process.stdout.write(text);
        chunks.push(text);
      });
      child.on('close', (code, signal) => {
        resolve({ status: code ?? 1, signal, stdout: chunks.join('') });
      });
    });
  }

  private async triggerAndon(taskId: string, reason: string, options: LoopOptions): Promise<boolean> {
    await this.appendInbox(taskId, 'ANDON_HALT', reason);

    if (!options.sprint) {
      return false;
    }

    this.sprintAndonCount += 1;
    if (this.sprintAndonCount > SPRINT_ANDON_MAX) {
      const sprintReason = `${this.sprintAndonCount} consecutive Andon conditions in sprint ${options.sprint}. Manual intervention required.`;
      await this.appendInbox(taskId, 'ANDON_HALT', sprintReason);
      console.error(`[LOOP] Sprint Andon limit exceeded (${this.sprintAndonCount} consecutive). Halting.`);
      return false;
    }

    console.warn(`[LOOP] Andon condition for ${taskId} (${this.sprintAndonCount}/${SPRINT_ANDON_MAX} sprint limit). Continuing to next task.`);
    return true;
  }

  private async hasSprintCheckpoint(sprint: string): Promise<boolean> {
    try {
      const inbox = await this.fileSystem.readFile('docs/INBOX.md');
      const normalised = this.normalizeSprintSlug(sprint);
      return inbox.includes('SPRINT_CHECKPOINT') && (inbox.includes(normalised) || inbox.includes(sprint));
    } catch {
      return false;
    }
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
    const checkpoints = [...inbox.matchAll(/^## \[.*?\] SPRINT_CHECKPOINT \| sprint\//gm)];

    if (halts.length === 0 && checkpoints.length === 0) {
      console.log('[LOOP] No pending halt conditions in INBOX. Resuming loop...');
      await this.execute({ ...options, resume: false });
      return;
    }

    if (halts.length > 0) {
      console.log('[LOOP] Pending INBOX items (resolve before resuming):');
      for (const m of halts) {
        console.log(`  ${m[1]}: ${m[2]}`);
      }
      console.log('\n  Write APPROVE or REDIRECT: <instruction> inline in INBOX, then run arch loop --resume.');
      return;
    }

    if (checkpoints.length > 0) {
      console.log('[LOOP] Sprint checkpoint detected — async human review complete. Resuming sprint...');
      this.checkpointWritten = true;
      await this.execute({ ...options, resume: false });
    }
  }

  private async appendInbox(taskId: string, type: string, evidence: string): Promise<void> {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const entry = `\n## [${ts}] ${type} | ${taskId}\nEvidence: ${evidence}\n`;
    const inboxPath = 'docs/INBOX.md';
    let existing = '';
    try { existing = await this.fileSystem.readFile(inboxPath); } catch {}
    await this.fileSystem.writeFile(inboxPath, existing + entry);

    if (type === 'ANDON_HALT') {
      const store = new EscalationStore(this.fileSystem);
      await store.append('ANDON_HALT', taskId, evidence);
    }
  }

  private async appendSprintCheckpoint(sprint: string, done: number, total: number): Promise<void> {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const normalised = this.normalizeSprintSlug(sprint);
    const entry = `\n## [${ts}] SPRINT_CHECKPOINT | ${normalised}\nProgress: ${done}/${total} tasks done (${Math.round(done / total * 100)}%). Review sprint state before continuing.\n`;
    const inboxPath = 'docs/INBOX.md';
    let existing = '';
    try { existing = await this.fileSystem.readFile(inboxPath); } catch {}
    await this.fileSystem.writeFile(inboxPath, existing + entry);
  }
}
