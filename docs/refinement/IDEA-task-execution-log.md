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

**Sessions:** 1

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

**Constraint evaluation (THINK, 2026-05-26):**
- Dependency ordering: PASS — no hard dependencies; optional benefit from friction measurement can be added later
- Temporal validity: PASS — problem exists now; solution does not require future data
- Abstraction layer: PASS — convention change for DO mode, not a new system layer
- Observability validity: PASS — execution events are observable in the moment; schema is minimal and verifiable
- Priority displacement: PASS — P2/S correctly sized; improves Hansei quality without displacing higher-priority work

**Admissibility:** Structurally admissible on all 5 axes.

**Open gaps for promotion:**
1. Schema completeness: required vs optional fields in the event schema need specification before implementation
2. Lifecycle hook: which point in DO mode triggers the append? After each arch review failure? After scope deviation decisions?
3. File ownership: per-task `.arch/task-logs/TASK-XXXX.jsonl` vs shared single file — affects cleanup protocol at task close
4. README convention: DO.md needs a new section describing the logging convention before agents can adopt it

## Decision
<!-- REJECT: <one-line rationale>                    — no THINK evaluation required. Write it now. -->
<!-- PROMOTE → TASK-XXX                              — commits to execution. THINK evaluation expected. -->
<!-- EXTEND: <specific gap or dependency> until <event that triggers re-evaluation> — costs more than REJECT. -->
