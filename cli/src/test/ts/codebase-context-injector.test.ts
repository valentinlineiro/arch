import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CodebaseContextInjector } from '../../main/ts/application/use-cases/codebase-context-injector.js';
import type { FileSystem } from '../../main/ts/domain/repositories/file-system.js';
import type { GitRepository } from '../../main/ts/domain/repositories/git-repository.js';

class MockFileSystem implements FileSystem {
  files: Record<string, string> = {};
  written: Record<string, string> = {};
  constructor() {}
  async readFile(path: string): Promise<string> {
    if (this.files[path]) return this.files[path];
    throw new Error(`ENOENT: ${path}`);
  }
  async writeFile(path: string, content: string): Promise<void> { this.written[path] = content; }
  async exists(path: string): Promise<boolean> { return path in this.files; }
  async readDirectory(path: string): Promise<string[]> { return Object.keys(this.files).filter(f => f.startsWith(path)).map(f => f.replace(path + '/', '')); }
  async deleteFile(path: string): Promise<void> { delete this.files[path]; }
  async mkdir(path: string): Promise<void> {}
  async copyFile(src: string, dest: string): Promise<void> {}
}

class MockGitRepository implements GitRepository {
  commits: Array<{ hash: string; message: string; date: string; files: Array<{ path: string; status: string; oldPath?: string }> }> = [];
  constructor() {}
  async getDiff(args?: string[]): Promise<string> { return ''; }
  async getLastCommitMessage(): Promise<string | null> { return null; }
  async getCurrentBranch(): Promise<string> { return 'main'; }
  async getStatusLines(): Promise<string[]> { return []; }
  async getLog(limit: number): Promise<string[]> { return []; }
  async add(path: string): Promise<void> {}
  async rm(path: string): Promise<void> {}
  async mv(oldPath: string, newPath: string): Promise<void> {}
  async commit(message: string): Promise<void> {}
  async getFileLastModifiedDate(path: string): Promise<Date | null> { return null; }
  async getChangedFilesInLastCommit(): Promise<string[]> { return []; }
  async getMergeCommits(limit: number): Promise<string[]> { return []; }
  async getStagedFiles(): Promise<string[]> { return []; }
  async getModifiedFiles(): Promise<string[]> { return []; }
  async getRepoRoot(): Promise<string> { return '/repo'; }
  async getFileFirstCommitDate(path: string): Promise<Date | null> { return null; }
  async getLastCommitHash(): Promise<string | null> { return null; }
  async getCommitCountBetween(fromHash: string, toRef?: string): Promise<number | null> { return null; }
  async isValidCommitHash(hash: string): Promise<boolean> { return false; }
  async getCommitAuthor(hash: string): Promise<string | null> { return null; }
  async getCommitHistory(limit?: number): Promise<Array<{ hash: string; message: string; date: string; files: Array<{ path: string; status: string; oldPath?: string }> }>> {
    return this.commits;
  }
  async tag(name: string, message?: string): Promise<void> {}
  async push(args?: string[]): Promise<void> {}
}

test('CodebaseContextInjector returns null with no context paths', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  const injector = new CodebaseContextInjector(fs as any, git as any);
  const result = await injector.execute('TASK-001', []);
  assert.equal(result, null);
});

test('CodebaseContextInjector returns null when no commits match context path', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  git.commits = [
    { hash: 'abc', message: 'fix', date: '2026-01-01', files: [{ path: 'other/file.ts', status: 'M' }] },
  ];
  const injector = new CodebaseContextInjector(fs as any, git as any);
  const result = await injector.execute('TASK-001', ['src/main/']);
  assert.equal(result, null);
});

test('CodebaseContextInjector surfaces recently changed files matching context path', async () => {
  const fs = new MockFileSystem();
  fs.files['src/main/foo.ts'] = 'export class Foo {}\nexport function bar() {}\n';
  fs.files['src/main/baz.ts'] = 'export interface Baz {}\nexport type Qux = string;\n';
  const git = new MockGitRepository();
  git.commits = [
    { hash: 'a', message: 'feat', date: '2026-01-01', files: [{ path: 'src/main/foo.ts', status: 'M' }, { path: 'src/main/baz.ts', status: 'A' }] },
    { hash: 'b', message: 'fix', date: '2026-01-02', files: [{ path: 'src/main/foo.ts', status: 'M' }] },
  ];
  const injector = new CodebaseContextInjector(fs as any, git as any);
  const result = await injector.execute('TASK-001', ['src/main/']);
  assert.ok(result !== null, 'should return a block');
  assert.ok(result.includes('[CODEBASE-CONTEXT]'), 'should contain CODEBASE-CONTEXT header');
  assert.ok(result.includes('src/main/foo.ts (2 commits)'), 'should show foo.ts with 2 commits');
  assert.ok(result.includes('exports: Foo, bar'), 'should extract exported symbols from foo.ts');
  assert.ok(result.includes('src/main/baz.ts (1 commits)'), 'should show baz.ts with 1 commit');
  assert.ok(result.includes('exports: Baz, Qux'), 'should extract exported symbols from baz.ts');
});

test('CodebaseContextInjector handles files that cannot be read gracefully', async () => {
  const fs = new MockFileSystem();
  // foo.ts exists, bar.ts does not
  fs.files['src/main/foo.ts'] = 'export class Foo {}\n';
  const git = new MockGitRepository();
  git.commits = [
    { hash: 'a', message: 'feat', date: '2026-01-01', files: [{ path: 'src/main/foo.ts', status: 'M' }, { path: 'src/main/bar.ts', status: 'M' }] },
  ];
  const injector = new CodebaseContextInjector(fs as any, git as any);
  const result = await injector.execute('TASK-001', ['src/main/']);
  assert.ok(result !== null, 'should return a block');
  assert.ok(result.includes('src/main/foo.ts'), 'should include readable file');
  assert.ok(result.includes('src/main/bar.ts'), 'should include unreadable file');
  assert.ok(result.includes('exports: Foo'), 'should include symbols from readable file');
});
