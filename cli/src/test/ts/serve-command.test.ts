import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { ServeCommand } from '../../main/ts/application/commands/serve-command.js';

test('ServeCommand exists and can be instantiated', () => {
  const command = new ServeCommand('.');
  assert.ok(command);
  assert.strictEqual(typeof command.execute, 'function');
});

test('parsePort returns 3000 when arg is partially numeric like "8abc"', () => {
  const cmd = new ServeCommand('.');
  const port = (cmd as any).parsePort(['8abc']);
  assert.strictEqual(port, 3000, 'Partially numeric arg must not be accepted as port');
});

test('parsePort returns 3000 when args is empty', () => {
  const cmd = new ServeCommand('.');
  const port = (cmd as any).parsePort([]);
  assert.strictEqual(port, 3000);
});

test('parsePort returns parsed number when arg is purely numeric', () => {
  const cmd = new ServeCommand('.');
  const port = (cmd as any).parsePort(['4242']);
  assert.strictEqual(port, 4242);
});

test('serve command handler strips query string before resolving file path', async () => {
  const cmd = new ServeCommand('/home/valentin/code/arch');
  const handler = (cmd as any).createHandler() as http.RequestListener;

  const status = await new Promise<number>((resolve) => {
    const req = { url: '/arch-viewer.html?tab=focus' } as http.IncomingMessage;
    const res = {
      statusCode: 200,
      end(_body?: any) { resolve(this.statusCode); },
      setHeader(_k: string, _v: string) {},
    } as unknown as http.ServerResponse;
    handler(req, res);
  });

  assert.strictEqual(status, 200, 'File with query string should be served (200), not 404');
});

test('serve command handler returns 500 not unhandled rejection when task file read throws', async () => {
  const cmd = new ServeCommand('/tmp/nonexistent-arch-test-dir');
  const handler = (cmd as any).createHandler() as http.RequestListener;

  // /api/tasks will fail because the tasks dir does not exist — handler must catch and 500
  const status = await new Promise<number>((resolve, reject) => {
    const req = { url: '/api/tasks' } as http.IncomingMessage;
    const res = {
      statusCode: 200,
      end(_body?: any) { resolve(this.statusCode); },
      setHeader(_k: string, _v: string) {},
    } as unknown as http.ServerResponse;

    // Attach unhandledRejection guard: if the bug is present, the promise rejects
    const onUnhandled = (reason: any) => {
      process.off('unhandledRejection', onUnhandled);
      reject(new Error(`Unhandled rejection: ${reason}`));
    };
    process.once('unhandledRejection', onUnhandled);
    handler(req, res);
  });

  assert.strictEqual(status, 500, 'API error must produce 500, not crash the process');
});
