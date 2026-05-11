import { test } from 'node:test';
import assert from 'node:assert';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';
import type { IntentRepository } from '../../main/ts/domain/repositories/intent-repository.js';

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
