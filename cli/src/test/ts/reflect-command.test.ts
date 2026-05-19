import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { ReflectCommand } from '../../main/ts/application/commands/reflect-command.js';
import { MockFileSystem } from './mocks/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Run fn(), intercepting ALL calls to process.exit so they throw instead of
 * killing the process.  Returns the first exit code seen (or undefined if fn
 * returned normally without calling process.exit).
 */
function captureExit(fn: () => Promise<void>): Promise<number | undefined> {
  return new Promise(async (resolve) => {
    const originalExit = process.exit as (code?: number) => never;
    let resolved = false;
    const stub = (code: number) => {
      if (!resolved) {
        resolved = true;
        resolve(code);
      }
      // Always throw so callers (including catch blocks) don't continue
      throw new Error('__process_exit__');
    };
    (process as any).exit = stub;
    try {
      await fn();
      if (!resolved) { resolved = true; resolve(undefined); }
    } catch (e: any) {
      // Swallow our sentinel; re-throw anything else
      if (e.message !== '__process_exit__' && !resolved) {
        resolved = true;
        resolve(undefined);
      }
    } finally {
      (process as any).exit = originalExit;
    }
  });
}

const FAKE_THINK_CONTENT = '# THINK protocol\nphase 1 content here';
const FAKE_CONFIG = JSON.stringify({
  version: '0.6.0',
  clis: [], // empty → no CLI spawned → falls through to console.log path
});

// ── Mode preamble injection tests ─────────────────────────────────────────────

test('reflect command injects DEFAULT mode preamble when no --deep flag', async () => {
  const writtenFiles: Record<string, string> = {};

  // Stub fs.readFileSync to return controlled content
  const originalReadFileSync = fs.readFileSync;
  (fs as any).readFileSync = (path: string, enc: string) => {
    if (String(path).endsWith('arch.config.json')) return FAKE_CONFIG;
    if (String(path).endsWith('THINK.md')) return FAKE_THINK_CONTENT;
    return originalReadFileSync(path, enc as any);
  };

  // Capture fs.writeFileSync calls to inspect the tmp prompt file
  const originalWriteFileSync = fs.writeFileSync;
  (fs as any).writeFileSync = (path: string, content: string) => {
    writtenFiles[String(path)] = content;
  };

  // Stub unlinkSync to avoid errors on cleanup
  const originalUnlinkSync = fs.unlinkSync;
  (fs as any).unlinkSync = (_path: string) => {};

  try {
    const mockFs = new MockFileSystem();
    const cmd = new ReflectCommand(mockFs, '.');
    // No '--deep' flag → default mode
    await captureExit(() => cmd.execute([]));
  } finally {
    (fs as any).readFileSync = originalReadFileSync;
    (fs as any).writeFileSync = originalWriteFileSync;
    (fs as any).unlinkSync = originalUnlinkSync;
  }

  // Find the tmp prompt file written (path contains .think-prompt-)
  const tmpKey = Object.keys(writtenFiles).find(k => k.includes('.think-prompt-'));
  assert.ok(tmpKey !== undefined, 'Expected a tmp prompt file to be written');

  const writtenContent = writtenFiles[tmpKey!];
  assert.ok(
    writtenContent.startsWith('<!-- MODE: DEFAULT -->\n'),
    `Expected content to start with <!-- MODE: DEFAULT -->\\n but got: ${writtenContent.slice(0, 60)}`
  );
  assert.ok(
    writtenContent.includes(FAKE_THINK_CONTENT),
    'Expected THINK.md content to follow the preamble'
  );
});

test('reflect hansei Tier 2 output is labelled ADVISORY and states it is not a governance gate', async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: any[]) => logs.push(args.join(' '));

  const originalReadFileSync = fs.readFileSync;
  const originalReaddirSync = fs.readdirSync;

  const fakeTaskContent = `## TASK-999\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude |\n\n| REVIEW |\n`;

  (fs as any).readFileSync = (path: string, enc: string) => {
    if (String(path).endsWith('arch.config.json')) return JSON.stringify({ clis: [] });
    if (String(path).includes('TASK-999')) return fakeTaskContent;
    return originalReadFileSync(path, enc as any);
  };
  (fs as any).readdirSync = (path: string) => {
    if (String(path).includes('docs/tasks')) return ['TASK-999.md'];
    return (originalReaddirSync as any)(path);
  };

  try {
    const mockFs = new MockFileSystem();
    const mockRepo = { getById: async () => null };
    const cmd = new ReflectCommand(mockFs, '.', mockRepo);
    await cmd.execute(['hansei']);
  } finally {
    console.log = originalLog;
    (fs as any).readFileSync = originalReadFileSync;
    (fs as any).readdirSync = originalReaddirSync;
  }

  const allOutput = logs.join('\n');
  assert.ok(
    allOutput.includes('Tier 2'),
    'Expected Tier 2 section to be reached'
  );
  assert.ok(
    allOutput.includes('ADVISORY'),
    `Expected Tier 2 output to include "ADVISORY" but got:\n${allOutput}`
  );
  assert.ok(
    allOutput.toLowerCase().includes('not a governance gate'),
    `Expected output to state "not a governance gate" but got:\n${allOutput}`
  );
});

test('reflect command injects DEEP mode preamble when --deep flag present', async () => {
  const writtenFiles: Record<string, string> = {};

  const originalReadFileSync = fs.readFileSync;
  (fs as any).readFileSync = (path: string, enc: string) => {
    if (String(path).endsWith('arch.config.json')) return FAKE_CONFIG;
    if (String(path).endsWith('THINK.md')) return FAKE_THINK_CONTENT;
    // focus-ledger.jsonl read in updateDeepState → return empty
    if (String(path).includes('focus-ledger')) return '';
    return originalReadFileSync(path, enc as any);
  };

  const originalWriteFileSync = fs.writeFileSync;
  (fs as any).writeFileSync = (path: string, content: string) => {
    writtenFiles[String(path)] = content;
  };

  const originalUnlinkSync = fs.unlinkSync;
  (fs as any).unlinkSync = (_path: string) => {};

  try {
    const mockFs = new MockFileSystem();
    const cmd = new ReflectCommand(mockFs, '.');
    // '--deep' flag present → deep mode
    await captureExit(() => cmd.execute(['--deep']));
  } finally {
    (fs as any).readFileSync = originalReadFileSync;
    (fs as any).writeFileSync = originalWriteFileSync;
    (fs as any).unlinkSync = originalUnlinkSync;
  }

  const tmpKey = Object.keys(writtenFiles).find(k => k.includes('.think-prompt-'));
  assert.ok(tmpKey !== undefined, 'Expected a tmp prompt file to be written');

  const writtenContent = writtenFiles[tmpKey!];
  assert.ok(
    writtenContent.startsWith('<!-- MODE: DEEP -->\n'),
    `Expected content to start with <!-- MODE: DEEP -->\\n but got: ${writtenContent.slice(0, 60)}`
  );
  assert.ok(
    writtenContent.includes(FAKE_THINK_CONTENT),
    'Expected THINK.md content to follow the preamble'
  );
});
