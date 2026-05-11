import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ScaffoldTask } from '../use-cases/scaffold-task.js';
import { FinalizePromotion } from '../use-cases/finalize-promotion.js';

const LOCK_TTL_MS = 5 * 60 * 1000;

export class ThinkCommand {
  constructor(
    private intentRepository: IntentRepository,
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private log: (s: string) => void = console.log,
  ) {}

  async execute(args: string[]): Promise<void> {
    if (args.length > 0) {
      await this.processIntent(args[0]);
    } else {
      const captured = await this.intentRepository.findCaptured();
      for (const intent of captured) {
        await this.processIntent(intent.id);
      }
    }

    await this.applyPendingPatches();
  }

  private async processIntent(intentId: string): Promise<void> {
    if (await this.findExistingScaffold(intentId)) {
      return;
    }

    try {
      const scaffold = new ScaffoldTask(this.intentRepository, this.taskRepository, this.fileSystem);
      const result = await scaffold.execute(intentId);
      this.log(`Scaffold created: ${result.taskId} ← ${result.intentId}`);
      this.log(`enrichment_phase: scaffolded`);
      this.log(`Agent: enrich ${result.taskId}, then write patches to .arch/pending/`);
    } catch (err: any) {
      this.log(`Error scaffolding ${intentId}: ${err.message}`);
    }
  }

  private async findExistingScaffold(intentId: string): Promise<boolean> {
    if (!(await this.fileSystem.exists('docs/tasks'))) return false;
    const files = await this.fileSystem.readDirectory('docs/tasks');
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await this.fileSystem.readFile(`docs/tasks/${file}`);
      if (content.includes(`**Source:** ${intentId}`)) {
        return true;
      }
    }
    return false;
  }

  private async applyPendingPatches(): Promise<void> {
    const pendingDir = '.arch/pending';
    if (!(await this.fileSystem.exists(pendingDir))) return;

    const files = await this.fileSystem.readDirectory(pendingDir);
    const patches = files.filter(f => f.endsWith('-patch.json'));

    for (const patchFile of patches) {
      const taskId = patchFile.replace('-patch.json', '');
      const patchPath = `${pendingDir}/${patchFile}`;

      let patch: any;
      try {
        patch = JSON.parse(await this.fileSystem.readFile(patchPath));
      } catch {
        continue;
      }

      const intentId: string = patch.intent_id;
      if (!intentId) continue;

      const transitionPath = `${pendingDir}/${intentId}-transition.json`;
      if (!(await this.fileSystem.exists(transitionPath))) continue;

      const lockPath = `.arch/locks/${taskId}.lock`;
      if (await this.fileSystem.exists(lockPath)) {
        const lockContent = await this.fileSystem.readFile(lockPath);
        const lockTime = new Date(lockContent).getTime();
        if (!isNaN(lockTime) && Date.now() - lockTime < LOCK_TTL_MS) {
          this.log(`Skipping ${taskId} — lock held by another process`);
          continue;
        }
        this.log(`Warning: stale lock for ${taskId}, cleaning up`);
        try { await this.fileSystem.deleteFile(lockPath); } catch { /* ignore */ }
      }

      await this.fileSystem.mkdir('.arch/locks');
      await this.fileSystem.writeFile(lockPath, new Date().toISOString());

      try {
        const finalize = new FinalizePromotion(this.fileSystem);
        const result = await finalize.execute(taskId, intentId);

        if (result.success) {
          this.log(`${taskId} promoted to DRAFT ← ${intentId}`);
          this.log(`enrichment_phase: finalized`);
          this.log(`Ready for human review`);
        } else {
          this.log(`Failed to finalize ${taskId}: ${result.reason}`);
        }
      } finally {
        if (await this.fileSystem.exists(lockPath)) {
          try { await this.fileSystem.deleteFile(lockPath); } catch { /* ignore */ }
        }
      }
    }
  }
}
