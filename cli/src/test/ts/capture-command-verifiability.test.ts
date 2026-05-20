import { test } from 'node:test';
import assert from 'node:assert';
import { CaptureCommand } from '../../main/ts/application/commands/capture-command.js';
import { MockFileSystem, MockGitRepository } from './mocks/index.js';

function makeRepo(nextId = 'TASK-900') {
  const tasks: any[] = [];
  return {
    getNextId: async () => nextId,
    getById: async (id: string) => tasks.find(t => t.id === id) ?? null,
    getAll: async () => tasks,
    getActive: async () => [],
    findReady: async () => [],
    save: async (t: any) => { tasks.push(t); },
  } as any;
}

function spyConsoleLog(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => { lines.push(args.join(' ')); };
  return { lines, restore: () => { console.log = orig; } };
}

function mockProcessExit(): { restore: () => void } {
  const orig = process.exit;
  process.exit = (() => { throw new Error('process.exit'); }) as any;
  return { restore: () => { process.exit = orig; } };
}

test('CaptureCommand - displays verifiability score after capture', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ version: '0.6.0' });
  const git = new MockGitRepository();
  const repo = makeRepo();
  const cmd = new CaptureCommand(repo, fs, '.', git);

  const spy = spyConsoleLog();
  const exitMock = mockProcessExit();
  try {
    await cmd.execute(['implement auth middleware', '--class', '2-code-generation', '--size', 'S']);
  } catch { /* process.exit throws */ } finally {
    spy.restore();
    exitMock.restore();
  }

  const hasVerifiabilityLine = spy.lines.some(l => l.includes('Verifiability'));
  assert.ok(hasVerifiabilityLine, 'CaptureCommand must display verifiability score after creation');
});

test('CaptureCommand - verifiability score is above threshold for code-generation skeleton', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ version: '0.6.0' });
  const git = new MockGitRepository();
  const repo = makeRepo();
  const cmd = new CaptureCommand(repo, fs, '.', git);

  const spy = spyConsoleLog();
  const exitMock = mockProcessExit();
  try {
    await cmd.execute(['implement retry logic', '--class', '2-code-generation', '--size', 'S']);
  } catch { /* process.exit throws */ } finally {
    spy.restore();
    exitMock.restore();
  }

  const verLine = spy.lines.find(l => l.includes('Verifiability'));
  assert.ok(verLine, 'must display a verifiability line');
  assert.ok(!verLine!.includes('⚠'), '2-code-generation skeleton must not warn — all ACs should be machine-verifiable');
});
