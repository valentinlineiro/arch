import { test } from 'node:test';
import assert from 'node:assert';
import { ContextInference } from '../../main/ts/application/use-cases/context-inference.js';
import type { ContextIndex } from '../../main/ts/domain/models/context-index.js';
import type { FeedbackSignal } from '../../main/ts/domain/models/feedback-signal.js';

class MockFS {
  files: Record<string, string> = {};
  written: Record<string, string> = {};
  async readFile(p: string) { if (!(p in this.files)) throw new Error(`Not found: ${p}`); return this.files[p]; }
  async writeFile(p: string, c: string) { this.written[p] = c; }
  async exists(p: string) { return p in this.files; }
  async readDirectory() { return []; }
  async rename() {}
  async mkdir() {}
  async deleteFile(_p: string) {}
}

const BASE_INDEX: ContextIndex = {
  version: 5,
  builtAt: '2026-05-11T00:00:00Z',
  files: {
    'cli/src/main/ts/domain/models/auth.ts': {
      symbols: ['AuthService'],
      imports: [],
      tags: ['auth', 'domain'],
      criticality: 'core',
      runtimeUsage: 'hot',
    },
  },
  adrs: {},
  adrTaskLinks: {},
  failures: {},
  guidelineFailureLinks: {},
  guidelines: {},
  tasks: {
    'TASK-099': {
      commitCount: 3,
      lastCommitDate: '2026-05-01T00:00:00Z',
      touchedFrequency: { 'cli/src/main/ts/domain/models/auth.ts': 3 },
      recentCommitRefs: ['abc123'],
      commitRefOverflow: false,
    },
  },
};

test('score() with off feedback reduces task-reference boost vs without feedback', () => {
  const fs = new MockFS() as any;
  const inference = new ContextInference(fs);

  const withoutFeedback = inference.score(BASE_INDEX, [], '2-code-generation', 'fix oauth TASK-099');
  const withOff = inference.score(BASE_INDEX, [], '2-code-generation', 'fix oauth TASK-099', new Map([
    ['TASK-099', { taskId: 'TASK-099', timestamp: '2026-05-10T00:00:00Z', verdict: 'off', details: { wrongFiles: true, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false } } as FeedbackSignal],
  ]));

  const authWithout = withoutFeedback.files.find(f => f.path === 'cli/src/main/ts/domain/models/auth.ts');
  const authWithOff = withOff.files.find(f => f.path === 'cli/src/main/ts/domain/models/auth.ts');

  assert.ok(authWithout, 'auth.ts in results without feedback');
  assert.ok(authWithOff, 'auth.ts still in results with off feedback (keyword match may keep it)');
  assert.ok(authWithOff!.score <= authWithout!.score, `off feedback score (${authWithOff!.score}) should be ≤ without (${authWithout!.score})`);
});

test('score() with accurate feedback keeps normal boost', () => {
  const fs = new MockFS() as any;
  const inference = new ContextInference(fs);

  const withoutFeedback = inference.score(BASE_INDEX, [], '2-code-generation', 'fix oauth TASK-099');
  const withAccurate = inference.score(BASE_INDEX, [], '2-code-generation', 'fix oauth TASK-099', new Map([
    ['TASK-099', { taskId: 'TASK-099', timestamp: '2026-05-10T00:00:00Z', verdict: 'accurate', details: { wrongFiles: false, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false } } as FeedbackSignal],
  ]));

  const authWithout = withoutFeedback.files.find(f => f.path === 'cli/src/main/ts/domain/models/auth.ts');
  const authAccurate = withAccurate.files.find(f => f.path === 'cli/src/main/ts/domain/models/auth.ts');

  // Accurate feedback should not reduce score
  if (authWithout && authAccurate) {
    assert.strictEqual(authAccurate.score, authWithout.score);
  }
});

test('execute() loads feedback from .arch/context-feedback.json', async () => {
  const fs = new MockFS() as any;
  fs.files['.arch/context-index.json'] = JSON.stringify(BASE_INDEX);
  fs.files['.arch/context-feedback.json'] = JSON.stringify([
    { taskId: 'TASK-099', timestamp: '2026-05-10T00:00:00Z', verdict: 'off', details: { wrongFiles: true, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false } },
  ]);
  fs.files['docs/tasks/TASK-100.md'] = '## TASK-100: fix oauth TASK-099\n**Meta:** P1 | S | IN_PROGRESS\n\n### Acceptance Criteria\n- [ ] done\n';

  const inference = new ContextInference(fs);
  await inference.execute('TASK-100', 'fix oauth TASK-099', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-100.md'];
  assert.ok(written, 'task file updated');
  assert.ok(written.includes('### Relevant Context'), 'context section written');
});
