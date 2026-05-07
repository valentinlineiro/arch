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
  version: 1,
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
  if (result.adrs.length >= 2) {
    assert.equal(result.adrs[0].id, 'ADR-002');
  }
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
