import { test } from 'node:test';
import assert from 'node:assert';
import { TaskStatus } from '../../../main/ts/domain/models/task.js';
import type { Intent } from '../../../main/ts/domain/models/intent.js';
import type { IntentRepository } from '../../../main/ts/domain/repositories/intent-repository.js';
import { IntentStatus } from '../../../main/ts/domain/models/intent.js';
import { MarkdownIntentRepository } from '../../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

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

class StubFS {
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
  const fs = new StubFS();
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
  const fs = new StubFS();
  fs.directories['docs/intents'] = [];
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = await repo.getById('INTENT-999');
  assert.strictEqual(intent, null);
});

test('MarkdownIntentRepository.findCaptured returns only CAPTURED intents', async () => {
  const fs = new StubFS();
  fs.directories['docs/intents'] = ['INTENT-001.md', 'INTENT-002.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  fs.files['docs/intents/INTENT-002.md'] = INTENT_MD.replace('status: CAPTURED', 'status: PROMOTED');
  const repo = new MarkdownIntentRepository(fs as any);
  const captured = await repo.findCaptured();
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].id, 'INTENT-001');
});

test('MarkdownIntentRepository.update serializes status and promotedTo', async () => {
  const fs = new StubFS();
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

import { ScaffoldTask } from '../../../main/ts/application/use-cases/scaffold-task.js';
import type { Task } from '../../../main/ts/domain/models/task.js';

class StubIntentRepo {
  intents = [{
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-11T10:00:00Z',
    updatedAt: '2026-05-11T10:00:00Z',
    origin: { source: 'cli', branch: 'main', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: [] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'fix oauth callback session loss',
  }];
  async getNextId() { return 'INTENT-001'; }
  async save(_i: any) {}
  async getById(id: string) { return this.intents.find(i => i.id === id) ?? null; }
  async update(_i: any) {}
  async findCaptured() { return this.intents.filter(i => i.status === IntentStatus.CAPTURED); }
}

class StubTaskRepo {
  tasks: Task[] = [];
  async getNextId() { return 'TASK-212'; }
  async getAll() { return this.tasks; }
  async getActive() { return this.tasks; }
  async getById(id: string) { return this.tasks.find(t => t.id === id) ?? null; }
  async findReady() { return []; }
  async save(_t: Task) {}
}

test('ScaffoldTask writes a DRAFT task file with enrichment_phase: scaffolded', async () => {
  const fs = new StubFS();
  const intentRepo = new StubIntentRepo();
  const taskRepo = new StubTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  const result = await useCase.execute('INTENT-001');

  assert.strictEqual(result.taskId, 'TASK-212');
  assert.strictEqual(result.intentId, 'INTENT-001');

  const taskFile = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskFile, 'task file should exist');
  assert.ok(taskFile.includes('## TASK-212:'));
  assert.ok(taskFile.includes('DRAFT'));
  assert.ok(taskFile.includes('enrichment_phase: scaffolded'));
  assert.ok(taskFile.includes('**Source:** INTENT-001'));
});

test('ScaffoldTask aborts if intent not CAPTURED', async () => {
  const fs = new StubFS();
  const intentRepo = new StubIntentRepo();
  intentRepo.intents[0] = { ...intentRepo.intents[0], status: IntentStatus.PROMOTED };
  const taskRepo = new StubTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await assert.rejects(
    () => useCase.execute('INTENT-001'),
    /not CAPTURED/,
  );
});

test('ScaffoldTask aborts if task file already exists', async () => {
  const fs = new StubFS();
  fs.files['docs/tasks/TASK-212.md'] = 'existing content';
  const intentRepo = new StubIntentRepo();
  const taskRepo = new StubTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await assert.rejects(
    () => useCase.execute('INTENT-001'),
    /already exists/,
  );
});

test('ScaffoldTask aborts if intent already has promotedTo', async () => {
  const fs = new StubFS();
  const intentRepo = new StubIntentRepo();
  intentRepo.intents[0] = { ...intentRepo.intents[0], promotedTo: ['TASK-100'] };
  const taskRepo = new StubTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await assert.rejects(
    () => useCase.execute('INTENT-001'),
    /already promoted/,
  );
});

test('ScaffoldTask title is truncated to 60 chars when rawIntent is long', async () => {
  const fs = new StubFS();
  const intentRepo = new StubIntentRepo();
  intentRepo.intents[0] = { ...intentRepo.intents[0], rawIntent: 'a'.repeat(80) };
  const taskRepo = new StubTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await useCase.execute('INTENT-001');

  const content = fs.files['docs/tasks/TASK-212.md'];
  const headerMatch = content.match(/^## TASK-212: (.+)$/m);
  assert.ok(headerMatch, 'Header should be present');
  assert.ok(headerMatch![1].endsWith('...'), 'Long title should end with ...');
  assert.ok(headerMatch![1].length <= 63, 'Title part should not exceed 60 + 3 chars');
});

// Invariant 7: EXECUTION_ELIGIBLE := TASK.state == READY only
test('EXECUTION_ELIGIBLE: only READY tasks are eligible, DRAFT is not', () => {
  // DRAFT is never eligible
  assert.notStrictEqual(TaskStatus.DRAFT, TaskStatus.READY);
  // BACKLOG, IN_PROGRESS, REVIEW, DONE, REJECTED are also not READY
  const nonEligible = [TaskStatus.DRAFT, TaskStatus.BACKLOG, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE, TaskStatus.REJECTED];
  for (const status of nonEligible) {
    assert.notStrictEqual(status, TaskStatus.READY, `${status} should not be READY`);
  }
});
