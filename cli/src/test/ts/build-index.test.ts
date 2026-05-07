import { test } from 'node:test';
import assert from 'node:assert';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry } from '../../main/ts/domain/models/context-index.js';

test('ContextIndex types are importable and structurally correct', () => {
  const file: FileEntry = {
    symbols: ['MyClass'],
    imports: ['cli/src/main/ts/domain/models/task.ts'],
    tags: ['domain', 'model', 'my', 'class'],
    criticality: 'core',
    runtimeUsage: 'hot',
  };

  const adr: AdrEntry = {
    title: 'Context as a budget',
    keywords: ['context', 'budget', 'token'],
    affectedModules: ['cli/src/main/ts/domain/services/config-loader.ts'],
    strength: 'enforced',
  };

  const guideline: GuidelineEntry = {
    tags: ['test', 'ci'],
    taskClasses: ['2-code-generation'],
  };

  const index: ContextIndex = {
    version: 1,
    builtAt: '2026-05-07T14:00:00Z',
    files: { 'cli/src/main/ts/domain/models/task.ts': file },
    adrs: { 'ADR-002': adr },
    guidelines: { 'testing-a-change.md': guideline },
  };

  assert.equal(index.version, 1);
  assert.equal(index.files['cli/src/main/ts/domain/models/task.ts'].criticality, 'core');
  assert.equal(index.adrs['ADR-002'].strength, 'enforced');
  assert.deepEqual(index.guidelines['testing-a-change.md'].taskClasses, ['2-code-generation']);
});
