import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CorpusIndexService } from '../../main/ts/application/use-cases/corpus-index.js';
import { MockFileSystem } from './mocks/index.js';

const TASK_WITH_HANSEI = `## TASK-001: test task
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/
**Closed-at:** 2026-05-19T10:00:00Z
**Locked-commit:** abc1234

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Spec drift found during implementation.
**Constraint:** Context paths were broader than declared.
**Cost:** One extra file modified outside context.
**Forward Action:** IDEA-verify-context-paths — file before next sprint.
`;

const TASK_NO_HANSEI = `## TASK-002: task without hansei
**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/
**Closed-at:** 2026-05-19T11:00:00Z
`;

describe('CorpusIndexService', () => {
  test('builds index from archive files', async () => {
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = ['TASK-001.md', 'TASK-002.md'];
    fs.files['docs/archive/TASK-001.md'] = TASK_WITH_HANSEI;
    fs.files['docs/archive/TASK-002.md'] = TASK_NO_HANSEI;

    const service = new CorpusIndexService(fs);
    const index = await service.rebuild();

    assert.equal(index.taskCount, 1); // TASK-002 has no Hansei — not indexed
    assert.ok('TASK-001' in index.entries);
    assert.equal(index.entries['TASK-001'].severity, 'H2');
    assert.equal(index.entries['TASK-001'].category, '[SpecDrift]');
    assert.ok(index.entries['TASK-001'].forwardAction.includes('IDEA-verify-context-paths'));
  });

  test('cache hit: returns cached index when freshness signal matches', async () => {
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = ['TASK-001.md'];
    fs.files['docs/archive/TASK-001.md'] = TASK_WITH_HANSEI;

    const service = new CorpusIndexService(fs);

    // First load — builds index
    const first = await service.load();
    assert.equal(first.taskCount, 1);

    // Inject index into mock filesystem
    fs.files['.arch/corpus-index.json'] = JSON.stringify(first);

    // Second load — should return cached (same freshness signal)
    const second = await service.load();
    assert.equal(second.taskCount, 1);
    assert.equal(second.archiveCommit, first.archiveCommit);
  });

  test('cache miss: rebuilds when archiveCommit is null (invalidated)', async () => {
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = ['TASK-001.md'];
    fs.files['docs/archive/TASK-001.md'] = TASK_WITH_HANSEI;

    const service = new CorpusIndexService(fs);
    const built = await service.rebuild();

    // Invalidate: directly set null archiveCommit in the mock's stored index
    const invalidated = { ...built, archiveCommit: '' };  // empty = stale
    fs.files['.arch/corpus-index.json'] = JSON.stringify(invalidated);

    // Load should rebuild
    const reloaded = await service.load();
    assert.ok(reloaded.archiveCommit !== '', 'Should rebuild and set fresh archiveCommit');
  });

  test('skips tasks without Hansei section', async () => {
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = ['TASK-002.md'];
    fs.files['docs/archive/TASK-002.md'] = TASK_NO_HANSEI;

    const service = new CorpusIndexService(fs);
    const index = await service.rebuild();

    // TASK-002 has no Hansei — should still be parsed if possible
    // parseEntry returns null when no Hansei, so count may be 0
    assert.equal(index.taskCount, 0);
  });

  test('parseEntry extracts forwardAction correctly when followed by Approval', async () => {
    const contentWithApproval = TASK_WITH_HANSEI + `\n## Approval\nApproved-by: human | 2026-05-19\n`;
    const fs = new MockFileSystem();
    fs.dirs['docs/archive'] = ['TASK-001.md'];
    fs.files['docs/archive/TASK-001.md'] = contentWithApproval;

    const service = new CorpusIndexService(fs);
    const index = await service.rebuild();

    assert.ok(index.entries['TASK-001'].forwardAction.includes('IDEA-verify-context-paths'),
      `Expected IDEA reference, got: "${index.entries['TASK-001'].forwardAction}"`);
  });
});
