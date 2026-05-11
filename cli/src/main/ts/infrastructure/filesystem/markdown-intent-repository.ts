import path from 'node:path';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { Intent, IntentStatus } from '../../domain/models/intent.js';
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
      .filter(f => /^INTENT-\d+\.md$/.test(f))
      .map(f => parseInt(f.replace('INTENT-', '').replace('.md', ''), 10));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `INTENT-${(maxId + 1).toString().padStart(3, '0')}`;
  }

  async save(intent: Intent): Promise<void> {
    await this.fileSystem.mkdir(this.intentsDir);
    const filePath = path.join(this.intentsDir, `${intent.id}.md`);
    await this.fileSystem.writeFile(filePath, this.serialize(intent));
  }

  async getById(id: string): Promise<Intent | null> {
    const filePath = path.join(this.intentsDir, `${id}.md`);
    if (!(await this.fileSystem.exists(filePath))) return null;
    const content = await this.fileSystem.readFile(filePath);
    return this.deserialize(content);
  }

  async update(intent: Intent): Promise<void> {
    const filePath = path.join(this.intentsDir, `${intent.id}.md`);
    await this.fileSystem.writeFile(filePath, this.serialize(intent));
  }

  async findCaptured(): Promise<Intent[]> {
    if (!(await this.fileSystem.exists(this.intentsDir))) return [];
    const files = await this.fileSystem.readDirectory(this.intentsDir);
    const intents: Intent[] = [];
    for (const file of files) {
      if (!/^INTENT-\d+\.md$/.test(file)) continue;
      const content = await this.fileSystem.readFile(path.join(this.intentsDir, file));
      const intent = this.deserialize(content);
      if (intent && intent.status === IntentStatus.CAPTURED) {
        intents.push(intent);
      }
    }
    return intents;
  }

  private deserialize(content: string): Intent | null {
    // Extract front matter between --- delimiters
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const frontMatter = match[1];
    const body = match[2].trim();

    const getField = (key: string): string | undefined => {
      const m = frontMatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
      return m ? m[1].trim() : undefined;
    };

    const getIntField = (key: string): number => {
      const v = getField(key);
      return v !== undefined ? parseInt(v, 10) : 0;
    };

    const getBlockList = (key: string): string[] => {
      // Match either inline `key: []` or block list `key:\n  - item`
      const inlineMatch = frontMatter.match(new RegExp(`^${key}:\\s*\\[\\]`, 'm'));
      if (inlineMatch) return [];
      const blockMatch = frontMatter.match(new RegExp(`^${key}:\\n((?:  - .+\\n?)*)`, 'm'));
      if (!blockMatch) return [];
      return blockMatch[1]
        .split('\n')
        .filter(l => l.trim().startsWith('- '))
        .map(l => l.trim().slice(2).trim());
    };

    // Parse origin block
    const originMatch = frontMatter.match(/^origin:\n((?:  .+\n?)*)/m);
    const originBlock = originMatch ? originMatch[1] : '';

    const originField = (key: string): string | undefined => {
      const m = originBlock.match(new RegExp(`^  ${key}:\\s*(.+)$`, 'm'));
      return m ? m[1].trim() : undefined;
    };

    const recentFilesInline = originBlock.match(/^  recent_files:\s*\[\]$/m);
    const recentFiles: string[] = recentFilesInline
      ? []
      : (() => {
          const blockM = originBlock.match(/^  recent_files:\n((?:    - .+\n?)*)/m);
          if (!blockM) return [];
          return blockM[1]
            .split('\n')
            .filter(l => l.trim().startsWith('- '))
            .map(l => l.trim().slice(2).trim());
        })();

    const id = getField('id');
    const statusStr = getField('status');
    if (!id || !statusStr) return null;

    const status = statusStr as IntentStatus;

    return {
      id,
      schemaVersion: getIntField('schema_version'),
      status,
      createdAt: getField('created_at') ?? '',
      updatedAt: getField('updated_at') ?? '',
      origin: {
        source: originField('source') ?? '',
        branch: originField('branch'),
        cwd: originField('cwd'),
        triggeredBy: originField('triggered_by') ?? '',
        recentFiles,
      },
      interpretations: [],
      promotedTo: getBlockList('promoted_to'),
      supersededBy: getBlockList('superseded_by'),
      rawIntent: body,
    };
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
      // interpretations are written directly by THINK as an LLM agent — not serialized here
      'interpretations: []',
      intent.promotedTo.length === 0
        ? 'promoted_to: []'
        : 'promoted_to:\n' + intent.promotedTo.map(t => `  - ${t}`).join('\n'),
      intent.supersededBy.length === 0
        ? 'superseded_by: []'
        : 'superseded_by:\n' + intent.supersededBy.map(t => `  - ${t}`).join('\n'),
      '---',
      '',
      intent.rawIntent,
    ];

    return lines.filter((l): l is string => l !== null).join('\n') + '\n';
  }
}
