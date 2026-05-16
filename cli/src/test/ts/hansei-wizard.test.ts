import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HanseiWizard } from '../../main/ts/application/use-cases/hansei-wizard.js';
import { TaskValidator } from '../../main/ts/domain/services/task-validator.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

const COMPLETE_HANSEI = `## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Implementation diverged slightly from spec due to upstream API change.
**Constraint:** The external API does not support batch operations — each call is sequential.
**Cost:** Minor latency increase on large datasets; no architectural debt.
**Forward Action:** Monitor for recurrence in the next three similar tasks.
`;

const EMPTY_HANSEI = `## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
`;

const NO_HANSEI = `## TASK-001: Test task
**Meta:** P2 | S | DONE | Focus:no | 7-operations | local | none

### Acceptance Criteria
- [x] something done
`;

// Test 1: isHanseiComplete returns true for fully-populated Hansei
test('HanseiWizard.isHanseiComplete — fully populated returns true', () => {
  assert.equal(HanseiWizard.isHanseiComplete(COMPLETE_HANSEI), true);
});

// Test 2: isHanseiComplete returns false when ## Hansei section is missing
test('HanseiWizard.isHanseiComplete — missing section returns false', () => {
  assert.equal(HanseiWizard.isHanseiComplete(NO_HANSEI), false);
});

// Test 3: isHanseiComplete returns false for placeholder/empty fields
test('HanseiWizard.isHanseiComplete — placeholder fields return false', () => {
  assert.equal(HanseiWizard.isHanseiComplete(EMPTY_HANSEI), false);
});

// Test 4: isHanseiComplete returns false for "None." fields
test('HanseiWizard.isHanseiComplete — "None." fields return false', () => {
  const content = `## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Something happened here that is long enough.
**Constraint:** None.
**Cost:** None introduced here.
**Forward Action:** None required.
`;
  // "None." is a placeholder — should return false
  assert.equal(HanseiWizard.isHanseiComplete(content), false);
});

// Test 5: format() produces a block that passes TaskValidator.validateHansei
test('HanseiWizard.format — assembled block passes TaskValidator', () => {
  const wizard = new HanseiWizard();
  const block = wizard.format({
    severity: 'H1',
    category: '[SpecDrift]',
    decision: 'Implementation diverged from spec due to upstream API change in the external library.',
    constraint: 'The external API does not support batch operations — each call is sequential.',
    cost: 'Minor latency increase on large datasets; no architectural debt introduced.',
    forwardAction: 'None required — deviation is documented and bounded by the constraint.',
  });

  // Parse into hansei object for validation
  const hanseiMatch = block.match(/\*\*Severity:\*\*\s*(\S+)/);
  const catMatch = block.match(/\*\*Category:\*\*\s*(\S+)/);
  const decMatch = block.match(/\*\*Decision:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  const conMatch = block.match(/\*\*Constraint:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  const costMatch = block.match(/\*\*Cost:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  const fwdMatch = block.match(/\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);

  const errors = TaskValidator.validateHansei({
    id: 'TASK-001',
    status: TaskStatus.DONE,
    hansei: {
      severity: hanseiMatch![1] as any,
      category: catMatch![1],
      decision: decMatch![1].trim(),
      constraint: conMatch![1].trim(),
      cost: costMatch![1].trim(),
      forwardAction: fwdMatch![1].trim(),
    },
  } as any);

  assert.deepEqual(errors, [], `Expected no validation errors, got: ${JSON.stringify(errors)}`);
});

// Test 6: run() skipped when isHanseiComplete returns true (no wizard launched)
test('HanseiWizard.isHanseiComplete — wizard skipped when Hansei already complete', () => {
  // This is a property test: if isHanseiComplete returns true, MarkTaskDone
  // should not invoke wizard.run(). We test the predicate directly.
  const result = HanseiWizard.isHanseiComplete(COMPLETE_HANSEI);
  assert.equal(result, true, 'Complete Hansei should not trigger wizard');
});

// Test 7: non-TTY path — wizard skipped, isHanseiComplete drives the gate
test('HanseiWizard.isHanseiComplete — non-TTY incomplete Hansei returns false (would exit 1)', () => {
  // In non-TTY context, MarkTaskDone checks isHanseiComplete.
  // If false and non-TTY: exits 1. We verify the predicate returns false.
  const result = HanseiWizard.isHanseiComplete(EMPTY_HANSEI);
  assert.equal(result, false, 'Empty Hansei should trigger wizard or exit 1 in non-TTY');
});
