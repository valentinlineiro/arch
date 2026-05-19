import { test } from 'node:test';
import assert from 'node:assert';
import { CorpusAuditCommand } from '../../main/ts/application/commands/corpus-audit-command.js';
import { MockFileSystem } from './mocks/index.js';

const HANSEI_WITH_LAST_FIELD = `## TASK-001: test
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude |

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Something happened here.
**Constraint:** A real constraint was found.
**Cost:** Some cost was incurred.
**Forward Action:** File IDEA-deterministic-guards in the refinement queue.`;

const HANSEI_WITH_APPROVAL = `## TASK-002: test
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude |

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Something happened here.
**Constraint:** A real constraint was found.
**Cost:** Some cost was incurred.
**Forward Action:** File IDEA-guided-close-path before next sprint.

## Approval
Approved-by: valentinlineiro | 2026-05-19`;

test('extractHansei returns Forward Action when it is the last field before end of file', () => {
  const cmd = new CorpusAuditCommand(new MockFileSystem());
  const result = (cmd as any).extractHansei(HANSEI_WITH_LAST_FIELD);

  assert.ok(result !== null, 'Should extract Hansei section');
  assert.ok(
    result.forwardAction.length > 0,
    `Expected non-empty forwardAction, got: "${result.forwardAction}"`
  );
  assert.ok(
    result.forwardAction.includes('IDEA-deterministic-guards'),
    `Expected IDEA reference in forwardAction, got: "${result.forwardAction}"`
  );
});

test('extractHansei returns Forward Action when followed by Approval section', () => {
  const cmd = new CorpusAuditCommand(new MockFileSystem());
  const result = (cmd as any).extractHansei(HANSEI_WITH_APPROVAL);

  assert.ok(result !== null, 'Should extract Hansei section');
  assert.ok(
    result.forwardAction.length > 0,
    `Expected non-empty forwardAction, got: "${result.forwardAction}"`
  );
  assert.ok(
    result.forwardAction.includes('IDEA-guided-close-path'),
    `Expected IDEA reference in forwardAction, got: "${result.forwardAction}"`
  );
});

test('forward-action-completion check fires for H2+ task with IDEA mention', async () => {
  const fs = new MockFileSystem();
  fs.dirs['./docs/archive'] = ['TASK-001.md'];
  fs.files['./docs/archive/TASK-001.md'] = HANSEI_WITH_LAST_FIELD;

  const cmd = new CorpusAuditCommand(fs, undefined, '.');
  const result: any = await (cmd as any).audit(false);

  assert.ok(
    result.breakdown.forwardAction.required > 0,
    `Expected forwardAction.required > 0, got ${result.breakdown.forwardAction.required} — \Z regex bug prevents extraction`
  );
});
