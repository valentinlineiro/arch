import path from 'node:path';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { Intent } from '../../domain/models/intent.js';
import type { IntentRepository } from '../../domain/repositories/intent-repository.js';

export class MarkdownIntentRepository implements IntentRepository {
  private intentsDir = 'docs/intents';

  constructor(private fileSystem: FileSystem) {}

  async getNextId(): Promise<string> {
    if (!(await this.fileSystem.exists(this.intentsDir))) {
      return 'INTENT-001';
    }
    const files = await this.fileSystem.readDirectory(this.intentsDir);
    const ids = files
      .filter(f => /^INTENT-\d{3}\.md$/.test(f))
      .map(f => parseInt(f.replace('INTENT-', '').replace('.md', ''), 10));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `INTENT-${(maxId + 1).toString().padStart(3, '0')}`;
  }

  async save(intent: Intent): Promise<void> {
    await this.fileSystem.mkdir(this.intentsDir);
    const filePath = path.join(this.intentsDir, `${intent.id}.md`);
    await this.fileSystem.writeFile(filePath, this.serialize(intent));
  }

  private serialize(intent: Intent): string {
    const recentFilesYaml =
      intent.origin.recentFiles.length === 0
        ? '  recent_files: []'
        : '  recent_files:\n' +
          intent.origin.recentFiles.map(f => `    - ${f}`).join('\n');

    const lines: (string | null)[] = [
      '---',
      `id: ${intent.id}`,
      `schema_version: ${intent.schemaVersion}`,
      `status: ${intent.status}`,
      `created_at: ${intent.createdAt}`,
      `updated_at: ${intent.updatedAt}`,
      '',
      'origin:',
      `  source: ${intent.origin.source}`,
      intent.origin.branch != null ? `  branch: ${intent.origin.branch}` : null,
      intent.origin.cwd != null ? `  cwd: ${intent.origin.cwd}` : null,
      `  triggered_by: ${intent.origin.triggeredBy}`,
      recentFilesYaml,
      '',
      'interpretations: []',
      'promoted_to: []',
      'superseded_by: []',
      '---',
      '',
      intent.rawIntent,
    ];

    return lines.filter((l): l is string => l !== null).join('\n');
  }
}
