import { test } from 'node:test';
import assert from 'node:assert';
import { ConstraintPreflight } from '../../main/ts/application/use-cases/constraint-preflight.js';
import { MockFileSystem } from './mocks/index.js';

function makeFs(files: Record<string, string> = {}): MockFileSystem {
  const fs = new MockFileSystem();
  fs.dirs['docs/adr'] = [];
  fs.dirs['docs/tensions'] = [];
  fs.dirs['docs/archive'] = [];
  Object.assign(fs.files, files);
  return fs;
}

const ACCEPTED_ADR = `# ADR-012: All state via Redis
**Date:** 2026-01-01
**Status:** ACCEPTED

## Decision
All session state must be managed via Redis. Local caches are prohibited.

## Consequences
cli/src/main/ts/session/ files must not cache locally.
`;

const DRAFT_ADR = `# ADR-013: Experimental local cache
**Date:** 2026-01-02
**Status:** DRAFT

## Decision
Local in-memory caches may be used in experimental branches.
`;

const OPEN_TENSION = `# TENSION-001: Session management
**Status:** open

## Boundary
cli/src/main/ts/session/ must route through Redis. Direct local state is prohibited.
`;

const CLOSED_TENSION = `# TENSION-002: Old conflict
**Status:** closed

## Boundary
cli/src/main/ts/old/ should not exist.
`;

const RECENT_ARCHIVE_TASK = `## TASK-500: Fix session cache
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/session/ | Closed-at: 2026-05-10T00:00:00Z

## Hansei
**Severity:** H1
**Category:** [TypeHack]
**Decision:** Used local cache temporarily.
**Constraint:** Redis was unavailable.
**Cost:** Minor state inconsistency risk.
**Forward Action:** Revert when Redis is stable.
`;

const OLD_ARCHIVE_TASK = `## TASK-400: Ancient task
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/session/ | Closed-at: 2025-01-01T00:00:00Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Old issue.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
`;

test('ConstraintPreflight - returns null when no context paths provided', async () => {
  const fs = makeFs();
  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute([]);
  assert.strictEqual(result, null);
});

test('ConstraintPreflight - returns null when no ADR/tension overlap', async () => {
  const fs = makeFs({
    'docs/adr/ADR-012-redis.md': ACCEPTED_ADR,
    'docs/tensions/TENSION-001.md': OPEN_TENSION,
  });
  fs.dirs['docs/adr'] = ['ADR-012-redis.md'];
  fs.dirs['docs/tensions'] = ['TENSION-001.md'];

  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute(['cli/src/main/ts/auth/']);
  assert.strictEqual(result, null, 'no overlap — should be silent');
});

test('ConstraintPreflight - includes ACCEPTED ADR that overlaps context path', async () => {
  const fs = makeFs({
    'docs/adr/ADR-012-redis.md': ACCEPTED_ADR,
  });
  fs.dirs['docs/adr'] = ['ADR-012-redis.md'];

  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute(['cli/src/main/ts/session/']);
  assert.ok(result !== null, 'should emit preflight block');
  assert.ok(result!.includes('ADR-012'), 'should include ADR reference');
  assert.ok(result!.includes('Constraint Preflight'), 'should have section header');
});

test('ConstraintPreflight - excludes DRAFT ADRs', async () => {
  const fs = makeFs({
    'docs/adr/ADR-013-cache.md': DRAFT_ADR,
  });
  fs.dirs['docs/adr'] = ['ADR-013-cache.md'];

  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute(['cli/src/main/ts/session/']);
  assert.strictEqual(result, null, 'DRAFT ADRs must be excluded');
});

test('ConstraintPreflight - includes open tension that overlaps context path', async () => {
  const fs = makeFs({
    'docs/tensions/TENSION-001.md': OPEN_TENSION,
  });
  fs.dirs['docs/tensions'] = ['TENSION-001.md'];

  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute(['cli/src/main/ts/session/']);
  assert.ok(result !== null, 'should emit preflight block');
  assert.ok(result!.includes('TENSION-001'), 'should include tension reference');
});

test('ConstraintPreflight - excludes closed tension', async () => {
  const fs = makeFs({
    'docs/tensions/TENSION-002.md': CLOSED_TENSION,
  });
  fs.dirs['docs/tensions'] = ['TENSION-002.md'];

  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute(['cli/src/main/ts/old/']);
  assert.strictEqual(result, null, 'closed tensions must be excluded');
});

test('ConstraintPreflight - includes recent Hansei signal from archive', async () => {
  const fs = makeFs({
    'docs/archive/TASK-500.md': RECENT_ARCHIVE_TASK,
  });
  fs.dirs['docs/archive'] = ['TASK-500.md'];

  const preflight = new ConstraintPreflight(fs, '2026-05-18T00:00:00Z');
  const result = await preflight.execute(['cli/src/main/ts/session/']);
  assert.ok(result !== null, 'should emit preflight for recent Hansei');
  assert.ok(result!.includes('[TypeHack]'), 'should include Hansei category');
});

test('ConstraintPreflight - excludes Hansei signal older than 30 days', async () => {
  const fs = makeFs({
    'docs/archive/TASK-400.md': OLD_ARCHIVE_TASK,
  });
  fs.dirs['docs/archive'] = ['TASK-400.md'];

  const preflight = new ConstraintPreflight(fs, '2026-05-18T00:00:00Z');
  const result = await preflight.execute(['cli/src/main/ts/session/']);
  assert.strictEqual(result, null, 'old Hansei signals must be excluded');
});

test('ConstraintPreflight - omits section when that section has no matches', async () => {
  const fs = makeFs({
    'docs/adr/ADR-012-redis.md': ACCEPTED_ADR,
  });
  fs.dirs['docs/adr'] = ['ADR-012-redis.md'];
  fs.dirs['docs/tensions'] = [];
  fs.dirs['docs/archive'] = [];

  const preflight = new ConstraintPreflight(fs);
  const result = await preflight.execute(['cli/src/main/ts/session/']);
  assert.ok(result !== null);
  assert.ok(!result!.includes('Tensions'), 'tensions section omitted when empty');
  assert.ok(!result!.includes('Recent Signals'), 'signals section omitted when empty');
});
