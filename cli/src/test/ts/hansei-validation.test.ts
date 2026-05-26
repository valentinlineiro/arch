import { test } from 'node:test';
import assert from 'node:assert';
import { TaskValidator } from '../../main/ts/domain/services/task-validator.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';

const baseTask: Task = {
  id: 'TASK-001',
  title: 'Test Task',
  priority: 'P1',
  size: 'M',
  status: TaskStatus.READY,
  focus: FocusLevel.NONE,
  sprint: '',
  class: 'test',
  cli: 'local',
  context: ['test.ts'],
  content: '',
  filePath: 'docs/tasks/TASK-001.md'
};

test('TaskValidator - validateHansei - missing Hansei for M+ task', () => {
  const errors = TaskValidator.validateHansei({ ...baseTask, size: 'M' });
  assert.ok(errors.some(e => e.includes('Missing Hansei section')), 'Should require Hansei for M+ task');
});

test('TaskValidator - validateHansei - missing Hansei for S task (optional)', () => {
  const errors = TaskValidator.validateHansei({ ...baseTask, size: 'S' });
  assert.strictEqual(errors.length, 0, 'Should NOT require Hansei for S task in READY');
});

test('TaskValidator - validateHansei - S task in REVIEW does not require Hansei (tiered obligations, TASK-934)', () => {
  const errors = TaskValidator.validateHansei({ ...baseTask, size: 'S', status: TaskStatus.REVIEW });
  assert.strictEqual(errors.length, 0, 'S task in REVIEW must not require Hansei — triggered basis only');
});

test('TaskValidator - validateHansei - valid H1 Hansei', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H1',
      category: '[TypeHack]',
      decision: 'Bypassing complex circular dependency using any cast in repository.',
      constraint: 'P1 deadline and lack of specialized domain provider.',
      cost: 'Type safety is degraded specifically in the parseTask method.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.strictEqual(errors.length, 0, `Should be valid, but got: ${errors.join(', ')}`);
});

test('TaskValidator - validateHansei - vague phrasing detection', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H1',
      category: '[TypeHack]',
      decision: 'Temporary workaround for types.',
      constraint: 'Short.',
      cost: 'Minor debt.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('contains vague phrasing')), 'Should detect "temporary workaround"');
  assert.ok(errors.some(e => e.includes('too brief')), 'Should detect brief content (Short.)');
});

test('TaskValidator - validateHansei - H2 evidence requirement', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H2',
      category: '[ContextWaste]',
      decision: 'Systemic issue with context.',
      constraint: 'Constraint details here.',
      cost: 'Cost details here.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('H2 requires systemic evidence')), 'Should detect missing IDEA link or repetition evidence');
  
  // With IDEA link
  task.hansei!.forwardAction = 'Refinement tracked in IDEA-123';
  const errorsWithIdea = TaskValidator.validateHansei(task);
  assert.strictEqual(errorsWithIdea.length, 0, 'Should be valid with IDEA link');
});

test('TaskValidator - validateHansei - valid H0 (no debt, no forward action required)', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H0',
      category: '[SymbolDiscovery]',
      decision: 'Discovered that process.chdir is required for GitCli isolation in tests.',
      constraint: 'No alternative without exposing cwd on the constructor, which is out of scope.',
      cost: 'No debt introduced. Discovery is documented for future reference.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.strictEqual(errors.length, 0, `H0 should be valid, but got: ${errors.join(', ')}`);
});

test('TaskValidator - validateHansei - H3a blocks closure', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H3a',
      category: '[IntegrityCorruption]',
      decision: 'Violated the append-only invariant of the event ledger during migration.',
      constraint: 'Migration deadline forced a manual rewrite of the event log.',
      cost: 'Event log integrity cannot be verified for the affected period.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('BLOCKING')), 'H3a must produce a BLOCKING error');
  assert.ok(errors.some(e => e.includes('H3a')), 'Error must reference H3a severity');
});

test('TaskValidator - validateHansei - invalid severity string', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H5' as any,
      category: '[TypeHack]',
      decision: 'Some decision about the implementation.',
      constraint: 'Some constraint that applies here.',
      cost: 'Some cost introduced by this decision.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('Invalid Hansei Severity')), 'Should reject unknown severity');
});

test('TaskValidator - validateHansei - bracket-formatted but invalid category', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H1',
      category: '[TemporaryHack]' as any,
      decision: 'Some decision about the implementation.',
      constraint: 'Some constraint that applies here.',
      cost: 'Some cost introduced by this decision.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('Invalid Hansei Category')), 'Should reject bracket-formatted but non-vocabulary category');
});

test('TaskValidator - validateHansei - H3b requirements', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H3b',
      category: '[ProvenanceBreak]',
      decision: 'Critical bypass of principles.',
      constraint: 'Constraint details here.',
      cost: 'Cost details here.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('H3b requires a specific Expiry Resource')), 'Should detect missing expiry task/idea');
  assert.ok(errors.some(e => e.includes('H3b requires a clear Owner/Architect')), 'Should detect missing owner');
  
  // Fixed
  task.hansei!.decision = 'Owner: Architect. Bypassing provenance for legacy migration.';
  task.hansei!.forwardAction = 'Cleanup in TASK-444';
  const errorsFixed = TaskValidator.validateHansei(task);
  assert.strictEqual(errorsFixed.length, 0, 'Should be valid with Owner and Expiry Task');
});
