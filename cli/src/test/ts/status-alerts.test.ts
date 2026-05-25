import { test } from 'node:test';
import assert from 'node:assert';
import { parseInboxAlerts } from '../../main/ts/application/commands/status-command.js';

const INBOX_WITH_ALERTS = `# INBOX

## Alerts
[ANDON_HALT] TASK-001 — implementation blocked on missing dep
[PATTERN-ALERT] [SpecDrift] 8 occurrences — systemic
[CORPUS_ALERT] corpus quality dropped below threshold
[ADVISORY] Low priority: consider running arch audit
[SEMANTIC-DRIFT] deprecated term detected
**Title:** some noise line

## Other Section
[ANDON_HALT] this is NOT in the Alerts section — should be ignored
`;

const INBOX_MANY_ALERTS = `# INBOX

## Alerts
[ANDON_HALT] first alert
[PATTERN-ALERT] second alert
[CORPUS_ALERT] third alert
[ANDON_HALT] fourth alert
[PATTERN-ALERT] fifth alert

## End
`;

const INBOX_NO_ALERTS_SECTION = `# INBOX

## Loop Status
[ANDON_HALT] this should be ignored — no Alerts section
`;

const INBOX_EMPTY_ALERTS = `# INBOX

## Alerts

## Loop Status
`;

test('returns only allowed prefixes from ## Alerts section', () => {
  const result = parseInboxAlerts(INBOX_WITH_ALERTS);
  assert.strictEqual(result.length, 3);
  assert.ok(result[0].startsWith('[ANDON_HALT]'));
  assert.ok(result[1].startsWith('[PATTERN-ALERT]'));
  assert.ok(result[2].startsWith('[CORPUS_ALERT]'));
});

test('excludes [ADVISORY] entries', () => {
  const result = parseInboxAlerts(INBOX_WITH_ALERTS);
  assert.ok(result.every(l => !l.startsWith('[ADVISORY]')));
});

test('excludes markdown formatting lines', () => {
  const result = parseInboxAlerts(INBOX_WITH_ALERTS);
  assert.ok(result.every(l => !l.startsWith('**')));
});

test('excludes lines outside ## Alerts section', () => {
  const result = parseInboxAlerts(INBOX_WITH_ALERTS);
  assert.strictEqual(result.length, 3);
});

test('returns empty array when no ## Alerts section', () => {
  const result = parseInboxAlerts(INBOX_NO_ALERTS_SECTION);
  assert.strictEqual(result.length, 0);
});

test('returns empty array for empty ## Alerts section', () => {
  const result = parseInboxAlerts(INBOX_EMPTY_ALERTS);
  assert.strictEqual(result.length, 0);
});

test('returns all matching alerts (caller handles truncation)', () => {
  const result = parseInboxAlerts(INBOX_MANY_ALERTS);
  assert.strictEqual(result.length, 5);
});
