import { test } from 'node:test';
import assert from 'node:assert';
import { ExtractContextFeedback } from '../../main/ts/application/use-cases/extract-context-feedback.js';

const extractor = new ExtractContextFeedback();

test('returns null when no Context Feedback section exists', () => {
  const content = `## TASK-001: some task\n**Meta:** P1 | S | DONE\n\n### Acceptance Criteria\n- [x] done\n`;
  const result = extractor.extract('TASK-001', content);
  assert.strictEqual(result, null);
});

test('returns null when no verdict checkbox is checked', () => {
  const content = `## TASK-001: task\n### Context Feedback\n_Was it useful?_\n- [ ] accurate\n- [ ] partial\n- [ ] off\n`;
  const result = extractor.extract('TASK-001', content);
  assert.strictEqual(result, null);
});

test('extracts accurate verdict', () => {
  const content = `## TASK-001: task\n### Context Feedback\n_Was it useful?_\n- [x] accurate — files and ADRs were on-target\n- [ ] partial\n- [ ] off\n`;
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'accurate');
  assert.strictEqual(result!.taskId, 'TASK-001');
  assert.strictEqual(result!.details.wrongFiles, false);
});

test('extracts partial verdict with detail flags', () => {
  const content = [
    '## TASK-001: task',
    '### Context Feedback',
    '_Was it useful?_',
    '- [ ] accurate — files and ADRs were on-target',
    '- [x] partial — correct direction, missing key files',
    '- [ ] off — wrong files dominated',
    '',
    '_If partial or off:_',
    '- [ ] wrong files',
    '- [x] missing files',
    '- [ ] wrong ADRs',
    '- [ ] too much noise',
    '- [ ] confidence misleading',
  ].join('\n');
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'partial');
  assert.strictEqual(result!.details.missingFiles, true);
  assert.strictEqual(result!.details.wrongFiles, false);
  assert.strictEqual(result!.details.wrongAdrs, false);
});

test('extracts off verdict with multiple detail flags', () => {
  const content = [
    '## TASK-001: task',
    '### Context Feedback',
    '_Was it useful?_',
    '- [ ] accurate — files and ADRs were on-target',
    '- [ ] partial — correct direction, missing key files',
    '- [x] off — wrong files dominated',
    '',
    '_If partial or off:_',
    '- [x] wrong files',
    '- [ ] missing files',
    '- [x] wrong ADRs',
    '- [x] too much noise',
    '- [ ] confidence misleading',
  ].join('\n');
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'off');
  assert.strictEqual(result!.details.wrongFiles, true);
  assert.strictEqual(result!.details.wrongAdrs, true);
  assert.strictEqual(result!.details.tooMuchNoise, true);
  assert.strictEqual(result!.details.missingFiles, false);
});

test('section ends at next ## heading, not beyond', () => {
  const content = [
    '## TASK-001: task',
    '### Context Feedback',
    '- [x] accurate — files and ADRs were on-target',
    '',
    '## Hansei',
    '- [x] off — wrong files dominated',  // should NOT be parsed
  ].join('\n');
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'accurate');  // off from Hansei section must not bleed in
});
