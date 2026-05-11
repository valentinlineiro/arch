import { test } from 'node:test';
import assert from 'node:assert';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';
import type { IntentRepository } from '../../main/ts/domain/repositories/intent-repository.js';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import { MarkdownIntentRepository } from '../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

test('TaskStatus.DRAFT is defined and distinct from BACKLOG', () => {
  assert.strictEqual(TaskStatus.DRAFT, 'DRAFT');
  assert.notStrictEqual(TaskStatus.DRAFT, TaskStatus.BACKLOG);
});

// Type-level test: IntentRepository interface must declare findCaptured and getById
test('IntentRepository interface includes getById, update, findCaptured', () => {
  const _typeCheck: IntentRepository = {
    getNextId: async () => 'INTENT-001',
    save: async () => {},
    getById: async (_id: string) => null,
    update: async (_intent: Intent) => {},
    findCaptured: async () => [],
  };
  assert.ok(_typeCheck);
});

class MockFS {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  deleted: string[] = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename(o: string, n: string) { this.files[n] = this.files[o]; delete this.files[o]; }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async deleteFile(p: string) { this.deleted.push(p); delete this.files[p]; }
}

const INTENT_MD = `---
id: INTENT-001
schema_version: 1
status: CAPTURED
created_at: 2026-05-11T10:00:00Z
updated_at: 2026-05-11T10:00:00Z

origin:
  source: cli
  branch: main
  cwd: cli/src
  triggered_by: capture
  recent_files: []

interpretations: []
promoted_to: []
superseded_by: []
---

fix oauth callback session loss
`;

test('MarkdownIntentRepository.getById returns parsed intent', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = await repo.getById('INTENT-001');
  assert.ok(intent);
  assert.strictEqual(intent!.id, 'INTENT-001');
  assert.strictEqual(intent!.status, IntentStatus.CAPTURED);
  assert.strictEqual(intent!.rawIntent, 'fix oauth callback session loss');
});

test('MarkdownIntentRepository.getById returns null for unknown id', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = [];
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = await repo.getById('INTENT-999');
  assert.strictEqual(intent, null);
});

test('MarkdownIntentRepository.findCaptured returns only CAPTURED intents', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = ['INTENT-001.md', 'INTENT-002.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  fs.files['docs/intents/INTENT-002.md'] = INTENT_MD.replace('status: CAPTURED', 'status: PROMOTED');
  const repo = new MarkdownIntentRepository(fs as any);
  const captured = await repo.findCaptured();
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].id, 'INTENT-001');
});

test('MarkdownIntentRepository.update serializes status and promotedTo', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = (await repo.getById('INTENT-001'))!;
  intent.status = IntentStatus.PROMOTED;
  intent.promotedTo = ['TASK-212'];
  await repo.update(intent);
  const written = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(written.includes('status: PROMOTED'));
  assert.ok(written.includes('- TASK-212'));
});
