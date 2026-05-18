import { test } from 'node:test';
import assert from 'node:assert';
import { CreateTask } from '../../main/ts/application/use-cases/create-task.js';
import { MockFileSystem, MockGitRepository } from './mocks/index.js';
import type { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';

function makeRepo(): TaskRepository {
  return {
    getNextId: async () => 'TASK-900',
    getById: async () => null,
    getAll: async () => [],
    getActive: async () => [],
    findReady: async () => [],
    save: async () => {},
  } as any;
}

function makeFs(): MockFileSystem {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ version: '0.6.0' });
  return fs;
}

test('CreateTask - XS 7-operations scaffold omits Definition of Done and Hansei', async () => {
  const fs = makeFs();
  const git = new MockGitRepository();
  const useCase = new CreateTask(makeRepo(), fs, git);

  await useCase.execute('run nightly backup', '7-operations', 'XS');

  const content = fs.files['docs/tasks/TASK-900.md'] ?? '';
  assert.ok(!content.includes('### Definition of Done'), 'XS stripped template should omit DoD section');
  assert.ok(!content.includes('## Hansei'), 'XS stripped template should omit Hansei section');
});

test('CreateTask - XS 6-writing scaffold omits Definition of Done and Hansei', async () => {
  const fs = makeFs();
  const git = new MockGitRepository();
  const useCase = new CreateTask(makeRepo(), fs, git);

  await useCase.execute('update release notes', '6-writing', 'XS');

  const content = fs.files['docs/tasks/TASK-900.md'] ?? '';
  assert.ok(!content.includes('### Definition of Done'), 'XS 6-writing stripped template should omit DoD');
  assert.ok(!content.includes('## Hansei'), 'XS 6-writing stripped template should omit Hansei');
});

test('CreateTask - M 2-code-generation scaffold includes Definition of Done and Hansei', async () => {
  const fs = makeFs();
  const git = new MockGitRepository();
  const useCase = new CreateTask(makeRepo(), fs, git);

  await useCase.execute('implement auth middleware', '2-code-generation', 'M');

  const content = fs.files['docs/tasks/TASK-900.md'] ?? '';
  assert.ok(content.includes('### Definition of Done'), 'M task should have DoD section');
  assert.ok(content.includes('## Hansei'), 'M task should have Hansei section');
});

test('CreateTask - XS 2-code-generation scaffold still includes Definition of Done (class not lightweight)', async () => {
  const fs = makeFs();
  const git = new MockGitRepository();
  const useCase = new CreateTask(makeRepo(), fs, git);

  await useCase.execute('fix lint error', '2-code-generation', 'XS');

  const content = fs.files['docs/tasks/TASK-900.md'] ?? '';
  assert.ok(content.includes('### Definition of Done'), 'XS 2-code-generation should keep full template');
});
