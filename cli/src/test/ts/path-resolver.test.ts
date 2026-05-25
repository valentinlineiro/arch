import { test } from 'node:test';
import assert from 'node:assert';
import { PathResolver } from '../../main/ts/domain/services/path-resolver.js';

test('PathResolver: returns hardcoded defaults when no config provided', () => {
  const r = new PathResolver({});
  assert.strictEqual(r.tasks, 'docs/tasks');
  assert.strictEqual(r.archive, 'docs/archive');
  assert.strictEqual(r.adr, 'docs/adr');
  assert.strictEqual(r.inbox, 'docs/INBOX.md');
  assert.strictEqual(r.guidelines, 'docs/guidelines');
  assert.strictEqual(r.agents, 'docs/agents');
  assert.strictEqual(r.refinement, 'docs/refinement');
  assert.strictEqual(r.refinementArchive, 'docs/refinement/archive');
  assert.strictEqual(r.events, 'docs/EVENTS.md');
  assert.strictEqual(r.statusProjection, '.arch/status-projection.json');
  assert.strictEqual(r.focusLedger, '.arch/focus-ledger.jsonl');
  assert.strictEqual(r.contextIndex, '.arch/context-index.json');
  assert.strictEqual(r.corpusIndex, '.arch/corpus-index.json');
  assert.strictEqual(r.escalations, '.arch/escalations.jsonl');
});

test('PathResolver: config overrides take precedence over defaults', () => {
  const r = new PathResolver({
    paths: {
      tasks: 'work/tasks',
      archive: 'work/archive',
      inbox: 'work/INBOX.md',
      focusLedger: 'work/.arch/focus-ledger.jsonl',
    },
  });
  assert.strictEqual(r.tasks, 'work/tasks');
  assert.strictEqual(r.archive, 'work/archive');
  assert.strictEqual(r.inbox, 'work/INBOX.md');
  assert.strictEqual(r.focusLedger, 'work/.arch/focus-ledger.jsonl');
  // unoveridden keys still use defaults
  assert.strictEqual(r.adr, 'docs/adr');
  assert.strictEqual(r.guidelines, 'docs/guidelines');
});

test('PathResolver: partial config overrides only specified keys', () => {
  const r = new PathResolver({ paths: { tasks: 'custom/tasks' } });
  assert.strictEqual(r.tasks, 'custom/tasks');
  assert.strictEqual(r.archive, 'docs/archive');
  assert.strictEqual(r.inbox, 'docs/INBOX.md');
});

test('PathResolver.from() constructs from raw config object', () => {
  const config = { paths: { tasks: 'src/tasks', archive: 'src/archive' } };
  const r = PathResolver.from(config);
  assert.strictEqual(r.tasks, 'src/tasks');
  assert.strictEqual(r.archive, 'src/archive');
  assert.strictEqual(r.adr, 'docs/adr');
});

test('PathResolver: all accessor names are defined (no undefined accessors)', () => {
  const r = new PathResolver({});
  const accessors = [
    'tasks', 'archive', 'adr', 'inbox', 'guidelines', 'agents',
    'refinement', 'refinementArchive', 'events', 'statusProjection',
    'focusLedger', 'contextIndex', 'corpusIndex', 'escalations',
  ];
  for (const key of accessors) {
    assert.notStrictEqual((r as any)[key], undefined, `accessor '${key}' must be defined`);
    assert.ok(typeof (r as any)[key] === 'string', `accessor '${key}' must be a string`);
  }
});
