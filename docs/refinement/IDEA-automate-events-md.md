# IDEA: EVENTS.md should be machine-generated, not human-maintained

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Protocol audit — 401 lines, largest protocol doc, nobody reads it for guidance
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

EVENTS.md is 401 lines — the largest protocol document — recording architectural events with dates. It's valuable as historical record. It's zero value as a document you read for guidance. It's been append-only for months and grows every session. Maintaining it manually adds friction with no behavioral value. The raw material (git log, closed tasks, Hansei corpus) already contains the same information.

## Proposed solution

1. Archive the current EVENTS.md to docs/archive/EVENTS-2026-05.md
2. Replace with a thin, machine-generated EVENTS.md — `arch govern report` generates a rolling last-30-days chronicle from git log and the task archive
3. The generated file is not human-edited — purely a derived view

## Validation hints

- arch govern report generates EVENTS.md from git log + archive
- Current EVENTS.md content preserved in archive
- New EVENTS.md is ≤ 50 lines (rolling window)
