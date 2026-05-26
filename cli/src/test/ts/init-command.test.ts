import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { InitCommand } from '../../main/ts/application/commands/init-command.js';

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'arch-init-test-'));
}

async function cleanup(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

test('arch init --dry-run exits without creating any files', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--dry-run']);

    const entries = await fs.readdir(dir);
    assert.deepStrictEqual(entries, [], '--dry-run must not create any files');
  } finally {
    await cleanup(dir);
  }
});

test('arch init creates arch.config.json', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--minimal']);

    const configPath = path.join(dir, 'arch.config.json');
    const stat = await fs.stat(configPath).catch(() => null);
    assert.ok(stat, 'arch.config.json should exist after arch init');
  } finally {
    await cleanup(dir);
  }
});

test('arch init creates docs/tasks/ directory', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--minimal']);

    const stat = await fs.stat(path.join(dir, 'docs/tasks')).catch(() => null);
    assert.ok(stat?.isDirectory(), 'docs/tasks/ should be a directory');
  } finally {
    await cleanup(dir);
  }
});

test('arch init creates docs/INBOX.md', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--minimal']);

    const stat = await fs.stat(path.join(dir, 'docs/INBOX.md')).catch(() => null);
    assert.ok(stat, 'docs/INBOX.md should exist');
  } finally {
    await cleanup(dir);
  }
});

test('arch init seed task is titled "Complete your first governed task"', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--minimal']);

    const content = await fs.readFile(path.join(dir, 'docs/tasks/TASK-001.md'), 'utf-8');
    assert.ok(
      content.includes('Complete your first governed task'),
      `Seed task must be titled "Complete your first governed task", got: ${content.slice(0, 100)}`
    );
  } finally {
    await cleanup(dir);
  }
});

test('arch init seed task walks through arch task start workflow', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--minimal']);

    const content = await fs.readFile(path.join(dir, 'docs/tasks/TASK-001.md'), 'utf-8');
    assert.ok(content.includes('arch task start'), 'seed task should mention arch task start');
    assert.ok(content.includes('arch check'), 'seed task should mention arch check');
    assert.ok(content.includes('arch task done'), 'seed task should mention arch task done');
  } finally {
    await cleanup(dir);
  }
});

test('arch init is idempotent: running twice does not overwrite existing files', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir);
    await cmd.execute(['--minimal']);

    const configBefore = await fs.readFile(path.join(dir, 'arch.config.json'), 'utf-8');
    await fs.writeFile(path.join(dir, 'arch.config.json'), configBefore + '\n// modified', 'utf-8');

    await cmd.execute(['--minimal']);

    const configAfter = await fs.readFile(path.join(dir, 'arch.config.json'), 'utf-8');
    assert.ok(configAfter.includes('// modified'), 'second run must not overwrite existing arch.config.json');
  } finally {
    await cleanup(dir);
  }
});
