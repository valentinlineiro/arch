import { test } from 'node:test';
import assert from 'node:assert';
import { ServeCommand } from '../../main/ts/application/commands/serve-command.js';

test('ServeCommand exists and can be instantiated', () => {
  const command = new ServeCommand('.');
  assert.ok(command);
  assert.strictEqual(typeof command.execute, 'function');
});
