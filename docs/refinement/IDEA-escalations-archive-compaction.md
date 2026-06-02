# IDEA: Escalations archive compaction — prune old RESOLVED records from escalations.jsonl

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** THINK replenishment — .arch/escalations.jsonl has 195+ lines, mostly RESOLVED phantom entries from May 19 cleanup. Every read wastes context on irrelevant history.
**Candidate-class:** 7-operations
**Candidate-size:** S

## Problem

`.arch/escalations.jsonl` contains ~150 RESOLVED records from the May 19, 2026 phantom escalation cleanup. These records are never read by any process (RESOLVED entries are skipped) but pollute every file read and waste context budget. The file is currently 195+ lines, ~85% of which are irrelevant historical cleanup records.

TASK-1081 switches the write mechanism to upsert but does not address the existing data pollution.

## Proposed solution

Add an `arch govern` side-effect or standalone `arch esac clean` subcommand that:
1. Reads `.arch/escalations.jsonl`
2. Moves all records with `status: "RESOLVED"` and `timestamp` before a cutoff date (e.g., current date - 30 days) to `.arch/escalations-archive.jsonl`
3. Writes only active records back to the main file
4. Is safe to run repeatedly (idempotent)

An alternative lightweight approach: add a one-line filter in the read path that skips RESOLVED records older than 30 days. This avoids data migration and makes the archive implicit.

## Validation hints

- `.arch/escalations.jsonl` after cleanup has < 50 lines (only OPEN records)
- Archived records are preserved in `.arch/escalations-archive.jsonl`
- `npm test` passes
- `arch review` passes

## Dependencies

None — purely operational, no ADR required.

## Sessions: 2

## Decision

REJECT — Subsumed by TASK-1081 (upsert semantics for escalations.jsonl). TASK-1081 addresses the root cause; compaction of existing records falls within its scope. Implementing separately risks conflicting write paths during TASK-1081 execution.
