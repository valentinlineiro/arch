# IDEA: task execution log for Hansei input
**Created:** 2026-05-26
**Source:** human — observed friction in Hansei authoring: difficulties and misalignments during task execution are not captured in-context and must be reconstructed retroactively
**Status:** DRAFT
**Meta:** P2 | S | human | hansei

## Problem
When an agent writes a Hansei section at task close, it relies on memory of what went wrong during execution. This is unreliable: blockers hit mid-task, unexpected scope changes, retried arch review failures, and AC misreadings are all gone by the time the task reaches REVIEW. The result is either vague Hansei prose ("encountered some friction") or a H3b/H2 that undersells the actual severity.

## Proposed solution
Agents append structured entries to a per-task execution log (e.g., `.arch/task-logs/TASK-XXXX.jsonl`) as events occur during DO mode. Logged events would include: blockers hit, arch review failures, scope ambiguity decisions, retries, and any deviation from the original AC plan. At close time, the DO agent reads this log to populate Hansei accurately. THINK and the Auditor can also reference it.

Possible event schema:
```json
{ "ts": "<ISO>", "task": "TASK-XXXX", "type": "blocker|review-fail|scope-deviation|retry|note", "msg": "...", "context": "..." }
```

The log file is ephemeral for the task lifecycle — archived alongside the task or discarded at DONE.

## Dependencies
None hard. Optionally benefits from IDEA-friction-measurement-instrumentation (shared event vocabulary).

## Estimated size
S — new convention + DO.md instruction update + optional `arch` CLI hook to read/write the log. No parser changes required if log is JSONL in a known path.

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- REJECT: <one-line rationale>                    — no THINK evaluation required. Write it now. -->
<!-- PROMOTE → TASK-XXX                              — commits to execution. THINK evaluation expected. -->
<!-- EXTEND: <specific gap or dependency> until <event that triggers re-evaluation> — costs more than REJECT. -->
