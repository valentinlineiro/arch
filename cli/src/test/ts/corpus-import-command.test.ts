import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CorpusIndexService } from '../../main/ts/application/use-cases/corpus-index.js';
import { MockFileSystem } from './mocks/index.js';

const TASK_WITH_HANSEI = `## TASK-EXT-001: external task
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/
**Closed-at:** 2026-01-01T10:00:00Z
**Locked-commit:** def5678

## Hansei
**Severity:** H1
**Category:** [AuditGap]
**Decision:** External repo decision detail here for testing import.
**Constraint:** Constraint from external repo — no regressions.
**Cost:** No additional cost incurred by this task.
**Forward Action:** None required for this task.
`;

const TASK_WITH_HANSEI_2 = `## TASK-EXT-002: another external task
**Meta:** P2 | M | DONE | Focus:no | 1-code-reasoning | claude-code | docs/
**Closed-at:** 2026-02-01T12:00:00Z
**Locked-commit:** abc9999

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Second external task decision for corpus import testing.
**Constraint:** Constraint for second task — minimal risk.
**Cost:** No additional cost incurred here.
**Forward Action:** None required at this time.
`;

describe('CorpusIndexService.mergeImported', () => {
  test('tags imported entries with source slug', async () => {
    const fs = new MockFileSystem();
    // Set up empty local index
    fs.dirs['docs/archive'] = [];

    const service = new CorpusIndexService(fs);

    // Parse entries manually
    const entry1 = service.parseEntryPublic('TASK-EXT-001', TASK_WITH_HANSEI);
    assert.ok(entry1, 'entry1 should parse');

    const imported: Record<string, import('../../main/ts/application/use-cases/corpus-index.js').CorpusEntry> = {};
    imported['TASK-EXT-001'] = entry1!;

    const { added } = await service.mergeImported('external-repo', imported);
    assert.equal(added, 1);

    // Verify the written index has the source tag
    const written = fs.files['.arch/corpus-index.json'];
    assert.ok(written, 'index should be written');
    const index = JSON.parse(written);
    assert.ok('TASK-EXT-001' in index.entries, 'entry should be in index');
    assert.equal(index.entries['TASK-EXT-001'].source, 'external-repo');
  });

  test('idempotent: clears previous entries for same slug before re-importing', async () => {
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = [];

    const service = new CorpusIndexService(fs);

    const entry1 = service.parseEntryPublic('TASK-EXT-001', TASK_WITH_HANSEI);
    const entry2 = service.parseEntryPublic('TASK-EXT-002', TASK_WITH_HANSEI_2);
    assert.ok(entry1 && entry2);

    // First import: both entries
    await service.mergeImported('my-repo', { 'TASK-EXT-001': entry1!, 'TASK-EXT-002': entry2! });

    // Second import: only entry2 (simulates re-import with different content)
    const { added } = await service.mergeImported('my-repo', { 'TASK-EXT-002': entry2! });
    assert.equal(added, 1);

    const written = fs.files['.arch/corpus-index.json'];
    const index = JSON.parse(written);
    // TASK-EXT-001 should be gone (cleared by second import)
    assert.ok(!('TASK-EXT-001' in index.entries), 'old entry should be removed on re-import');
    assert.ok('TASK-EXT-002' in index.entries, 'new entry should be present');
    assert.equal(index.entries['TASK-EXT-002'].source, 'my-repo');
  });

  test('does not clear entries from a different source slug', async () => {
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = [];

    const service = new CorpusIndexService(fs);

    const entry1 = service.parseEntryPublic('TASK-EXT-001', TASK_WITH_HANSEI);
    const entry2 = service.parseEntryPublic('TASK-EXT-002', TASK_WITH_HANSEI_2);
    assert.ok(entry1 && entry2);

    // Import from two different sources
    await service.mergeImported('repo-a', { 'TASK-EXT-001': entry1! });
    await service.mergeImported('repo-b', { 'TASK-EXT-002': entry2! });

    const written = fs.files['.arch/corpus-index.json'];
    const index = JSON.parse(written);

    // Both should be present
    assert.ok('TASK-EXT-001' in index.entries);
    assert.ok('TASK-EXT-002' in index.entries);
    assert.equal(index.entries['TASK-EXT-001'].source, 'repo-a');
    assert.equal(index.entries['TASK-EXT-002'].source, 'repo-b');
  });

  test('local entries (no source) are not cleared by import of a slug', async () => {
    const fs = new MockFileSystem();
    // Set up a local corpus index with a local entry (no source)
    const localEntry = {
      id: 'TASK-LOCAL-001',
      size: 'S',
      class: '2-code-generation',
      closedAt: '2026-03-01T00:00:00Z',
      lockedCommit: null,
      severity: 'H0',
      category: '[SpecDrift]',
      decision: 'Local task decision.',
      constraint: 'Local constraint.',
      cost: 'No cost.',
      forwardAction: 'None required.',
      actor: null,
      acCount: 1,
      acMachineVerifiable: 1,
      closurePath: 'L3' as const,
    };
    const existingIndex = {
      version: 1,
      builtAt: '2026-03-01T00:00:00Z',
      archiveCommit: '5:TASK-LOCAL-001.md',
      taskCount: 1,
      entries: { 'TASK-LOCAL-001': localEntry },
    };
    fs.files['.arch/corpus-index.json'] = JSON.stringify(existingIndex);
    fs.dirs['docs/archive'] = [];

    const service = new CorpusIndexService(fs);
    const entry1 = service.parseEntryPublic('TASK-EXT-001', TASK_WITH_HANSEI);
    assert.ok(entry1);

    await service.mergeImported('remote-repo', { 'TASK-EXT-001': entry1! });

    const written = fs.files['.arch/corpus-index.json'];
    const index = JSON.parse(written);

    // Local entry should still be there
    assert.ok('TASK-LOCAL-001' in index.entries, 'local entry should not be removed');
    assert.equal(index.entries['TASK-LOCAL-001'].source, undefined);
    assert.ok('TASK-EXT-001' in index.entries);
    assert.equal(index.entries['TASK-EXT-001'].source, 'remote-repo');
  });
});
