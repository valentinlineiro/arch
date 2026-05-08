import { test } from 'node:test';
import assert from 'node:assert';
import { ContextInference, type ContextResult } from '../../main/ts/application/use-cases/context-inference.js';
import type { ContextIndex } from '../../main/ts/domain/models/context-index.js';

class MockFileSystem {
  files: Record<string, string> = {};
  written: Record<string, string> = {};

  async readFile(path: string): Promise<string> {
    if (!(path in this.files)) throw new Error(`Not found: ${path}`);
    return this.files[path];
  }
  async writeFile(path: string, content: string): Promise<void> { this.written[path] = content; }
  async exists(path: string): Promise<boolean> { return path in this.files; }
  async readDirectory(): Promise<string[]> { return []; }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
}

const FIXTURE_INDEX: ContextIndex = {
  version: 2,
  builtAt: '2026-05-07T00:00:00Z',
  files: {
    'cli/src/main/ts/domain/models/intent.ts': {
      symbols: ['Intent', 'IntentStatus', 'IntentOrigin'],
      imports: [],
      tags: ['domain', 'model', 'intent', 'status', 'origin'],
      criticality: 'core',
      runtimeUsage: 'hot',
    },
    'cli/src/main/ts/application/use-cases/capture-intent.ts': {
      symbols: ['CaptureIntent'],
      imports: ['cli/src/main/ts/domain/models/intent.ts'],
      tags: ['application', 'capture', 'intent'],
      criticality: 'domain',
      runtimeUsage: 'warm',
    },
    'cli/src/main/ts/infrastructure/filesystem/node-file-system.ts': {
      symbols: ['NodeFileSystem'],
      imports: [],
      tags: ['infrastructure', 'filesystem', 'node', 'file', 'system'],
      criticality: 'support',
      runtimeUsage: 'hot',
    },
    'cli/src/test/ts/context-inference.test.ts': {
      symbols: ['ContextInferenceTest'],
      imports: [],
      tags: ['test', 'context', 'inference'],
      criticality: 'utility',
      runtimeUsage: 'cold',
    },
  },
  adrs: {
    'ADR-002': {
      title: 'Context as a budget, not a default',
      keywords: ['context', 'budget', 'token', 'agent', 'cost'],
      affectedModules: [],
      strength: 'enforced',
    },
    'ADR-003': {
      title: 'Dispatch ephemeral agents',
      keywords: ['dispatch', 'ephemeral', 'agent', 'session'],
      affectedModules: [],
      strength: 'advisory',
    },
  },
  guidelines: {
    'testing-a-change.md': { tags: ['testing', 'change', 'validation'], taskClasses: ['2-code-generation'] },
    'versioning.md': { tags: ['versioning', 'schema', 'migration'], taskClasses: ['2-code-generation'] },
    'autonomy.md': { tags: ['autonomy', 'agent', 'loop'], taskClasses: ['7-operations'] },
  },
  tasks: {
    'TASK-217': {
      commitCount: 2,
      lastCommitDate: '2026-05-08T10:00:00Z',
      touchedFrequency: {
        'cli/src/main/ts/domain/models/intent.ts': 2,
        'cli/src/main/ts/application/use-cases/capture-intent.ts': 1,
        'docs/ROADMAP.md': 1,
        'cli/src/test/ts/context-inference.test.ts': 1,
      },
      recentCommitRefs: ['abc1234', 'def5678'],
      commitRefOverflow: false,
    },
  },
};

test('ContextInference.extractKeywords removes stopwords and splits camelCase', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const keywords = inference.extractKeywords('Add CaptureIntent use case for intent capture');
  assert.ok(keywords.includes('capture'));
  assert.ok(keywords.includes('intent'));
  assert.ok(!keywords.includes('add'));
  assert.ok(!keywords.includes('for'));
  assert.ok(!keywords.includes('use'));
});

test('ContextInference scores files by symbol and tag match', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result = inference.score(FIXTURE_INDEX, ['intent', 'capture', 'status'], '2-code-generation');
  const filePaths = result.files.map((f: any) => f.path);
  // intent.ts and capture-intent.ts should score highly for these keywords
  assert.ok(filePaths.includes('cli/src/main/ts/domain/models/intent.ts'));
  assert.ok(filePaths.includes('cli/src/main/ts/application/use-cases/capture-intent.ts'));
  // node-file-system.ts has no relevant matches
  assert.ok(!filePaths.includes('cli/src/main/ts/infrastructure/filesystem/node-file-system.ts'));
});

test('ContextInference includes direct import neighbors of top files', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  // 'capture' keyword matches capture-intent.ts, which imports intent.ts
  const result = inference.score(FIXTURE_INDEX, ['capture'], '2-code-generation');
  const filePaths = result.files.map((f: any) => f.path);
  assert.ok(filePaths.includes('cli/src/main/ts/application/use-cases/capture-intent.ts'));
  // intent.ts is a direct import of capture-intent.ts — should be included
  assert.ok(filePaths.includes('cli/src/main/ts/domain/models/intent.ts'));
});

test('ContextInference ranks enforced ADRs before advisory ones', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  // Both 'context' and 'agent' match ADRs
  const result = inference.score(FIXTURE_INDEX, ['context', 'agent', 'budget'], '2-code-generation');
  assert.ok(result.adrs.length > 0);
  // ADR-002 (enforced) should come before ADR-003 (advisory) if both match
  assert.ok(result.adrs.length >= 2, 'expected both ADRs to match the keywords');
  assert.equal(result.adrs[0].id, 'ADR-002');
});

test('ContextInference matches guidelines by task class', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result = inference.score(FIXTURE_INDEX, ['some', 'task', 'keywords'], '2-code-generation');
  const guidelineNames = result.guidelines.map((g: any) => g.name);
  assert.ok(guidelineNames.includes('testing-a-change.md'));
  assert.ok(!guidelineNames.includes('autonomy.md')); // only for 7-operations
});

test('ContextInference confidence is between 0 and 1', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result = inference.score(FIXTURE_INDEX, ['intent', 'capture'], '2-code-generation');
  assert.ok(result.confidence >= 0 && result.confidence <= 1, `confidence ${result.confidence} out of range`);
});

test('ContextInference.formatSection produces correct markdown structure', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result: ContextResult = {
    confidence: 0.82,
    files: [{ path: 'cli/src/main/ts/domain/models/intent.ts', score: 4.5, criticality: 'core', runtimeUsage: 'hot' }],
    adrs: [{ id: 'ADR-002', title: 'Context as a budget', strength: 'enforced', score: 3 }],
    guidelines: [{ name: 'testing-a-change.md', score: 2 }],
    unresolvedTaskRefs: [],
    filteredFiles: [],
  };
  const section = inference.formatSection(result);
  assert.ok(section.includes('### Relevant Context'));
  assert.ok(section.includes('_confidence: 0.82_'));
  assert.ok(section.includes('cli/src/main/ts/domain/models/intent.ts'));
  assert.ok(section.includes('_(core)_'));
  assert.ok(section.includes('ADR-002: Context as a budget _(enforced)_'));
  assert.ok(section.includes('- testing-a-change.md'));
});

test('ContextInference.insertSection inserts after ### Context when present', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const content = `## TASK-001: Title\n**Meta:** ...\n\n### Context\nSome context here.\n\n### Acceptance Criteria\n- [ ] AC1\n`;
  const section = '### Relevant Context\n_confidence: 0.75_\n';
  const updated = inference.insertSection(content, section);
  const contextIdx = updated.indexOf('### Context');
  const relevantIdx = updated.indexOf('### Relevant Context');
  const acIdx = updated.indexOf('### Acceptance Criteria');
  assert.ok(contextIdx < relevantIdx, 'Relevant Context should come after Context');
  assert.ok(relevantIdx < acIdx, 'Relevant Context should come before Acceptance Criteria');
});

test('ContextInference.insertSection inserts before ### Acceptance Criteria when no ### Context', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const content = `## TASK-001: Title\n**Meta:** ...\n\n### Acceptance Criteria\n- [ ] AC1\n`;
  const section = '### Relevant Context\n_confidence: 0.60_\n';
  const updated = inference.insertSection(content, section);
  assert.ok(updated.indexOf('### Relevant Context') < updated.indexOf('### Acceptance Criteria'));
});

test('ContextInference.insertSection replaces existing Relevant Context section', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const content = `## TASK-001\n\n### Relevant Context\n_confidence: 0.50_\n\n**Files:**\n- old-file.ts\n\n### Acceptance Criteria\n- [ ] AC1\n`;
  const section = '### Relevant Context\n_confidence: 0.80_\n\n**Files:**\n- new-file.ts\n';
  const updated = inference.insertSection(content, section);
  assert.ok(!updated.includes('old-file.ts'), 'old content should be replaced');
  assert.ok(updated.includes('new-file.ts'), 'new content should be present');
  assert.equal((updated.match(/### Relevant Context/g) ?? []).length, 1, 'only one section');
});

test('ContextInference.execute() writes Relevant Context to task file', async () => {
  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = `## TASK-001: Add capture intent support\n**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n- [ ] implement CaptureIntent\n`;

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-001', 'Add capture intent support implement CaptureIntent capture intent flow', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(written, 'task file should be written');
  assert.ok(written.includes('### Relevant Context'));
  assert.ok(written.includes('_confidence:'));
  assert.ok(written.includes('capture-intent.ts') || written.includes('intent.ts'));
});

test('ContextInference.execute() skips gracefully when index file does not exist', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/tasks/TASK-001.md'] = `## TASK-001: Some task\n\n### Acceptance Criteria\n- [ ] AC\n`;
  // No .arch/context-index.json

  const inference = new ContextInference(fs as any);
  await assert.doesNotReject(() =>
    inference.execute('TASK-001', 'some task text', '2-code-generation')
  );
  assert.ok(!fs.written['docs/tasks/TASK-001.md'], 'task file should NOT be modified when index absent');
});

test('ContextInference task-reference pass boosts files from resolved TASK refs', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(FIXTURE_INDEX, ['unrelated'], '2-code-generation', 'Follow TASK-217 before editing');
  const filePaths = result.files.map((f: any) => f.path);

  assert.ok(filePaths.includes('cli/src/main/ts/domain/models/intent.ts'));
  assert.ok(filePaths.includes('cli/src/main/ts/application/use-cases/capture-intent.ts'));
  assert.ok(filePaths.includes('docs/ROADMAP.md'));
  assert.deepEqual(result.unresolvedTaskRefs, []);
  assert.ok(!result.filteredFiles.includes('cli/src/main/ts/domain/models/intent.ts'));
});

test('ContextInference task-reference pass can surface non-indexed touched files', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(FIXTURE_INDEX, ['unrelated'], '2-code-generation', 'See TASK-217');
  const roadmap = result.files.find((f: any) => f.path === 'docs/ROADMAP.md');

  assert.ok(roadmap, 'non-indexed touched file should still be eligible for ranking');
  assert.equal(roadmap?.criticality, 'utility');
  assert.equal(roadmap?.runtimeUsage, 'cold');
});

test('ContextInference records unresolved task refs and filtered files separately', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(
    FIXTURE_INDEX,
    ['unrelated'],
    '2-code-generation',
    'Related work: TASK-217 and TASK-999',
  );

  assert.ok(result.unresolvedTaskRefs.includes('TASK-999'));
  assert.ok(!result.unresolvedTaskRefs.includes('TASK-217'));
  assert.ok(result.filteredFiles.includes('cli/src/test/ts/context-inference.test.ts'));
  assert.ok(!result.files.some((f: any) => f.path === 'cli/src/test/ts/context-inference.test.ts'));
});

test('ContextInference.execute() writes context from explicit task refs even without normal keywords', async () => {
  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-002.md'] = `## TASK-002: Follow prior task\n**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n- [ ] continue TASK-217\n`;

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-002', 'TASK-217', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-002.md'];
  assert.ok(written, 'task file should be written');
  assert.ok(written.includes('### Relevant Context'));
  assert.ok(written.includes('intent.ts') || written.includes('capture-intent.ts'));
});

import { TaskCommand } from '../../main/ts/application/commands/task-command.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

class MockTaskRepositoryForIntegration {
  private task = {
    id: 'TASK-001',
    title: 'Add capture intent for auth flow',
    status: TaskStatus.READY,
    class: '2-code-generation',
    content: '## TASK-001: Add capture intent for auth flow\n**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n- [ ] implement CaptureIntent\n',
    rawMetaLine: '**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none',
    filePath: 'docs/tasks/TASK-001.md',
    focus: true,
    depends: [],
    priority: 'P2',
    size: 'S',
    sprint: '',
    cli: 'claude-code',
    context: [],
  };
  async getById(id: string) { return id === 'TASK-001' ? { ...this.task } : null; }
  async save(task: any) { this.task = task; }
  async getAll() { return [this.task]; }
  async getActive() { return [this.task]; }
  async findReady() { return [this.task]; }
  async getNextId() { return 'TASK-002'; }
}

class MockFileSystemForIntegration {
  files: Record<string, string> = {};
  written: Record<string, string> = {};

  async readFile(path: string): Promise<string> {
    if (path in this.files) return this.files[path];
    throw new Error(`Not found: ${path}`);
  }
  async writeFile(path: string, content: string): Promise<void> { this.written[path] = content; }
  async exists(path: string): Promise<boolean> { return path in this.files; }
  async readDirectory(): Promise<string[]> { return []; }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
}

test('TaskCommand start writes Relevant Context to task file when index exists', async () => {
  const taskRepo = new MockTaskRepositoryForIntegration();
  const fs = new MockFileSystemForIntegration();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = '## TASK-001: Add capture intent for auth flow\n**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n- [ ] implement CaptureIntent\n';

  const command = new TaskCommand(taskRepo as any, {} as any, {} as any, fs as any, '.');
  await command.execute(['start', 'TASK-001']);

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(written, 'task file should be written with Relevant Context');
  assert.ok(written.includes('### Relevant Context'), 'should include Relevant Context section');
});

test('ContextInference.execute() appends Context Feedback section on first inference', async () => {
  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = '## TASK-001: Add capture intent\n\n### Acceptance Criteria\n- [ ] implement\n';

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-001', 'Add capture intent CaptureIntent', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(written.includes('### Context Feedback'), 'feedback section should be appended');
  assert.ok(written.includes('- [ ] accurate'), 'feedback checkboxes should be present');
  assert.ok(written.includes('- [ ] wrong files'), 'reason checkboxes should be present');
});

test('ContextInference.execute() does not overwrite existing Context Feedback section', async () => {
  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = '## TASK-001: Add capture intent\n\n### Relevant Context\n_confidence: 0.50_\n\n### Context Feedback\n_Was the Relevant Context above useful?_\n- [x] partial — correct direction, missing key files\n\n### Acceptance Criteria\n- [ ] implement\n';

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-001', 'Add capture intent CaptureIntent', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(written.includes('- [x] partial'), 'human feedback should be preserved');
  assert.equal((written.match(/### Context Feedback/g) ?? []).length, 1, 'only one feedback section');
});

test('ContextInference file output does not include runtimeUsage in file labels', async () => {
  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = '## TASK-001: Add capture intent\n\n### Acceptance Criteria\n- [ ] implement\n';

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-001', 'Add capture intent CaptureIntent', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(!written.match(/\(core, hot\)/), 'runtimeUsage should not appear in output');
  assert.ok(!written.match(/\(domain, warm\)/), 'runtimeUsage should not appear in output');
});
