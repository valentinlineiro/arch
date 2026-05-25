import { test } from 'node:test';
import assert from 'node:assert';
import { GovernSystem } from '../../main/ts/application/use-cases/govern-system.js';
import { parseLedger } from '../../main/ts/application/use-cases/focus-ledger.js';
import { DeterministicACVerifier } from '../../main/ts/domain/services/deterministic-ac-verifier.js';

const BASE_CONFIG = JSON.stringify({
  version: '1.2.0',
  governance: { conductEveryN: 99 },
});

class SpyFs {
  files: Record<string, string> = { 'arch.config.json': BASE_CONFIG };
  dirs: Record<string, string[]> = {};
  appended: Record<string, string> = {};

  addFile(p: string, c: string) { this.files[p] = c; }

  async readFile(p: string) {
    if (!(p in this.files)) throw new Error(`not found: ${p}`);
    return this.files[p];
  }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async appendFile(p: string, c: string) {
    this.appended[p] = (this.appended[p] ?? '') + c;
    this.files[p] = (this.files[p] ?? '') + c;
  }
  async exists(p: string) { return p in this.files || p in this.dirs; }
  async readDirectory(p: string) { return this.dirs[p] ?? []; }
  async rename() {}
  async deleteFile() {}
  async mkdir() {}
}

function makeGovern(fs: SpyFs) {
  const taskRepo = {
    getAll: async () => [],
    getActive: async () => [],
    findReady: async () => [],
    getById: async () => null,
    getNextId: async () => 'TASK-001',
    save: async () => {},
  } as any;
  const gitRepo = {
    getDiff: async () => '',
    getLastCommitMessage: async () => null,
    getCurrentBranch: async () => 'main',
    getStatusLines: async () => [],
    getCommitsSince: async () => [],
    getFileAtCommit: async () => null,
    getCommitHash: async () => 'abc123',
    getLog: async () => [],
  } as any;
  return new GovernSystem(taskRepo, gitRepo, fs as any);
}

// ── DeterministicACVerifier.verifySection ─────────────────────────────────

test('DeterministicACVerifier.verifySection returns pass for all-prose predicates', async () => {
  const verifier = new DeterministicACVerifier();
  const content = `- [x] goal achieved\n  - \`prose: confirmed\`\n`;
  const result = await verifier.verifySection(content);
  assert.strictEqual(result.pass, true);
  assert.strictEqual(result.evidence.length, 1);
});

test('DeterministicACVerifier.verifySection returns pass=false for unchecked AC with no predicate', async () => {
  const verifier = new DeterministicACVerifier();
  const content = `- [ ] something not done\n`;
  const result = await verifier.verifySection(content);
  assert.strictEqual(result.pass, false);
});

// ── GovernSystem PROJECT.md DoD gate ──────────────────────────────────────

test('govern: no-op when docs/PROJECT.md does not exist', async () => {
  const fs = new SpyFs();
  const gov = makeGovern(fs);
  const result = await gov.execute(true);
  assert.strictEqual(result.projectComplete, undefined);
});

test('govern: no-op when PROJECT.md has no ## Definition of Done section', async () => {
  const fs = new SpyFs();
  fs.addFile('docs/PROJECT.md', '# My Project\n\nJust a description.\n');
  const gov = makeGovern(fs);
  const result = await gov.execute(true);
  assert.strictEqual(result.projectComplete, undefined);
});

test('govern: projectComplete=false when DoD has unchecked item', async () => {
  const fs = new SpyFs();
  fs.addFile('docs/PROJECT.md', [
    '# Project',
    '',
    '## Definition of Done',
    '- [ ] not done yet',
    '  - `prose: manual check`',
  ].join('\n'));
  const gov = makeGovern(fs);
  const result = await gov.execute(true);
  assert.strictEqual(result.projectComplete, false);
});

test('govern: projectComplete=true when all DoD prose predicates pass', async () => {
  const fs = new SpyFs();
  fs.addFile('docs/PROJECT.md', [
    '# Project',
    '',
    '## Definition of Done',
    '- [x] all tasks archived',
    '  - `prose: verified manually`',
  ].join('\n'));
  const gov = makeGovern(fs);
  const result = await gov.execute(true);
  assert.strictEqual(result.projectComplete, true);
});

test('govern: appends PROJECT_COMPLETE to focus-ledger on completion', async () => {
  const fs = new SpyFs();
  fs.addFile('docs/PROJECT.md', [
    '# Project',
    '',
    '## Definition of Done',
    '- [x] done',
    '  - `prose: confirmed`',
  ].join('\n'));
  fs.addFile('.arch/focus-ledger.jsonl', '');
  const gov = makeGovern(fs);
  await gov.execute(true);

  const ledgerContent = fs.files['.arch/focus-ledger.jsonl'] ?? '';
  assert.ok(ledgerContent.includes('PROJECT_COMPLETE'), 'focus-ledger should contain PROJECT_COMPLETE entry');
});

test('govern: writes RETRO.md summary on PROJECT_COMPLETE', async () => {
  const fs = new SpyFs();
  fs.addFile('docs/PROJECT.md', [
    '# Project',
    '',
    '## Definition of Done',
    '- [x] done',
    '  - `prose: confirmed`',
  ].join('\n'));
  const gov = makeGovern(fs);
  await gov.execute(true);

  assert.ok('docs/RETRO.md' in fs.files, 'docs/RETRO.md should be written on PROJECT_COMPLETE');
  assert.ok(fs.files['docs/RETRO.md'].includes('PROJECT_COMPLETE'), 'RETRO.md should mention PROJECT_COMPLETE');
});

test('govern: does not re-emit PROJECT_COMPLETE if already in ledger', async () => {
  const fs = new SpyFs();
  fs.addFile('docs/PROJECT.md', [
    '# Project',
    '',
    '## Definition of Done',
    '- [x] done',
    '  - `prose: confirmed`',
  ].join('\n'));
  const existingEntry = JSON.stringify({ action: 'PROJECT_COMPLETE', taskId: 'PROJECT', tick: 1, timestamp: '2026-01-01T00:00:00Z' });
  fs.addFile('.arch/focus-ledger.jsonl', existingEntry + '\n');
  const gov = makeGovern(fs);
  await gov.execute(true);

  const ledgerContent = fs.files['.arch/focus-ledger.jsonl'] ?? '';
  const matches = ledgerContent.match(/PROJECT_COMPLETE/g) ?? [];
  assert.strictEqual(matches.length, 1, 'should not duplicate PROJECT_COMPLETE in ledger');
});
