// Tests for Intent domain model and MarkdownIntentRepository (scaffold — repository tests added in Task 4)
import { test } from 'node:test';
import assert from 'node:assert';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';

test('IntentStatus has all required values', () => {
  assert.equal(IntentStatus.CAPTURED, 'CAPTURED');
  assert.equal(IntentStatus.PROMOTED, 'PROMOTED');
  assert.equal(IntentStatus.SIGNAL, 'SIGNAL');
  assert.equal(IntentStatus.SUPERSEDED, 'SUPERSEDED');
  assert.equal(IntentStatus.DISCARDED, 'DISCARDED');
});
