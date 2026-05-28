import { test } from 'node:test';
import assert from 'node:assert';
import { CaptureCommand } from '../../../main/ts/application/commands/capture-command.js';

class StubCaptureIntent {
  lastRaw: string | null = null;
  async execute(raw: string): Promise<string> {
    this.lastRaw = raw;
    return 'INTENT-001';
  }
}

async function makeCommand(opts: {
  args?: string[];
  stdin?: string;
  isTTY?: boolean;
}): Promise<{ out: string[]; err: string[]; exit: number | null; mock: MockCaptureIntent }> {
  const mock = new StubCaptureIntent();
  const out: string[] = [];
  const err: string[] = [];
  let exitCode: number | null = null;

  const cmd = new CaptureCommand(mock as any, {
    getArgs: () => opts.args ?? [],
    readStdin: async () => opts.stdin ?? '',
    isStdinTTY: () => opts.isTTY ?? true,
    log: (s: string) => { out.push(s); },
    error: (s: string) => { err.push(s); },
    exit: (code: number) => { exitCode = code; throw new Error(`exit:${code}`); },
  });

  try {
    await cmd.execute();
  } catch (e: any) {
    if (!e.message?.startsWith('exit:')) throw e;
  }
  return { out, err, exit: exitCode, mock };
}

test('CaptureCommand - argv arg is used when provided', async () => {
  const { mock, out } = await makeCommand({ args: ['fix', 'login', 'flow'] });
  assert.strictEqual(mock.lastRaw, 'fix login flow');
  assert.ok(out[0].includes('INTENT-001'));
});

test('CaptureCommand - stdin is used when argv is empty and stdin is piped', async () => {
  const { mock } = await makeCommand({ args: [], stdin: '  fix login flow  ', isTTY: false });
  assert.strictEqual(mock.lastRaw, 'fix login flow');
});

test('CaptureCommand - argv wins over stdin when both provided', async () => {
  const { mock } = await makeCommand({ args: ['from-argv'], stdin: 'from-stdin', isTTY: false });
  assert.strictEqual(mock.lastRaw, 'from-argv');
});

test('CaptureCommand - multiline stdin is accepted', async () => {
  const { mock } = await makeCommand({ args: [], stdin: 'line one\nline two\nline three', isTTY: false });
  assert.ok(mock.lastRaw!.includes('line one'));
});

test('CaptureCommand - empty stdin after trim is a hard error', async () => {
  const { exit, err } = await makeCommand({ args: [], stdin: '   \n  ', isTTY: false });
  assert.strictEqual(exit, 1);
  assert.ok(err.some(e => e.includes('capture text required')));
});

test('CaptureCommand - no argv and TTY stdin is a hard error', async () => {
  const { exit, err } = await makeCommand({ args: [], stdin: '', isTTY: true });
  assert.strictEqual(exit, 1);
  assert.ok(err.some(e => e.includes('capture text required')));
});
