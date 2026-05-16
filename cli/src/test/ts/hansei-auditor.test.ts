import { test } from 'node:test';
import assert from 'node:assert';
import { HanseiAuditor } from '../../main/ts/domain/services/hansei-auditor.js';
import { MockFileSystem } from './mocks/index.js';

// ── helpers ────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<{
  id: string;
  severity: string;
  category: string;
  decision: string;
  constraint: string;
  cost: string;
  forwardAction: string;
}> = {}) {
  return {
    id: overrides.id ?? 'TASK-TEST',
    title: 'Test task',
    priority: 'P2',
    size: 'S',
    status: 'REVIEW' as any,
    focus: false,
    sprint: '',
    class: '1-code-reasoning',
    cli: 'claude-code',
    context: [],
    acceptanceCriteria: [],
    hansei: {
      severity: (overrides.severity ?? 'H0') as any,
      category: overrides.category ?? '[no-issue]',
      decision: overrides.decision ?? 'Straightforward implementation.',
      constraint: overrides.constraint ?? 'None.',
      cost: overrides.cost ?? 'None.',
      forwardAction: overrides.forwardAction ?? 'None required.',
    },
  };
}

// ── CONCEALMENT tests ──────────────────────────────────────────────────────

test('HanseiAuditor — PASS when no debt patterns found and H0 declared', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/feature.ts'] = `
export function greet(name: string): string {
  return 'Hello ' + name;
}
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const result = await auditor.audit(makeTask(), ['src/feature.ts']);

  assert.strictEqual(result.verdict, 'PASS');
  assert.strictEqual(result.details.length, 0);
});

test('HanseiAuditor — CONCEALMENT when any cast present and H0 declared', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/parser.ts'] = `
export function parse(data: any): string {
  return (data as any).value;
}
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const result = await auditor.audit(makeTask({ severity: 'H0' }), ['src/parser.ts']);

  assert.strictEqual(result.verdict, 'CONCEALMENT');
  assert.strictEqual(result.severity, 'H3a');
  assert.strictEqual(result.category, '[AuditGap]');
  assert.ok(result.details.some(d => d.includes('CONCEALMENT')));
  assert.ok(result.details.some(d => d.includes('any')));
});

test('HanseiAuditor — CONCEALMENT when @ts-ignore present and H0 declared', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/legacy.ts'] = `
// @ts-ignore
const value = legacyFunction();
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const result = await auditor.audit(makeTask({ severity: 'H0' }), ['src/legacy.ts']);

  assert.strictEqual(result.verdict, 'CONCEALMENT');
  assert.ok(result.details.some(d => d.includes('@ts-ignore')));
});

test('HanseiAuditor — CONCEALMENT when hack comment present and H0 declared', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/util.ts'] = `
// HACK: temporary workaround for auth issue
function getToken() {
  return 'hardcoded';
}
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const result = await auditor.audit(makeTask({ severity: 'H0' }), ['src/util.ts']);

  assert.strictEqual(result.verdict, 'CONCEALMENT');
  assert.ok(result.details.some(d => d.includes('hack/fixme')));
});

test('HanseiAuditor — PASS when any cast present and declared in Hansei', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/parser.ts'] = `
export function parse(data: any): string {
  return (data as any).value;
}
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const task = makeTask({
    severity: 'H1',
    category: '[TypeHack]',
    decision: 'Used any cast as a workaround for missing type definitions.',
    constraint: 'Third-party library has no TypeScript types.',
  });
  const result = await auditor.audit(task, ['src/parser.ts']);

  assert.strictEqual(result.verdict, 'PASS');
});

// ── INFLATION tests ────────────────────────────────────────────────────────

test('HanseiAuditor — INFLATION when H2 declared for single clean file', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/config.ts'] = `
export const PORT = 3000;
export const HOST = 'localhost';
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const task = makeTask({
    severity: 'H2',
    category: '[LeakyAbstraction]',
    decision: 'Minor config change required updating the default port.',
    constraint: 'None.',
    cost: 'None.',
  });
  const result = await auditor.audit(task, ['src/config.ts']);

  assert.strictEqual(result.verdict, 'INFLATION');
  assert.strictEqual(result.severity, 'H1');
  assert.strictEqual(result.category, '[ProcessViolation]');
});

test('HanseiAuditor — PASS for H2 with actual debt pattern present', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/core.ts'] = `
// FIXME: this needs refactoring
export function processData(input: any) {
  return input;
}
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const task = makeTask({
    severity: 'H2',
    category: '[DeferredTest]',
    decision: 'Had to use any cast and leave a fixme comment for follow-up refactoring.',
    constraint: 'Deadline constraint.',
    forwardAction: 'Create IDEA-refactor-core for next sprint.',
  });
  const result = await auditor.audit(task, ['src/core.ts']);

  // Has debt AND declares it — should not be inflation
  assert.notStrictEqual(result.verdict, 'INFLATION');
});

// ── DoD integration tests ──────────────────────────────────────────────────

test('HanseiAuditor.extractChangedFiles — extracts file: predicates from task content', () => {
  const content = `
### Acceptance Criteria
- [ ] Implement feature
  - \`file: src/feature.ts\`
- [ ] Add tests
  - \`file: src/feature.test.ts\`

## Hansei
`;

  const files = HanseiAuditor.extractChangedFiles(content);
  assert.ok(files.includes('src/feature.ts'));
  assert.ok(files.includes('src/feature.test.ts'));
});

test('HanseiAuditor — ignores test files for debt pattern detection', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/src/feature.test.ts'] = `
test('edge case', () => {
  const data: any = {};
  assert.ok(data);
});
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const result = await auditor.audit(makeTask({ severity: 'H0' }), ['src/feature.test.ts']);

  // Test files are excluded — should PASS
  assert.strictEqual(result.verdict, 'PASS');
});

test('HanseiAuditor — ignores console.log in CLI command files', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/cli/src/main/ts/application/commands/report-command.ts'] = `
export class ReportCommand {
  execute() {
    console.log('Report generated');
  }
}
`;

  const auditor = new HanseiAuditor(fs, '/repo');
  const result = await auditor.audit(makeTask({ severity: 'H0' }), ['cli/src/main/ts/application/commands/report-command.ts']);

  // CLI command files exempt from console.log check
  assert.strictEqual(result.verdict, 'PASS');
});
