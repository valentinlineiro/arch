# IDEA: Corpus is backward-looking — ARCH records but does not reason

**Status:** DEFERRED
**Created:** 2026-06-02
**Source:** Strategic — arch ask returns low-confidence results despite 468+ task corpus
**Candidate-class:** 1-code-reasoning
**Candidate-size:** M
**Depends:** none
**Decision:** DEFERRED — right direction, premature. Condition: corpus confidence scores remain below 60% after 600+ archived tasks with no structural improvement.

## Problem

ARCH generates history — 468 tasks, 36 ADRs, Hansei entries on every closure. But querying that history returns low-confidence results. The corpus is an append-only log, not a knowledge base. arch ask can surface entries but cannot reason: "given the pattern of failures on drift-checker.ts, what is the risk of touching it again?" or "which file in this repo has the highest regression probability based on past Hanseis?"

## Proposed Solution

A THINK-level reasoning layer that operates on the corpus as structured data, not just text:

1. **Pattern index** — maintain a machine-readable index of: files touched per task, Hansei categories per file, regression count per file. Updated on each govern tick.
2. **Risk surface** — `arch risk <file>` returns: how many times touched, what categories of issues, whether any task was force-closed, current regression probability score.
3. **Proactive alerts** — when a task's context path overlaps with a high-risk file, emit a CORPUS_ALERT before the task starts: "TASK-XXX touches payments.ts which has 3 TypeHack Hanseis and 1 regression in the last 60 days."

This changes the corpus from an audit trail to a predictive tool.

## Validation hints

- arch risk drift-checker.ts returns non-trivial output given its history
- High-risk file touched by a new task triggers proactive CORPUS_ALERT
- Pattern index is updated deterministically on each govern tick
