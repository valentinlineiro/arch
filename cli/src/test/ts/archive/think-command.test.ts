import { test } from 'node:test';
import assert from 'node:assert';
import { ThinkCommand } from '../../main/ts/application/commands/think-command.js';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';

class MockFS {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  deleted: string[] = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename(o: string, n: string) { this.files[n] = this.files[o]; delete this.files[o]; }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async deleteFile(p: string) { this.deleted.push(p); delete this.files[p]; }
}

const CAPTURED_INTENT: Intent = {
  id: 'INTENT-001',
  schemaVersion: 1,
  status: IntentStatus.CAPTURED,
  createdAt: '2026-05-11T10:00:00Z',
  updatedAt: '2026-05-11T10:00:00Z',
  origin: { source: 'cli', branch: 'main', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: [] },
  interpretations: [],
  promotedTo: [],
  supersededBy: [],
  rawIntent: 'fix oauth callback session loss',
};

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

class MockIntentRepo {
  intents: Intent[] = [CAPTURED_INTENT];
  async getNextId() { return 'INTENT-001'; }
  async save(_i: Intent) {}
  async getById(id: string) { return this.intents.find(i => i.id === id) ?? null; }
  async update(_i: Intent) {}
  async findCaptured() { return this.intents.filter(i => i.status === IntentStatus.CAPTURED); }
}

class MockTaskRepo {
  async getNextId() { return 'TASK-212'; }
  async getAll() { return []; }
  async getActive() { return []; }
  async getById(_id: string) { return null; }
  async findReady() { return []; }
  async save(_t: any) {}
}

test('ThinkCommand scaffolds a CAPTURED intent and logs scaffold created', async () => {
  const fs = new MockFS();
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.directories['docs/tasks'] = [];
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  const taskFile = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskFile, 'task file should be created');
  assert.ok(taskFile.includes('DRAFT'));
  assert.ok(taskFile.includes('enrichment_phase: scaffolded'));
  assert.ok(out.some(l => l.includes('TASK-212') && l.includes('INTENT-001')));
});

test('ThinkCommand skips scaffold if task already references the intent', async () => {
  const fs = new MockFS();
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['docs/tasks/TASK-212.md'] = `## TASK-212: fix\n**Source:** INTENT-001\nenrichment_phase: scaffolded\n`;
  fs.directories['docs/tasks'] = ['TASK-212.md'];
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  // No new scaffold output — only existing task
  assert.ok(!out.some(l => l.includes('Scaffold created')));
});

test('ThinkCommand with pending patch applies FinalizePromotion', async () => {
  const SCAFFOLD = `## TASK-212: fix oauth callback session loss\n\n**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/\n**Source:** INTENT-001\n**Depends:** none\n\n### Generation\n\nenrichment_phase: scaffolded\nscaffolded_by: arch-cli\nscaffolded_at: 2026-05-11T10:00:00Z\nenriched_by: ~\n\n### Objective\n\n_Awaiting agent enrichment_\n`;

  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = JSON.stringify({
    task_id: 'TASK-212',
    intent_id: 'INTENT-001',
    schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
    content: '### Objective\n\nFix it.\n\n### Acceptance Criteria\n\n- [ ] Done\n\n### Complexity\n\nS\n\n### Confidence\n\nhigh\n\n### Risks\n\nnone',
  });
  fs.files['.arch/pending/INTENT-001-transition.json'] = JSON.stringify({
    intent_id: 'INTENT-001', task_id: 'TASK-212', schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z', action: 'promote', promotion_confidence: 'high',
  });
  fs.directories['docs/tasks'] = ['TASK-212.md'];
  fs.directories['.arch/pending'] = ['TASK-212-patch.json', 'INTENT-001-transition.json'];

  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  const taskContent = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskContent?.includes('enrichment_phase: finalized'));
  assert.ok(out.some(l => l.includes('promoted to DRAFT')));
});

test('ThinkCommand — stale lock is cleaned up and processing continues', async () => {
  const SCAFFOLD = `## TASK-212: fix oauth\n\n**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/\n**Source:** INTENT-001\n**Depends:** none\n\n### Generation\n\nenrichment_phase: scaffolded\nscaffolded_by: arch-cli\nscaffolded_at: 2026-05-11T10:00:00Z\nenriched_by: ~\n\n### Objective\n\n_Awaiting agent enrichment_\n`;

  const staleTime = new Date(Date.now() - 6 * 60 * 1000).toISOString();
  const fs = new MockFS();
  fs.files['.arch/locks/TASK-212.lock'] = staleTime;
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = JSON.stringify({
    task_id: 'TASK-212', intent_id: 'INTENT-001', schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
    content: '### Objective\n\nFix.\n\n### Acceptance Criteria\n\n- [ ] Done\n\n### Complexity\n\nS\n\n### Confidence\n\nhigh\n\n### Risks\n\nnone',
  });
  fs.files['.arch/pending/INTENT-001-transition.json'] = JSON.stringify({
    intent_id: 'INTENT-001', task_id: 'TASK-212', schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z', action: 'promote', promotion_confidence: 'high',
  });
  fs.directories['docs/tasks'] = ['TASK-212.md'];
  fs.directories['.arch/pending'] = ['TASK-212-patch.json', 'INTENT-001-transition.json'];

  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  // Stale lock cleaned up, finalize succeeded
  assert.ok(fs.files['docs/tasks/TASK-212.md']?.includes('enrichment_phase: finalized'));
  assert.ok(out.some(l => l.includes('stale lock') || l.includes('promoted to DRAFT')));
});

test('ThinkCommand is idempotent — second run produces same task content', async () => {
  const fs = new MockFS();
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.directories['docs/tasks'] = [];
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, () => {});
  await cmd.execute([]);
  const firstContent = fs.files['docs/tasks/TASK-212.md'];

  // Second run: intent is still CAPTURED in mock repo, but task file references INTENT-001
  fs.directories['docs/tasks'] = ['TASK-212.md'];
  await cmd.execute([]);

  assert.strictEqual(fs.files['docs/tasks/TASK-212.md'], firstContent);
});

test('ThinkCommand processes specific intent when INTENT-ID provided', async () => {
  const fs = new MockFS();
  const intent2: Intent = { ...CAPTURED_INTENT, id: 'INTENT-002', rawIntent: 'second intent' };
  const intentRepo = new MockIntentRepo();
  intentRepo.intents.push(intent2);
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute(['INTENT-002']);

  // Only INTENT-002 processed
  const files = Object.keys(fs.files).filter(f => f.includes('docs/tasks/'));
  assert.strictEqual(files.length, 1);
  assert.ok(fs.files[files[0]].includes('**Source:** INTENT-002'));
});

// Invariant 11: Multi-intent isolation — one skipped/failed scaffold does not abort remaining intents
test('ThinkCommand — multi-intent: one scaffold skip does not abort others', async () => {
  const fs = new MockFS();
  const intent1 = CAPTURED_INTENT;
  const intent2: Intent = { ...CAPTURED_INTENT, id: 'INTENT-002', rawIntent: 'second intent' };

  const intentRepo = new MockIntentRepo();
  intentRepo.intents = [intent1, intent2];

  // Inline task repo: INTENT-001 is skipped (existing scaffold found), so only one getNextId call occurs for INTENT-002
  const taskRepo = {
    async getNextId() { return 'TASK-213'; },
    async getAll() { return []; },
    async getActive() { return []; },
    async getById(_id: string) { return null; },
    async findReady() { return []; },
    async save(_t: any) {},
  };

  // Pre-create TASK-212 referencing INTENT-001 so findExistingScaffold skips it
  fs.files['docs/tasks/TASK-212.md'] = `## TASK-212: existing\n**Source:** INTENT-001\nenrichment_phase: scaffolded\n`;
  fs.directories['docs/tasks'] = ['TASK-212.md'];

  const out: string[] = [];
  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  // INTENT-001 was skipped (existing scaffold found), INTENT-002 was scaffolded as TASK-213
  const task213 = fs.files['docs/tasks/TASK-213.md'];
  assert.ok(task213, 'INTENT-002 should have been scaffolded despite INTENT-001 being skipped');
  assert.ok(task213.includes('**Source:** INTENT-002'), 'TASK-213 should reference INTENT-002');
});

test('ThinkCommand injects context into scaffolded task file', async () => {
  const fs = new MockFS();
  // Minimal context index so ContextInference has something to work with
  fs.files['.arch/context-index.json'] = JSON.stringify({
    version: 5,
    builtAt: '2026-05-11T00:00:00Z',
    files: {
      'cli/src/main/ts/domain/models/intent.ts': {
        symbols: ['Intent', 'IntentStatus'],
        imports: [],
        tags: ['intent', 'domain'],
        criticality: 'core',
        runtimeUsage: 'hot',
      },
    },
    adrs: {},
    adrTaskLinks: {},
    failures: {},
    guidelineFailureLinks: {},
    guidelines: {},
    tasks: {},
  });
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.directories['docs/tasks'] = [];

  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const logs: string[] = [];
  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => logs.push(s));

  await cmd.execute([]);

  const taskFile = Object.keys(fs.files).find(k => k.startsWith('docs/tasks/TASK-'));
  assert.ok(taskFile, 'task file created');
  const content = fs.files[taskFile!];
  assert.ok(content.includes('### Relevant Context'), 'context section injected');
  // ContextInference replaces the scaffold placeholder "_confidence: ~_" with a real numeric score
  assert.ok(/\_confidence: 0\.\d\d\_/.test(content) || /\_confidence: 1\.00\_/.test(content), 'real confidence score injected by ContextInference');
  assert.ok(!content.includes('_confidence: ~_'), 'placeholder confidence replaced');
});

// Invariant 5: Fresh lock causes skip
test('ThinkCommand — fresh lock prevents processing', async () => {
  const freshTime = new Date().toISOString();
  const fs = new MockFS();
  fs.files['.arch/locks/TASK-212.lock'] = freshTime;
  fs.files['.arch/pending/TASK-212-patch.json'] = JSON.stringify({
    task_id: 'TASK-212', intent_id: 'INTENT-001', schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
    content: '### Objective\n\nTest.\n\n### Acceptance Criteria\n\n- [ ] Done\n\n### Complexity\n\nS\n\n### Confidence\n\nhigh\n\n### Risks\n\nnone',
  });
  fs.files['.arch/pending/INTENT-001-transition.json'] = JSON.stringify({
    intent_id: 'INTENT-001', task_id: 'TASK-212', schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z', action: 'promote', promotion_confidence: 'high',
  });
  fs.directories['.arch/pending'] = ['TASK-212-patch.json', 'INTENT-001-transition.json'];

  const intentRepo = new MockIntentRepo();
  intentRepo.intents = []; // no captured intents
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  // Lock was fresh, finalization should have been skipped
  assert.ok(out.some(l => l.includes('lock')), 'should log lock-related message');
  // Task should NOT be finalized — lock blocked it
  assert.ok(!(fs.files['docs/tasks/TASK-212.md']?.includes('enrichment_phase: finalized')));
});
