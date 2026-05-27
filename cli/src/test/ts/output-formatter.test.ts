import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// AC3 for TASK-1034: output formatter is mockable — commands capture output via fmt.log override
describe('output-formatter', () => {
  it('fmt.log routes through console.log — mockable in tests', async () => {
    const captured: string[] = [];
    const orig = console.log;
    console.log = (msg?: string) => { captured.push(msg ?? ''); };
    try {
      const fmt = await import('../../main/ts/infrastructure/cli/output-formatter.js');
      fmt.log('test message');
      assert.ok(captured.some(m => m === 'test message'), 'fmt.log should route through console.log');
    } finally {
      console.log = orig;
    }
  });

  it('fmt.error routes through console.error — mockable in tests', async () => {
    const captured: string[] = [];
    const orig = console.error;
    console.error = (msg: string) => { captured.push(msg); };
    try {
      const fmt = await import('../../main/ts/infrastructure/cli/output-formatter.js');
      fmt.error('error message');
      assert.ok(captured.some(m => m === 'error message'), 'fmt.error should route through console.error');
    } finally {
      console.error = orig;
    }
  });
});
