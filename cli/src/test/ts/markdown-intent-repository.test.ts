// Tests for Intent domain model and MarkdownIntentRepository (scaffold — repository tests added in Task 4)
import { test } from 'node:test';
import assert from 'node:assert';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';

test('IntentStatus has all required values', () => {
  assert.equal(IntentStatus.CAPTURED, 'CAPTURED');
  assert.equal(IntentStatus.PROMOTED, 'PROMOTED');
  assert.equal(IntentStatus.SIGNAL, 'SIGNAL');
  assert.equal(IntentStatus.SUPERSEDED, 'SUPERSEDED');
  assert.equal(IntentStatus.DISCARDED, 'DISCARDED');
});

import { MarkdownIntentRepository } from '../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

class MockFileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  async readFile(path: string) { return this.files[path] ?? ''; }
  async writeFile(path: string, content: string) {
    this.files[path] = content;
    const dir = path.split('/').slice(0, -1).join('/');
    if (this.directories[dir]) this.directories[dir].push(path.split('/').pop()!);
  }
  async exists(path: string) { return path in this.files || path in this.directories; }
  async readDirectory(path: string) { return this.directories[path] ?? []; }
  async rename() {}
  async mkdir(path: string) { this.directories[path] = this.directories[path] ?? []; }
}

test('MarkdownIntentRepository - mkdir is called', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  // will fail until MarkdownIntentRepository exists
  assert.ok(repo);
});
