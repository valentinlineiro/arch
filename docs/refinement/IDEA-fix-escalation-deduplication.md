# IDEA: fix-escalation-deduplication
**Decision-required:** yes
**Created:** 2026-05-22
**Source:** ARCH protocol review — .arch/escalations.jsonl has massive duplicate record storm
**Status:** DRAFT
Sessions: 3

## Problem

The protocol says (AGENTS.md): "Do not read `.arch/escalations.jsonl` first — always append." This creates systemic deduplication failure. The file contains ~200 records where the same IDEA subjects appear 5–10+ times. Example: `IDEA-architectural-tension-capture` appears with `status: "OPEN"` across multiple timestamps plus multiple `RESOLVED` phantom-cleanup entries.

This makes the escalation store useless as a source of truth — you can't tell which entries are live without scanning the entire file and deduplicating manually. The "always append, never read" rule ensures the file grows monotonically with duplicate noise.

## Proposed solution

Introduce an idempotency key scheme: before appending, check if an OPEN record already exists for the same `(subject, type)` pair within the last N hours. If yes, skip the append. This requires reading the file but is deterministic (read last 100 lines, grep for subject + OPEN).

Two options:

**Option A (lightweight):** Read only the last N lines of the file (e.g., tail -100), check for matching `(subject, type, status=OPEN)`. If found, skip. This bounds the read cost to O(1) and is trivially implemented without a database.

**Option B (full resolution):** Change the protocol to allow reading the full file and resolving duplicates on append. Combine with a periodic compaction script that consolidates OPEN entries for the same subject into the most recent record.

Recommendation: **Option A** — preserves the "no complex state" ethos while fixing the noise problem.

## Dependencies
None.

## Estimated size
S — impacts THINK.md Phase 1 step 4 and potentially the CLI.

## Gaps

## Decision
