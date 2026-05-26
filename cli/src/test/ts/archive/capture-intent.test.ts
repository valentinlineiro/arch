import { test } from 'node:test';
import assert from 'node:assert';
import { CaptureIntent } from '../../../main/ts/application/use-cases/capture-intent.js';
import { IntentStatus } from '../../../main/ts/domain/models/intent.js';
import type { Intent } from '../../../main/ts/domain/models/intent.js';

class MockIntentRepository {
  saved: Intent[] = [];
  async getNextId() { return 'INTENT-001'; }
  async save(intent: Intent) { this.saved.push(intent); }
}

class MockGitRepository {
  branch = 'main';
  staged = ['cli/src/auth.ts'];
  modified = ['cli/src/index.ts'];
  root = '/home/user/project';

  async getCurrentBranch() { return this.branch; }
  async getStagedFiles() { return this.staged; }
  async getModifiedFiles() { return this.modified; }
  async getRepoRoot() { return this.root; }
}

class MockGitRepositoryThrows {
  async getCurrentBranch(): Promise<string> { throw new Error('no git'); }
  async getStagedFiles(): Promise<string[]> { throw new Error('no git'); }
  async getModifiedFiles(): Promise<string[]> { throw new Error('no git'); }
  async getRepoRoot(): Promise<string> { throw new Error('no git'); }
}

test('CaptureIntent creates an INTENT with CAPTURED status', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project/cli/src');
  const id = await useCase.execute('auth flow feels fragmented');
  assert.equal(id, 'INTENT-001');
  assert.equal(repo.saved.length, 1);
  assert.equal(repo.saved[0].status, IntentStatus.CAPTURED);
  assert.equal(repo.saved[0].rawIntent, 'auth flow feels fragmented');
});

test('CaptureIntent populates origin from git context', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project/cli/src');
  await useCase.execute('test intent');
  const intent = repo.saved[0];
  assert.equal(intent.origin.branch, 'main');
  assert.equal(intent.origin.source, 'cli');
  assert.equal(intent.origin.triggeredBy, 'capture');
});

test('CaptureIntent deduplicates recent_files between staged and modified', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  git.staged = ['shared.ts'];
  git.modified = ['shared.ts', 'other.ts'];
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project');
  await useCase.execute('test');
  const files = repo.saved[0].origin.recentFiles;
  assert.equal(files.filter(f => f === 'shared.ts').length, 1);
  assert.ok(files.includes('other.ts'));
});

test('CaptureIntent computes cwd relative to repo root', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  git.root = '/home/user/project';
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project/cli/src');
  await useCase.execute('test');
  assert.equal(repo.saved[0].origin.cwd, 'cli/src');
});

test('CaptureIntent handles git unavailable gracefully', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepositoryThrows();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/absolute/path');
  const id = await useCase.execute('test intent');
  assert.equal(id, 'INTENT-001');
  const intent = repo.saved[0];
  assert.equal(intent.origin.branch, undefined);
  assert.deepEqual(intent.origin.recentFiles, []);
  assert.equal(intent.origin.cwd, '/absolute/path');
});

test('CaptureIntent sets schema_version to 1', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project');
  await useCase.execute('test');
  assert.equal(repo.saved[0].schemaVersion, 1);
});
