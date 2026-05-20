import { test } from 'node:test';
import assert from 'node:assert';
import { CompileCommand } from '../../main/ts/application/commands/compile-command.js';
import { MockFileSystem } from './mocks/index.js';

test('CompileCommand exists and executes successfully on clean input', async () => {
  const fs = new MockFileSystem();
  const inputPath = 'telemetry.json';
  const cleanTelemetry = [
    {
      origin: 'fs',
      type: 'write',
      payload: {
        filePath: 'src/main/ts/index.ts',
        commitHash: 'abc12345',
        author: 'Alice',
        actionKind: 'refine_core',
        componentsCount: 2
      }
    }
  ];

  await fs.writeFile(inputPath, JSON.stringify(cleanTelemetry));
  const command = new CompileCommand(fs);

  // We capture console logs to verify execution output
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (s) => logs.push(s);

  try {
    await command.execute([inputPath, '--seed', 'test-seed-xyz']);
  } finally {
    console.log = originalLog;
  }

  assert.ok(logs.some(l => l.includes('Initiating stream transformation pipeline')));
  assert.ok(logs.some(l => l.includes('Execution Seed: "test-seed-xyz"')));
  assert.ok(logs.some(l => l.includes('Phase 1: Syntactic normalizer completed')));
  assert.ok(logs.some(l => l.includes('Phase 2: Transient Windowing Engine produced')));
  assert.ok(logs.some(l => l.includes('Phase 3: Actuation Projector compiled')));
  assert.ok(logs.some(l => l.includes('OBSERVATIONAL TELEMETRY DIGEST')));
  assert.ok(logs.some(l => l.includes('ACTIVE OPERATIONAL ALERTS')));
});

test('CompileCommand fails gracefully on malformed JSON payload', async () => {
  const fs = new MockFileSystem();
  const inputPath = 'malformed.json';
  await fs.writeFile(inputPath, 'invalid-json-{');
  
  const command = new CompileCommand(fs);

  const errors: string[] = [];
  const originalError = console.error;
  console.error = (s) => errors.push(s);

  const exits: number[] = [];
  const originalExit = process.exit;
  process.exit = ((code: number) => { exits.push(code); }) as any;

  try {
    await command.execute([inputPath]);
  } finally {
    console.error = originalError;
    process.exit = originalExit;
  }

  assert.ok(errors.some(e => e.includes('Compilation pipeline collapsed')));
  assert.strictEqual(exits[0], 1);
});
