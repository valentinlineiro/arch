import { test } from 'node:test';
import assert from 'node:assert';
import { VerifiabilityScorer } from '../../main/ts/domain/services/verifiability-scorer.js';

const taskWithAllMachine = `
### Acceptance Criteria
- [ ] File exists
  - \`file: docs/output.md\`
- [ ] Tests pass
  - \`cmd: npm test; exit: 0\`
- [ ] arch review passes
  - \`cmd: node cli/dist/index.js review\`
`;

const taskWithMixed = `
### Acceptance Criteria
- [ ] Document exists
  - \`file: docs/output.md\`
- [ ] Content is accurate
  - \`prose: reviewed and verified\`
- [ ] arch review passes
  - \`cmd: node cli/dist/index.js review\`
`;

const taskAllProse = `
### Acceptance Criteria
- [ ] Intent addressed
  - \`prose: verified\`
- [ ] Outcome confirmed
  - \`prose: reviewed\`
`;

const taskNoPredicate = `
### Acceptance Criteria
- [ ] Something done
- [ ] Something else done
`;

test('VerifiabilityScorer - all machine-verifiable predicates', () => {
  const report = VerifiabilityScorer.score(taskWithAllMachine);
  assert.strictEqual(report.total, 3);
  assert.strictEqual(report.machineVerifiable, 3);
  assert.strictEqual(report.score, 100);
  assert.strictEqual(report.belowThreshold, false);
});

test('VerifiabilityScorer - mixed predicates above threshold', () => {
  const report = VerifiabilityScorer.score(taskWithMixed);
  assert.strictEqual(report.total, 3);
  assert.strictEqual(report.machineVerifiable, 2);
  assert.strictEqual(report.score, 67);
  assert.strictEqual(report.belowThreshold, false);
});

test('VerifiabilityScorer - all prose is below threshold', () => {
  const report = VerifiabilityScorer.score(taskAllProse);
  assert.strictEqual(report.total, 2);
  assert.strictEqual(report.machineVerifiable, 0);
  assert.strictEqual(report.score, 0);
  assert.strictEqual(report.belowThreshold, true);
});

test('VerifiabilityScorer - no predicates returns zero total', () => {
  const report = VerifiabilityScorer.score(taskNoPredicate);
  assert.strictEqual(report.total, 0);
  assert.strictEqual(report.machineVerifiable, 0);
  assert.strictEqual(report.score, 0);
});

test('VerifiabilityScorer - format shows check when above threshold', () => {
  const report = VerifiabilityScorer.score(taskWithAllMachine);
  const line = VerifiabilityScorer.format(report);
  assert.ok(line.includes('3/3'), 'should show count');
  assert.ok(line.includes('100%'), 'should show percentage');
  assert.ok(!line.includes('⚠'), 'should not warn when above threshold');
});

test('VerifiabilityScorer - format shows warning when below threshold', () => {
  const report = VerifiabilityScorer.score(taskAllProse);
  const line = VerifiabilityScorer.format(report);
  assert.ok(line.includes('⚠'), 'should warn when below threshold');
  assert.ok(line.includes('cmd:/file:'), 'should mention how to fix');
});

test('VerifiabilityScorer - format handles no predicates', () => {
  const report = VerifiabilityScorer.score(taskNoPredicate);
  const line = VerifiabilityScorer.format(report);
  assert.ok(line.includes('⚠'), 'should warn on no predicates');
});

test('VerifiabilityScorer - WARN_THRESHOLD is 50', () => {
  assert.strictEqual(VerifiabilityScorer.WARN_THRESHOLD, 50);
});
