import { test } from 'node:test';
import assert from 'node:assert';
import { COMMAND_REGISTRY, getPublicTopLevel, getPublicEntriesByNamespace, getPublicSubCommands } from '../../main/ts/domain/services/command-registry.js';

test('registry is non-empty', () => {
  assert.ok(COMMAND_REGISTRY.length > 0, 'registry must have entries');
});

test('every entry has required fields', () => {
  for (const e of COMMAND_REGISTRY) {
    assert.ok(e.name, `entry missing name: ${JSON.stringify(e)}`);
    assert.ok(e.topLevel, `entry missing topLevel: ${JSON.stringify(e)}`);
    assert.ok(e.visibility, `entry missing visibility: ${JSON.stringify(e)}`);
    assert.ok(e.description, `entry missing description: ${JSON.stringify(e)}`);
    assert.ok(e.name.startsWith('arch '), `entry name must start with "arch ": ${e.name}`);
  }
});

test('visibility is one of the allowed values', () => {
  const allowed = new Set(['public', 'internal', 'deprecated', 'experimental']);
  for (const e of COMMAND_REGISTRY) {
    assert.ok(allowed.has(e.visibility), `invalid visibility "${e.visibility}" on ${e.name}`);
  }
});

test('every subCommand entry has a subCommand', () => {
  for (const e of COMMAND_REGISTRY) {
    if (e.subCommand !== undefined) {
      assert.ok(typeof e.subCommand === 'string' && e.subCommand.length > 0,
        `subCommand must be non-empty string: ${e.name}`);
    }
  }
});

test('top-level names are unique in registry', () => {
  const seen = new Set<string>();
  for (const e of COMMAND_REGISTRY) {
    assert.ok(!seen.has(e.name), `duplicate entry: ${e.name}`);
    seen.add(e.name);
  }
});

test('getPublicTopLevel returns only public top-level namespaces', () => {
  const top = getPublicTopLevel();
  assert.ok(Array.isArray(top), 'must return array');
  assert.ok(top.length > 0, 'must have at least one public namespace');
  const publicNs = new Set(COMMAND_REGISTRY.filter(e => e.visibility === 'public').map(e => e.topLevel));
  for (const ns of top) {
    assert.ok(publicNs.has(ns), `${ns} is not a known public namespace`);
  }
});

test('getPublicEntriesByNamespace returns only public entries for that namespace', () => {
  const ns = getPublicTopLevel()[0];
  const entries = getPublicEntriesByNamespace(ns);
  for (const e of entries) {
    assert.strictEqual(e.topLevel, ns, `wrong namespace for ${e.name}`);
    assert.strictEqual(e.visibility, 'public', `${e.name} is not public`);
  }
});

test('help descriptions are non-empty and meaningful', () => {
  for (const e of COMMAND_REGISTRY.filter(e => e.visibility === 'public')) {
    assert.ok(e.description.length > 5, `description too short for ${e.name}: "${e.description}"`);
  }
});

test('category is defined for public commands', () => {
  for (const e of COMMAND_REGISTRY.filter(e => e.visibility === 'public')) {
    assert.ok(e.category, `public command missing category: ${e.name}`);
  }
});

test('subCommands for task namespace match actual runtime behavior', () => {
  const taskSubs = getPublicSubCommands('task');
  const subNames = taskSubs.map(e => e.subCommand);

  const expectedPublic = [
    'start', 'done', 'review', 'create', 'capture', 'edit', 'reprioritize',
    'next', 'rank', 'promote', 'reject', 'approve', 'redirect', 'split', 'compress', 'hansei',
  ];

  assert.ok(taskSubs.length === expectedPublic.length,
    `task public subcommands changed. Got: ${subNames.join(', ')}. Expected: ${expectedPublic.join(', ')}`);

  for (const expected of expectedPublic) {
    assert.ok(subNames.includes(expected), `expected subcommand not in registry: ${expected}`);
  }
});

test('memory namespace has all four public subcommands', () => {
  const memorySubs = getPublicSubCommands('memory').map(e => e.subCommand);
  const expected = ['ask', 'index', 'explain', 'deps'];

  assert.ok(memorySubs.length === expected.length,
    `memory public subcommands changed. Got: ${memorySubs.join(', ')}. Expected: ${expected.join(', ')}`);

  for (const exp of expected) {
    assert.ok(memorySubs.includes(exp), `expected memory subcommand not in registry: ${exp}`);
  }
});

test('govern namespace has inbox, serve, report, conduct, approve', () => {
  const governSubs = getPublicSubCommands('govern').map(e => e.subCommand);
  const expected = ['inbox', 'serve', 'report', 'conduct', 'approve'];

  for (const exp of expected) {
    assert.ok(governSubs.includes(exp), `expected govern subcommand not in registry: ${exp}`);
  }
});