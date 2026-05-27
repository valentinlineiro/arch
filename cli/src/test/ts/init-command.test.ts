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
    assert.ok(content.includes('arch review'), 'seed task should mention arch review');
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

test('arch init sets currentSprint to a non-empty sprint name in arch.config.json', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir, '1.2.0');
    await cmd.execute(['--minimal']);

    const raw = await fs.readFile(path.join(dir, 'arch.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    assert.ok(typeof config.currentSprint === 'string' && config.currentSprint.length > 0,
      `currentSprint must be non-empty, got: ${JSON.stringify(config.currentSprint)}`);
    assert.ok(config.currentSprint.startsWith('sprint/'),
      `currentSprint must start with 'sprint/', got: ${config.currentSprint}`);
  } finally {
    await cleanup(dir);
  }
});

test('arch init writes arch.config.json with sprintCloseAfterN and sprintAutoNamePrefix', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir, '1.2.0');
    await cmd.execute(['--minimal']);

    const raw = await fs.readFile(path.join(dir, 'arch.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    assert.ok(typeof config.sprintCloseAfterN === 'number',
      `sprintCloseAfterN must be a number, got: ${JSON.stringify(config.sprintCloseAfterN)}`);
    assert.ok(typeof config.sprintAutoNamePrefix === 'string' && config.sprintAutoNamePrefix.length > 0,
      `sprintAutoNamePrefix must be a non-empty string, got: ${JSON.stringify(config.sprintAutoNamePrefix)}`);
  } finally {
    await cleanup(dir);
  }
});

test('arch init seeds .arch/sprint-state.json with ACTIVE status', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir, '1.2.0');
    await cmd.execute(['--minimal']);

    const statePath = path.join(dir, '.arch', 'sprint-state.json');
    const raw = await fs.readFile(statePath, 'utf-8').catch(() => null);
    assert.ok(raw !== null, '.arch/sprint-state.json must exist after arch init');
    const state = JSON.parse(raw!);
    assert.strictEqual(state.status, 'ACTIVE', `sprint status must be ACTIVE, got: ${state.status}`);
    assert.ok(typeof state.name === 'string' && state.name.length > 0,
      `sprint name must be non-empty, got: ${JSON.stringify(state.name)}`);
  } finally {
    await cleanup(dir);
  }
});

test('arch init sprint seeding is idempotent: second run does not reset sprint-state.json', async () => {
  const dir = await makeTmpDir();
  try {
    const cmd = new InitCommand(dir, '1.2.0');
    await cmd.execute(['--minimal']);

    // Simulate external modification of sprint-state.json
    const statePath = path.join(dir, '.arch', 'sprint-state.json');
    const first = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    const modified = { ...first, status: 'CLOSED', closedAt: '2026-05-27T10:00:00.000Z' };
    await fs.writeFile(statePath, JSON.stringify(modified), 'utf-8');

    await cmd.execute(['--minimal', '--force']);

    const after = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    assert.strictEqual(after.status, 'CLOSED', 'second run must not overwrite existing sprint-state.json');
  } finally {
    await cleanup(dir);
  }
});
