import { test } from 'node:test';
import assert from 'node:assert';
import { hasOverdueWeakSignal, parseAdjudicationDate } from '../../main/ts/application/use-cases/weak-signal-checker.js';

test('parseAdjudicationDate extracts ISO date from Adjudicate by line', () => {
  assert.strictEqual(
    parseAdjudicationDate('**Adjudicate by:** 2026-06-26 (after 6 THINK reviews)'),
    '2026-06-26'
  );
});

test('parseAdjudicationDate returns null for non-ISO format', () => {
  assert.strictEqual(
    parseAdjudicationDate('**Adjudicate by:** after 6 THINK reviews'),
    null
  );
});

test('parseAdjudicationDate ignores promoted/demoted signals', () => {
  assert.strictEqual(
    parseAdjudicationDate('**Adjudicate by:** after 3 THINK reviews — PROMOTED 2026-05-15'),
    null
  );
});

test('hasOverdueWeakSignal returns false and warns when no ISO dates found', () => {
  const warnings: string[] = [];
  const content = '**Adjudicate by:** after 6 THINK reviews\n**Adjudicate by:** after 3 THINK reviews';
  const result = hasOverdueWeakSignal(content, new Date('2026-05-15'), warnings);
  assert.strictEqual(result, false);
  assert.ok(warnings.length > 0);
  assert.ok(warnings[0].includes('no ISO date'));
});

test('hasOverdueWeakSignal returns true when a date is past today', () => {
  const warnings: string[] = [];
  const content = '**Adjudicate by:** 2026-01-01 (past deadline)';
  const result = hasOverdueWeakSignal(content, new Date('2026-05-15'), warnings);
  assert.strictEqual(result, true);
  assert.strictEqual(warnings.length, 0);
});

test('hasOverdueWeakSignal returns false when all dates are future', () => {
  const warnings: string[] = [];
  const content = '**Adjudicate by:** 2027-01-01 (future)';
  const result = hasOverdueWeakSignal(content, new Date('2026-05-15'), warnings);
  assert.strictEqual(result, false);
});
