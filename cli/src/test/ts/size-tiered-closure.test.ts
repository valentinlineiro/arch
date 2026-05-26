import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TaskValidator } from '../../main/ts/domain/services/task-validator.js';

describe('Size-tiered Hansei obligations', () => {
  const makeTask = (size: string, hasHansei: boolean) => ({
    id: 'TASK-001',
    title: 'Test task',
    status: 'IN_PROGRESS' as const,
    size,
    class: '2-code-generation',
    priority: 'P1',
    cli: 'claude-code',
    context: ['none'],
    hansei: hasHansei ? {
      severity: 'H0',
      category: '[AuditGap]',
      decision: 'AC1 implemented cleanly. AC2 verified via prose. No blockers encountered during TASK-001 execution.',
      constraint: 'No constraints encountered. Work scoped to cli/src/main/ts/domain/services/ only.',
      cost: 'No architectural debt introduced. All changes within existing patterns.',
      forwardAction: 'No follow-up. TASK-001 closed cleanly.',
    } : undefined,
    content: hasHansei
      ? '## TASK-001: Test\n**Meta:** P1 | ' + size + ' | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n\n- [x] Done\n  - `prose: verified`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** AC1 implemented cleanly. AC2 verified via prose. No blockers encountered during TASK-001 execution.\n**Constraint:** No constraints encountered. Work scoped to cli/src/main/ts/domain/services/ only.\n**Cost:** No architectural debt introduced. All changes within existing patterns.\n**Forward Action:** No follow-up. TASK-001 closed cleanly.\n'
      : '## TASK-001: Test\n**Meta:** P1 | ' + size + ' | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n\n- [x] Done\n  - `prose: verified`\n',
    acceptanceCriteria: [{ text: 'Done', checked: true, predicates: [{ type: 'prose' as const, value: 'verified' }] }],
    lockedBy: 'test',
    lockedAt: new Date().toISOString(),
    depends: [],
  });

  it('XS without Hansei: validateHansei returns no errors', () => {
    const task = makeTask('XS', false);
    const errors = TaskValidator.validateHansei(task as any);
    assert.equal(errors.length, 0, 'XS should not require Hansei');
  });

  it('S without Hansei: validateHansei returns no errors', () => {
    const task = makeTask('S', false);
    const errors = TaskValidator.validateHansei(task as any);
    assert.equal(errors.length, 0, 'S should not require Hansei');
  });

  it('M without Hansei: validateHansei returns error', () => {
    const task = makeTask('M', false);
    const errors = TaskValidator.validateHansei(task as any);
    assert.ok(errors.length > 0, 'M should require Hansei');
    assert.ok(errors.some(e => e.includes('Required for M+')));
  });

  it('L without Hansei: validateHansei returns error', () => {
    const task = makeTask('L', false);
    const errors = TaskValidator.validateHansei(task as any);
    assert.ok(errors.length > 0, 'L should require Hansei');
  });

  it('M with complete Hansei: validateHansei returns no errors', () => {
    const task = makeTask('M', true);
    const errors = TaskValidator.validateHansei(task as any);
    assert.equal(errors.length, 0, 'M with Hansei should pass');
  });
});
