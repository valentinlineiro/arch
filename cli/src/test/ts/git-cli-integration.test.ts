import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GitCli } from '../../main/ts/infrastructure/cli/git-cli.js';

// Skip if git is not available
let gitAvailable = true;
try {
  execSync('git --version', { stdio: 'ignore' });
} catch {
  gitAvailable = false;
}

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'arch-git-cli-test-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'ignore' });
  return dir;
}

function teardown(dir: string) {
  rmSync(dir, { recursive: true, force: true });
}

test('GitCli - getCurrentBranch returns a branch name', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    // Need at least one commit to have a branch name
    writeFileSync(join(dir, 'README.md'), 'hello');
    execSync('git add README.md && git commit -m "init"', { cwd: dir, stdio: 'ignore', shell: true });

    const git = new GitCli();
    const originalCwd = process.cwd();
    process.chdir(dir);
    try {
      const branch = await git.getCurrentBranch();
      assert.ok(typeof branch === 'string' && branch.length > 0, `Expected a branch name, got: ${branch}`);
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    teardown(dir);
  }
});

test('GitCli - getLastCommitHash returns a hash after a commit', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    writeFileSync(join(dir, 'file.txt'), 'content');
    execSync('git add file.txt && git commit -m "test commit"', { cwd: dir, stdio: 'ignore', shell: true });

    const git = new GitCli();
    const originalCwd = process.cwd();
    process.chdir(dir);
    try {
      const hash = await git.getLastCommitHash();
      assert.ok(hash !== null && hash.length > 0, `Expected a hash, got: ${hash}`);
      const fullHash = execSync('git rev-parse HEAD', { cwd: dir }).toString().trim();
      assert.ok(fullHash.startsWith(hash!), `Short hash ${hash} should be a prefix of full hash ${fullHash}`);
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    teardown(dir);
  }
});

test('GitCli - isValidCommitHash returns true for real hash, false for garbage', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    writeFileSync(join(dir, 'file.txt'), 'content');
    execSync('git add file.txt && git commit -m "test commit"', { cwd: dir, stdio: 'ignore', shell: true });

    const git = new GitCli();
    const originalCwd = process.cwd();
    process.chdir(dir);
    try {
      const hash = await git.getLastCommitHash();
      assert.ok(hash !== null);
      const fullHash = execSync('git rev-parse HEAD', { cwd: dir }).toString().trim();
      assert.strictEqual(await git.isValidCommitHash(fullHash), true);
      assert.strictEqual(await git.isValidCommitHash('deadbeefdeadbeefdeadbeefdeadbeef00000000'), false);
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    teardown(dir);
  }
});

test('GitCli - getCommitHistory returns structured file entries', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    writeFileSync(join(dir, 'alpha.txt'), 'a');
    execSync('git add alpha.txt && git commit -m "add alpha"', { cwd: dir, stdio: 'ignore', shell: true });
    writeFileSync(join(dir, 'beta.txt'), 'b');
    execSync('git add beta.txt && git commit -m "add beta"', { cwd: dir, stdio: 'ignore', shell: true });

    const git = new GitCli();
    const originalCwd = process.cwd();
    process.chdir(dir);
    try {
      const history = await git.getCommitHistory(10);
      assert.ok(history.length >= 2, `Expected at least 2 commits, got ${history.length}`);
      const latest = history[0];
      assert.ok(typeof latest.hash === 'string' && latest.hash.length > 0);
      assert.ok(typeof latest.date === 'string');
      assert.ok(Array.isArray(latest.files));
      assert.ok(latest.files.every(f => typeof f.path === 'string' && typeof f.status === 'string'));
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    teardown(dir);
  }
});
