import { test } from 'node:test';
import assert from 'node:assert';
import { IntentStatus } from '../../../main/ts/domain/models/intent.js';
import { MarkdownIntentRepository } from '../../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

class MockFileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  async readFile(path: string) { return this.files[path] ?? ''; }
  async writeFile(path: string, content: string) {
    this.files[path] = content;
    const dir = path.split('/').slice(0, -1).join('/');
    if (!this.directories[dir]) this.directories[dir] = [];
    this.directories[dir].push(path.split('/').pop()!);
  }
  async exists(path: string) { return path in this.files || path in this.directories; }
  async readDirectory(path: string) { return this.directories[path] ?? []; }
  async rename() {}
  async mkdir(path: string) { this.directories[path] = this.directories[path] ?? []; }
  async appendFile(path: string, content: string) { this.files[path] = (this.files[path] ?? '') + content; }
  async deleteFile(path: string) { delete this.files[path]; }
}

test('IntentStatus has all required values', () => {
  assert.equal(IntentStatus.CAPTURED, 'CAPTURED');
  assert.equal(IntentStatus.PROMOTED, 'PROMOTED');
  assert.equal(IntentStatus.SIGNAL, 'SIGNAL');
  assert.equal(IntentStatus.SUPERSEDED, 'SUPERSEDED');
  assert.equal(IntentStatus.DISCARDED, 'DISCARDED');
});

test('MarkdownIntentRepository.getNextId returns INTENT-001 when no intents exist', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  const id = await repo.getNextId();
  assert.equal(id, 'INTENT-001');
});

test('MarkdownIntentRepository.getNextId increments from existing files', async () => {
  const fs = new MockFileSystem();
  fs.directories['docs/intents'] = ['INTENT-001.md', 'INTENT-002.md'];
  const repo = new MarkdownIntentRepository(fs as any);
  const id = await repo.getNextId();
  assert.equal(id, 'INTENT-003');
});

test('MarkdownIntentRepository.save writes a file with correct frontmatter', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  await repo.save({
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-07T14:00:00.000Z',
    updatedAt: '2026-05-07T14:00:00.000Z',
    origin: { source: 'cli', branch: 'main', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: [] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'auth flow feels fragmented',
  });
  const content = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(content.includes('id: INTENT-001'));
  assert.ok(content.includes('status: CAPTURED'));
  assert.ok(content.includes('schema_version: 1'));
  assert.ok(content.includes('auth flow feels fragmented'));
});

test('MarkdownIntentRepository.save includes recent_files when provided', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  await repo.save({
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-07T14:00:00.000Z',
    updatedAt: '2026-05-07T14:00:00.000Z',
    origin: { source: 'cli', branch: 'feat/auth', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: ['cli/src/main.ts'] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'test intent',
  });
  const content = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(content.includes('- cli/src/main.ts'));
  assert.ok(content.includes('branch: feat/auth'));
});

test('MarkdownIntentRepository.save omits branch and cwd when undefined', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  await repo.save({
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-07T14:00:00.000Z',
    updatedAt: '2026-05-07T14:00:00.000Z',
    origin: { source: 'cli', triggeredBy: 'capture', recentFiles: [] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'test',
  });
  const content = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(!content.includes('branch:'));
  assert.ok(!content.includes('cwd:'));
});
