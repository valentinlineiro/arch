import { test } from 'node:test';
import assert from 'node:assert';
import { runInboxHygiene } from '../../main/ts/application/use-cases/inbox-hygiene.js';

const NOW = new Date('2026-05-25T12:00:00Z');
const ARCHIVED = new Set(['TASK-001', 'TASK-002', 'IDEA-old-feature']);

const AWAITING_REVIEW_INBOX = `# INBOX

## Alerts
[PATTERN-ALERT] [SpecDrift] current alert

## [AWAITING_REVIEW] TASK-001 [L3-AUTO]
**Closed:** 2026-05-20T10:00:00Z
**Title:** Some done task

| AC | Type | Pass |
|---|---|---|
| some ac | file | ✔ |

## [AWAITING_REVIEW] TASK-999 [L3-AUTO]
**Closed:** 2026-05-20T10:00:00Z
**Title:** Task still in progress

## [AWAITING_PROMOTION] IDEA-old-feature
**Decision:** PROMOTE → TASK-002
Some idea content.
`;

const PATTERN_ALERT_DEDUP_INBOX = `# INBOX

## Alerts
[PATTERN-ALERT] [SpecDrift] 8 occurrences — current
[PATTERN-ALERT] [AuditGap] 3 occurrences — current

## 2026-05-20 08:00:00 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected earlier — older

## 2026-05-22 12:00:00 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected again — middle
[PATTERN-ALERT] [AuditGap] detected earlier — older
`;

const EXPIRY_INBOX = `# INBOX

## Alerts
[ADVISORY] current-ish advisory — no date, keep

## 2026-05-01 12:00:00 — THINK Analysis
[ADVISORY] old advisory from 24 days ago
[THINK] old think entry

## 2026-05-20 12:00:00 — THINK Analysis
[ADVISORY] recent advisory — only 5 days old

## 2026-05-01 12:00:00 — Deterministic Alerts
[ANDON_HALT] TASK-XYZ — old halt entry but must never expire
[PATTERN-ALERT] [SpecDrift] old pattern alert — must never expire
`;

const CORPUS_ALERT_INBOX = `# INBOX

## 2026-04-01 12:00:00 — Corpus Alerts
[CORPUS_ALERT] old corpus alert — must not expire
`;

// ── AWAITING_REVIEW / AWAITING_PROMOTION ──────────────────────────────────

test('removes AWAITING_REVIEW section for archived task', () => {
  const result = runInboxHygiene(AWAITING_REVIEW_INBOX, ARCHIVED, NOW, 14);
  assert.ok(!result.includes('## [AWAITING_REVIEW] TASK-001'));
  assert.ok(!result.includes('Some done task'));
});

test('keeps AWAITING_REVIEW section for non-archived task', () => {
  const result = runInboxHygiene(AWAITING_REVIEW_INBOX, ARCHIVED, NOW, 14);
  assert.ok(result.includes('## [AWAITING_REVIEW] TASK-999'));
  assert.ok(result.includes('Task still in progress'));
});

test('removes AWAITING_PROMOTION section for archived idea', () => {
  const result = runInboxHygiene(AWAITING_REVIEW_INBOX, ARCHIVED, NOW, 14);
  assert.ok(!result.includes('## [AWAITING_PROMOTION] IDEA-old-feature'));
});

// ── PATTERN-ALERT deduplication ───────────────────────────────────────────

test('keeps only most recent PATTERN-ALERT per category', () => {
  const result = runInboxHygiene(PATTERN_ALERT_DEDUP_INBOX, new Set(), NOW, 14);
  const specDriftMatches = [...result.matchAll(/\[PATTERN-ALERT\] \[SpecDrift\]/g)];
  assert.strictEqual(specDriftMatches.length, 1, 'only one SpecDrift alert should remain');
});

test('keeps the most recent (current Alerts section) PATTERN-ALERT', () => {
  const result = runInboxHygiene(PATTERN_ALERT_DEDUP_INBOX, new Set(), NOW, 14);
  assert.ok(result.includes('[PATTERN-ALERT] [SpecDrift] 8 occurrences — current'));
  assert.ok(!result.includes('detected earlier'));
  assert.ok(!result.includes('detected again'));
});

test('deduplicates independently per category', () => {
  const result = runInboxHygiene(PATTERN_ALERT_DEDUP_INBOX, new Set(), NOW, 14);
  const auditGapMatches = [...result.matchAll(/\[PATTERN-ALERT\] \[AuditGap\]/g)];
  assert.strictEqual(auditGapMatches.length, 1, 'only one AuditGap alert should remain');
  assert.ok(result.includes('[PATTERN-ALERT] [AuditGap] 3 occurrences — current'));
});

// ── Non-deterministic expiry ──────────────────────────────────────────────

test('removes [ADVISORY] in dated section older than expiryDays', () => {
  const result = runInboxHygiene(EXPIRY_INBOX, new Set(), NOW, 14);
  assert.ok(!result.includes('old advisory from 24 days ago'));
});

test('removes [THINK] in dated section older than expiryDays', () => {
  const result = runInboxHygiene(EXPIRY_INBOX, new Set(), NOW, 14);
  assert.ok(!result.includes('old think entry'));
});

test('keeps [ADVISORY] in dated section within expiryDays', () => {
  const result = runInboxHygiene(EXPIRY_INBOX, new Set(), NOW, 14);
  assert.ok(result.includes('recent advisory — only 5 days old'));
});

test('keeps [ADVISORY] in undated Alerts section', () => {
  const result = runInboxHygiene(EXPIRY_INBOX, new Set(), NOW, 14);
  assert.ok(result.includes('current-ish advisory — no date, keep'));
});

// ── Deterministic alert persistence ──────────────────────────────────────

test('never removes [ANDON_HALT] regardless of age', () => {
  const result = runInboxHygiene(EXPIRY_INBOX, new Set(), NOW, 14);
  assert.ok(result.includes('[ANDON_HALT] TASK-XYZ'));
});

test('never removes [PATTERN-ALERT] by age (only deduplicates)', () => {
  const result = runInboxHygiene(EXPIRY_INBOX, new Set(), NOW, 14);
  assert.ok(result.includes('[PATTERN-ALERT] [SpecDrift] old pattern alert'));
});

test('never removes [CORPUS_ALERT] regardless of age', () => {
  const result = runInboxHygiene(CORPUS_ALERT_INBOX, new Set(), NOW, 14);
  assert.ok(result.includes('[CORPUS_ALERT] old corpus alert'));
});

// ── Edge cases ────────────────────────────────────────────────────────────

test('returns unchanged inbox when nothing to clean', () => {
  const clean = `# INBOX\n\n## Loop Status\n- READY: 5\n`;
  const result = runInboxHygiene(clean, new Set(), NOW, 14);
  assert.strictEqual(result, clean);
});

test('handles empty inbox gracefully', () => {
  assert.doesNotThrow(() => runInboxHygiene('', new Set(), NOW, 14));
});

// ── REVIEW_REQUEST cleanup ─────────────────────────────────────────────────

const REVIEW_REQUEST_INBOX = `# INBOX

## **REVIEW_REQUEST** | TASK-101 | 2026-05-20
**Task:** TASK-101 some task
**Status:** REVIEW — 5/5 ACs pass.
**Auditor action:** Verify ACs, set DONE, archive.

## REVIEW_REQUEST | TASK-102 | 2026-05-20
**Task:** TASK-102 another task
**Status:** REVIEW

## [REVIEW_REQUEST] TASK-103
**Task:** TASK-103 yet another task

## REVIEW_REQUEST TASK-104 — descriptive title
**Task:** TASK-104 inline format

## REVIEW_REQUEST | TASK-105 | 2026-05-20
**Task:** TASK-105 still open — not archived
`;

const ARCHIVED_REVIEW = new Set(['TASK-101', 'TASK-102', 'TASK-103', 'TASK-104']);

test('removes REVIEW_REQUEST section when task is archived (pipe format)', () => {
  const result = runInboxHygiene(REVIEW_REQUEST_INBOX, ARCHIVED_REVIEW, NOW, 14);
  assert.ok(!result.includes('TASK-101'), 'TASK-101 is archived — its REVIEW_REQUEST must be removed');
});

test('removes REVIEW_REQUEST section when task is archived (bold pipe format)', () => {
  const result = runInboxHygiene(REVIEW_REQUEST_INBOX, ARCHIVED_REVIEW, NOW, 14);
  assert.ok(!result.includes('TASK-102'), 'TASK-102 is archived — its REVIEW_REQUEST must be removed');
});

test('removes REVIEW_REQUEST section when task is archived (bracket format)', () => {
  const result = runInboxHygiene(REVIEW_REQUEST_INBOX, ARCHIVED_REVIEW, NOW, 14);
  assert.ok(!result.includes('TASK-103'), 'TASK-103 is archived — its REVIEW_REQUEST must be removed');
});

test('removes REVIEW_REQUEST section when task is archived (inline title format)', () => {
  const result = runInboxHygiene(REVIEW_REQUEST_INBOX, ARCHIVED_REVIEW, NOW, 14);
  assert.ok(!result.includes('TASK-104'), 'TASK-104 is archived — its REVIEW_REQUEST must be removed');
});

test('keeps REVIEW_REQUEST section when task is NOT archived', () => {
  const result = runInboxHygiene(REVIEW_REQUEST_INBOX, ARCHIVED_REVIEW, NOW, 14);
  assert.ok(result.includes('TASK-105'), 'TASK-105 is not archived — its REVIEW_REQUEST must be kept');
});

// ── Inline REVIEW_REQUEST body blocks ─────────────────────────────────────

const INLINE_REVIEW_REQUEST_INBOX = `# INBOX

## Some Section

---
**REVIEW_REQUEST** | TASK-201 | 2026-05-20
Task: Archived task — should be removed
ACs verified: all pass

---
**REVIEW_REQUEST** | TASK-202 | 2026-05-20
Task: Also archived — should be removed

---
**REVIEW_REQUEST** | TASK-203 | 2026-05-20
Task: NOT archived — must stay

---
`;

const ARCHIVED_INLINE = new Set(['TASK-201', 'TASK-202']);

test('removes inline REVIEW_REQUEST body block when task is archived', () => {
  const result = runInboxHygiene(INLINE_REVIEW_REQUEST_INBOX, ARCHIVED_INLINE, NOW, 14);
  assert.ok(!result.includes('TASK-201'), 'TASK-201 is archived — inline block must be removed');
  assert.ok(!result.includes('TASK-202'), 'TASK-202 is archived — inline block must be removed');
});

test('keeps inline REVIEW_REQUEST body block when task is NOT archived', () => {
  const result = runInboxHygiene(INLINE_REVIEW_REQUEST_INBOX, ARCHIVED_INLINE, NOW, 14);
  assert.ok(result.includes('TASK-203'), 'TASK-203 is not archived — inline block must be kept');
});

test('does not leave orphan --- separators after removing inline blocks', () => {
  const result = runInboxHygiene(INLINE_REVIEW_REQUEST_INBOX, ARCHIVED_INLINE, NOW, 14);
  const lines = result.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() === '---' && lines[i + 1].trim() === '---') {
      assert.fail('Consecutive --- separators found at lines ' + i + ' and ' + (i + 1));
    }
  }
});
