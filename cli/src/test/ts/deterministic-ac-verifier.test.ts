import path from 'node:path';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicACVerifier } from '../../main/ts/domain/services/deterministic-ac-verifier.js';
import type { Task } from '../../main/ts/domain/models/task.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

function makeTask(content: string): Task {
  return {
    id: 'TASK-TEST',
    title: 'Test task',
    status: TaskStatus.REVIEW,
    priority: 'P2',
    size: 'S',
    class: '7-operations',
    cli: 'local',
    context: [],
    focus: false,
    depends: [],
    content,
    rawMetaLine: '**Meta:** P2 | S | REVIEW | Focus:no | 7-operations | local | none',
    sprint: '',
  } as unknown as Task;
}

const repoRoot = existsSync('package.json') && !existsSync('../package.json') 
  ? path.resolve('..') 
  : path.resolve('.');

const verifier = new DeterministicACVerifier(repoRoot);

test('DeterministicACVerifier — all-pass: cmd exit 0 and file exists', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] echo succeeds
  - \`cmd: echo ok; exit: 0\`
- [ ] package.json exists
  - \`file: cli/package.json\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence.length, 2);
  assert.equal(result.evidence[0].type, 'cmd');
  assert.equal(result.evidence[0].pass, true);
  assert.equal(result.evidence[1].type, 'file');
  assert.equal(result.evidence[1].pass, true);
});

test('DeterministicACVerifier — cmd-fail: non-zero exit', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] false command fails
  - \`cmd: exit 1; exit: 0\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, false);
  assert.equal(result.evidence[0].type, 'cmd');
  assert.equal(result.evidence[0].pass, false);
});

test('DeterministicACVerifier — file-missing: non-existent path', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] ghost file
  - \`file: docs/does-not-exist-at-all.md\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, false);
  assert.equal(result.evidence[0].type, 'file');
  assert.equal(result.evidence[0].pass, false);
  assert.ok(result.evidence[0].detail.includes('missing'));
});

test('DeterministicACVerifier — prose-only: always passes, non-automated', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] human verifies output looks good
  - \`prose: verified by running the command\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence[0].type, 'prose');
  assert.equal(result.evidence[0].pass, true);
  assert.ok(result.evidence[0].detail.includes('non-automated'));
});

test('DeterministicACVerifier — code-only: always passes, reader-verified', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] service exported correctly
  - \`code: verified by reading the file\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence[0].type, 'code');
  assert.equal(result.evidence[0].pass, true);
});

test('DeterministicACVerifier — mixed: cmd-fail makes overall fail', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] prose ok
  - \`prose: human verified\`
- [ ] cmd fails
  - \`cmd: exit 99; exit: 0\`
- [ ] file exists
  - \`file: cli/package.json\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, false);
  assert.equal(result.evidence.find(e => e.type === 'prose')?.pass, true);
  assert.equal(result.evidence.find(e => e.type === 'cmd')?.pass, false);
  assert.equal(result.evidence.find(e => e.type === 'file')?.pass, true);
});

test('DeterministicACVerifier — no AC section: returns pass with empty evidence', async () => {
  const task = makeTask(`## TASK-TEST: Test\nNo AC section here.\n`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence.length, 0);
});

test('DeterministicACVerifier — no predicate declared: treated as prose, passes', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] some undeclared AC with no predicate
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence[0].type, 'unknown');
  assert.equal(result.evidence[0].pass, true);
});

// ── file-contains: predicate ──────────────────────────────────────────────

test('DeterministicACVerifier — file-contains: passes when file has pattern', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] package.json contains "name"
  - \`file-contains: cli/package.json "name"\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence[0].type, 'file-contains');
  assert.equal(result.evidence[0].pass, true);
});

test('DeterministicACVerifier — file-contains: fails when file lacks pattern', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] package.json contains impossible string
  - \`file-contains: cli/package.json "IMPOSSIBLE_STRING_XYZ_NEVER_EXISTS"\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, false);
  assert.equal(result.evidence[0].type, 'file-contains');
  assert.equal(result.evidence[0].pass, false);
  assert.ok(result.evidence[0].detail.includes('not found'));
});

test('DeterministicACVerifier — file-contains: fails when file does not exist', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] missing file
  - \`file-contains: docs/does-not-exist.md "anything"\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, false);
  assert.equal(result.evidence[0].type, 'file-contains');
  assert.equal(result.evidence[0].pass, false);
});

// ── not-file: predicate ───────────────────────────────────────────────────

test('DeterministicACVerifier — not-file: passes when file does not exist', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] ghost file must not exist
  - \`not-file: docs/this-file-definitely-does-not-exist-at-all.md\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, true);
  assert.equal(result.evidence[0].type, 'not-file');
  assert.equal(result.evidence[0].pass, true);
});

test('DeterministicACVerifier — not-file: fails when file exists', async () => {
  const task = makeTask(`## TASK-TEST: Test
### Acceptance Criteria
- [ ] package.json must not exist (should fail)
  - \`not-file: cli/package.json\`
`);
  const result = await verifier.verify(task);
  assert.equal(result.pass, false);
  assert.equal(result.evidence[0].type, 'not-file');
  assert.equal(result.evidence[0].pass, false);
  assert.ok(result.evidence[0].detail.includes('exists'));
});

// ── aggregateHanseiSignals tests ────────────────────────────────────────────

import { aggregateHanseiSignals, WEAK_SIGNAL_THRESHOLD } from '../../main/ts/domain/services/signal-router.js';

test('aggregateHanseiSignals — 4 signals same category returns isWeakSignal:true with 4 taskIds', async () => {
  const mockLog = {
    all: async () => [
      { event: 'hansei_signal:TASK-001:H2', candidate_from: 'TASK-001', candidate_to: 'friction:[SpecDrift]', domain: 'epistemological', signal_type: 'create', candidate_relation: 'causes', confidence: 0.6 },
      { event: 'hansei_signal:TASK-002:H2', candidate_from: 'TASK-002', candidate_to: 'friction:[SpecDrift]', domain: 'epistemological', signal_type: 'create', candidate_relation: 'causes', confidence: 0.6 },
      { event: 'hansei_signal:TASK-003:H2', candidate_from: 'TASK-003', candidate_to: 'friction:[SpecDrift]', domain: 'epistemological', signal_type: 'create', candidate_relation: 'causes', confidence: 0.6 },
      { event: 'hansei_signal:TASK-004:H2', candidate_from: 'TASK-004', candidate_to: 'friction:[SpecDrift]', domain: 'epistemological', signal_type: 'create', candidate_relation: 'causes', confidence: 0.6 },
    ],
  };

  const result = await aggregateHanseiSignals(mockLog as any);
  assert.equal(result.length, 1);
  assert.equal(result[0].isWeakSignal, true);
  assert.equal(result[0].count, 4);
  assert.equal(result[0].taskIds.length, 4);
  assert.ok(result[0].taskIds.includes('TASK-001'));
  assert.ok(result[0].taskIds.includes('TASK-004'));
  assert.ok(result[0].count >= WEAK_SIGNAL_THRESHOLD);
});

test('aggregateHanseiSignals — 2 signals same category returns isWeakSignal:false', async () => {
  const mockLog = {
    all: async () => [
      { event: 'hansei_signal:TASK-001:H2', candidate_from: 'TASK-001', candidate_to: 'friction:[AuditGap]', domain: 'epistemological', signal_type: 'create', candidate_relation: 'causes', confidence: 0.6 },
      { event: 'hansei_signal:TASK-002:H2', candidate_from: 'TASK-002', candidate_to: 'friction:[AuditGap]', domain: 'epistemological', signal_type: 'create', candidate_relation: 'causes', confidence: 0.6 },
    ],
  };

  const result = await aggregateHanseiSignals(mockLog as any);
  assert.equal(result.length, 1);
  assert.equal(result[0].isWeakSignal, false);
  assert.equal(result[0].count, 2);
  assert.equal(result[0].taskIds.length, 2);
});
