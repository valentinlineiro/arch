import { test } from 'node:test';
import assert from 'node:assert';
import { FinalizePromotion } from '../../main/ts/application/use-cases/finalize-promotion.js';

class MockFS {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  deleted: string[] = [];
  renames: Array<[string, string]> = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename(o: string, n: string) {
    this.renames.push([o, n]);
    this.files[n] = this.files[o];
    delete this.files[o];
  }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async deleteFile(p: string) { this.deleted.push(p); delete this.files[p]; }
}

const SCAFFOLD_CONTENT = `## TASK-212: fix oauth callback session loss

**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Source:** INTENT-001
**Depends:** none

### Generation

enrichment_phase: scaffolded
scaffolded_by: arch-cli
scaffolded_at: 2026-05-11T10:00:00Z
enriched_by: ~

### Objective

_Awaiting agent enrichment_

### Acceptance Criteria

_Awaiting agent enrichment_

### Complexity

_Awaiting agent enrichment_

### Confidence

_Awaiting agent enrichment_

### Relevant Context

_confidence: ~_

_Pending ContextInference_

### Risks

_Awaiting agent enrichment_
`;

const INTENT_CONTENT = `---
id: INTENT-001
schema_version: 1
status: CAPTURED
created_at: 2026-05-11T10:00:00Z
updated_at: 2026-05-11T10:00:00Z

origin:
  source: cli
  branch: main
  cwd: cli/src
  triggered_by: capture
  recent_files: []

interpretations: []
promoted_to: []
superseded_by: []
---

fix oauth callback session loss
`;

const AGENT_CONTENT = `### Objective

Stabilize OAuth callback redirect to prevent session loss.

### Acceptance Criteria

- [ ] User remains authenticated after OAuth callback redirect
- [ ] Session token persists across redirect boundary

### Complexity

M — isolated auth flow change

### Confidence

medium — related files identified

### Risks

- Refresh token regression under concurrent tab scenario`;

const VALID_PATCH = JSON.stringify({
  task_id: 'TASK-212',
  intent_id: 'INTENT-001',
  schema_version: 1,
  produced_at: '2026-05-11T10:30:00Z',
  actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
  content: AGENT_CONTENT,
});

const VALID_TRANSITION = JSON.stringify({
  intent_id: 'INTENT-001',
  task_id: 'TASK-212',
  schema_version: 1,
  produced_at: '2026-05-11T10:30:00Z',
  action: 'promote',
  promotion_confidence: 'medium',
});

function setupHappyPath(fs: MockFS) {
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = VALID_PATCH;
  fs.files['.arch/pending/INTENT-001-transition.json'] = VALID_TRANSITION;
  fs.files['.arch/locks/TASK-212.lock'] = new Date().toISOString();
}

test('FinalizePromotion happy path - TASK updated to finalized', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, true);
  const taskContent = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskContent, 'task file should exist');
  assert.ok(taskContent.includes('enrichment_phase: finalized'), 'should be finalized');
  assert.ok(taskContent.includes('think-agent'), 'actor should be present');
});

test('FinalizePromotion happy path - INTENT updated to PROMOTED', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  const intentContent = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(intentContent.includes('status: PROMOTED'));
  assert.ok(intentContent.includes('TASK-212'));
});

test('FinalizePromotion happy path - enrichment snapshot written', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  const snapshot = fs.files['.arch/enrichments/TASK-212.json'];
  assert.ok(snapshot, 'snapshot should exist');
  const parsed = JSON.parse(snapshot);
  assert.strictEqual(parsed.task_id, 'TASK-212');
  assert.strictEqual(parsed.intent_id, 'INTENT-001');
  assert.ok(parsed.finalized_at);
  assert.deepStrictEqual(parsed.actor, { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' });
});

test('FinalizePromotion happy path - pending files deleted', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  assert.ok(!('.arch/pending/TASK-212-patch.json' in fs.files));
  assert.ok(!('.arch/pending/INTENT-001-transition.json' in fs.files));
  assert.ok(!('.arch/locks/TASK-212.lock' in fs.files));
});

test('FinalizePromotion - aborts if enrichment_phase is not scaffolded', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT.replace('enrichment_phase: scaffolded', 'enrichment_phase: finalized');

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  assert.ok(result.reason?.includes('enrichment_phase'));
});

test('FinalizePromotion - aborts if intent status is not CAPTURED', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT.replace('status: CAPTURED', 'status: PROMOTED');

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  assert.ok(result.reason?.includes('not CAPTURED'));
});

test('FinalizePromotion - writes error artifact on empty patch content', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);
  const badPatch = JSON.stringify({
    task_id: 'TASK-212',
    intent_id: 'INTENT-001',
    schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
    content: '',
  });
  fs.files['.arch/pending/TASK-212-patch.json'] = badPatch;

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  const errorFile = fs.files['.arch/enrichments/TASK-212-error.json'];
  assert.ok(errorFile, 'error artifact should exist');
  const err = JSON.parse(errorFile);
  assert.strictEqual(err.task_id, 'TASK-212');
});

test('FinalizePromotion - pending files deleted on failure too', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);
  const badPatch = JSON.stringify({ task_id: 'TASK-212', intent_id: 'INTENT-001', schema_version: 1, produced_at: '2026-05-11T10:30:00Z', actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' }, content: '' });
  fs.files['.arch/pending/TASK-212-patch.json'] = badPatch;

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  assert.ok(!('.arch/pending/TASK-212-patch.json' in fs.files));
  assert.ok(!('.arch/pending/INTENT-001-transition.json' in fs.files));
});

test('FinalizePromotion - aborts if snapshot already exists', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);
  fs.files['.arch/enrichments/TASK-212.json'] = '{"existing": true}';

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  assert.ok(result.reason?.includes('snapshot already exists'));
});

// Invariant 8: Patch pair required — transition file missing → ThinkCommand skips;
// FinalizePromotion itself does not check transition file, so direct call still succeeds.
test('FinalizePromotion - returns success when transition file is missing (transition check is ThinkCommand responsibility)', async () => {
  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = VALID_PATCH;
  // No transition file — FinalizePromotion does not check for it

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');
  // All FinalizePromotion preconditions are met: scaffolded + CAPTURED + no snapshot
  assert.strictEqual(result.success, true);
});

// Invariant 9: .arch/staging/ is clean after execution (success case)
test('FinalizePromotion - staging files are cleaned up on success', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  // No staging files remain
  const stagingFiles = Object.keys(fs.files).filter(k => k.startsWith('.arch/staging/'));
  assert.strictEqual(stagingFiles.length, 0, 'staging directory should be empty after success');
});

// Invariant 7: No partial promotion — INTENT only marked PROMOTED after step B rename
test('FinalizePromotion - rename order is A (task) then B (intent) then C (snapshot)', async () => {
  const fs = new MockFS();
  setupHappyPath(fs);

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  // Step A: task renamed from staging to docs/tasks
  const stepA = fs.renames.find(([from]) => from.includes('.arch/staging/TASK-212.md'));
  const stepB = fs.renames.find(([from]) => from.includes('.arch/staging/INTENT-001.md'));
  const stepC = fs.renames.find(([from]) => from.includes('.arch/staging/TASK-212-snapshot.json'));

  assert.ok(stepA, 'step A rename (task) should have occurred');
  assert.ok(stepB, 'step B rename (intent) should have occurred');
  assert.ok(stepC, 'step C rename (snapshot) should have occurred');

  const stepAIndex = fs.renames.indexOf(stepA!);
  const stepBIndex = fs.renames.indexOf(stepB!);
  const stepCIndex = fs.renames.indexOf(stepC!);
  assert.ok(stepAIndex < stepBIndex, 'step A must precede step B');
  assert.ok(stepBIndex < stepCIndex, 'step B must precede step C');
});
