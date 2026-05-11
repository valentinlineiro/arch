import type { FileSystem } from '../../domain/repositories/file-system.js';

interface TaskPatch {
  task_id: string;
  intent_id: string;
  schema_version: number;
  produced_at: string;
  actor: { name: string; model: string; version: string };
  content: string;
}

export interface FinalizeResult {
  success: boolean;
  reason?: string;
}

export class FinalizePromotion {
  constructor(private fileSystem: FileSystem) {}

  async execute(taskId: string, intentId: string): Promise<FinalizeResult> {
    const taskPath = `docs/tasks/${taskId}.md`;
    const intentPath = `docs/intents/${intentId}.md`;
    const patchPath = `.arch/pending/${taskId}-patch.json`;
    const transitionPath = `.arch/pending/${intentId}-transition.json`;
    const lockPath = `.arch/locks/${taskId}.lock`;
    const snapshotPath = `.arch/enrichments/${taskId}.json`;
    const errorPath = `.arch/enrichments/${taskId}-error.json`;
    const stagingTask = `.arch/staging/${taskId}.md`;
    const stagingIntent = `.arch/staging/${intentId}.md`;
    const stagingSnapshot = `.arch/staging/${taskId}-snapshot.json`;

    const cleanup = async () => {
      for (const p of [patchPath, transitionPath, lockPath, stagingTask, stagingIntent, stagingSnapshot]) {
        if (await this.fileSystem.exists(p)) {
          try { await this.fileSystem.deleteFile(p); } catch { /* best effort */ }
        }
      }
    };

    try {
      // Parse and validate patch
      const patchRaw = await this.fileSystem.readFile(patchPath);
      let patch: TaskPatch;
      try {
        patch = JSON.parse(patchRaw);
      } catch {
        await this.writeError(errorPath, taskId, intentId, patchRaw, 'patch JSON parse failure');
        await cleanup();
        return { success: false, reason: 'patch JSON parse failure' };
      }

      if (!patch.content || !patch.content.trim()) {
        await this.writeError(errorPath, taskId, intentId, patchRaw, 'patch content is empty');
        await cleanup();
        return { success: false, reason: 'patch content is empty' };
      }

      // Preconditions
      const taskContent = await this.fileSystem.readFile(taskPath);
      if (!taskContent.includes('enrichment_phase: scaffolded')) {
        await cleanup();
        return { success: false, reason: `${taskId} enrichment_phase is not scaffolded` };
      }

      const intentContent = await this.fileSystem.readFile(intentPath);
      if (!intentContent.includes('status: CAPTURED')) {
        await cleanup();
        return { success: false, reason: `${intentId} is not CAPTURED` };
      }

      if (await this.fileSystem.exists(snapshotPath)) {
        await cleanup();
        return { success: false, reason: `enrichment snapshot already exists for ${taskId}` };
      }

      // Stage all writes
      await this.fileSystem.mkdir('.arch/staging');
      await this.fileSystem.mkdir('.arch/enrichments');

      const mergedTask = this.mergeTaskContent(taskContent, patch);
      await this.fileSystem.writeFile(stagingTask, mergedTask);

      const updatedIntent = this.promoteIntent(intentContent, taskId);
      await this.fileSystem.writeFile(stagingIntent, updatedIntent);

      const snapshot = JSON.stringify({
        task_id: taskId,
        intent_id: intentId,
        finalized_at: new Date().toISOString(),
        actor: patch.actor,
        content: patch.content,
      }, null, 2);
      await this.fileSystem.writeFile(stagingSnapshot, snapshot);

      // Commit via ordered atomic renames
      await this.fileSystem.rename(stagingTask, taskPath);         // step A
      await this.fileSystem.rename(stagingIntent, intentPath);     // step B
      await this.fileSystem.rename(stagingSnapshot, snapshotPath); // step C

      await cleanup();
      return { success: true };

    } catch (err: any) {
      await cleanup();
      return { success: false, reason: err.message };
    }
  }

  private mergeTaskContent(scaffoldContent: string, patch: TaskPatch): string {
    let merged = scaffoldContent
      .replace('enrichment_phase: scaffolded', 'enrichment_phase: finalized')
      .replace('enriched_by: ~', `enriched_by:\n  actor: ${patch.actor.name}\n  model: ${patch.actor.model}\n  version: ${patch.actor.version}`);

    // Replace placeholder sections with agent content
    merged = merged.replace(
      /### Objective\n\n_Awaiting agent enrichment_[\s\S]*/,
      patch.content
    );

    return merged;
  }

  private promoteIntent(intentContent: string, taskId: string): string {
    const now = new Date().toISOString();
    return intentContent
      .replace(/^status: CAPTURED$/m, 'status: PROMOTED')
      .replace(/^updated_at: .+$/m, `updated_at: ${now}`)
      .replace(/^promoted_to: \[\]$/m, `promoted_to:\n  - ${taskId}`);
  }

  private async writeError(errorPath: string, taskId: string, intentId: string, rawPatch: string, reason: string): Promise<void> {
    await this.fileSystem.mkdir('.arch/enrichments');
    const error = JSON.stringify({
      task_id: taskId,
      intent_id: intentId,
      failed_at: new Date().toISOString(),
      reason,
      raw_patch: rawPatch,
    }, null, 2);
    await this.fileSystem.writeFile(errorPath, error);
  }
}
