import { test } from 'node:test';
import assert from 'node:assert';
import { CaptureCommand } from '../../main/ts/application/commands/capture-command.js';
import { MockFileSystem, MockGitRepository, MockTaskRepository } from './mocks/index.js';

function spyConsoleLog(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => { lines.push(args.join(' ')); };
  return { lines, restore: () => { console.log = orig; } };
}

test('CaptureCommand - displays verifiability score after capture', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ version: '0.6.0' });
  const git = new MockGitRepository();
  const repo = new MockTaskRepository();
  repo.nextId = 'TASK-900';
  const cmd = new CaptureCommand(repo, fs, '.', git);

  const spy = spyConsoleLog();
  try {
    await cmd.execute(['implement auth middleware', '--class', '2-code-generation', '--size', 'S']);
  } finally {
    spy.restore();
  }

  const hasVerifiabilityLine = spy.lines.some(l => l.includes('Verifiability'));
  assert.ok(hasVerifiabilityLine, 'CaptureCommand must display verifiability score after creation');
});

test('CaptureCommand - verifiability score is above threshold for code-generation skeleton', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ version: '0.6.0' });
  const git = new MockGitRepository();
  const repo = new MockTaskRepository();
  repo.nextId = 'TASK-901';
  const cmd = new CaptureCommand(repo, fs, '.', git);

  const spy = spyConsoleLog();
  try {
    await cmd.execute(['implement retry logic', '--class', '2-code-generation', '--size', 'S']);
  } finally {
    spy.restore();
  }

  const verLine = spy.lines.find(l => l.includes('Verifiability'));
  assert.ok(verLine, 'must display a verifiability line');
  assert.ok(!verLine!.includes('⚠'), '2-code-generation skeleton must not warn — all ACs should be machine-verifiable');
});
