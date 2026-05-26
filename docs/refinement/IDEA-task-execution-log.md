# IDEA: task execution log for Hansei input
**Created:** 2026-05-26
**Source:** human — observed friction in Hansei authoring: difficulties and misalignments during task execution are not captured in-context and must be reconstructed retroactively
**Status:** PROMOTED
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

**Gap resolutions (human, 2026-05-26):**

**Gap 1 — Schema completeness:**
Required fields: `ts` (ISO 8601), `task` (TASK-XXXX), `type` (enum), `msg` (≤120 chars, human-readable).
Optional fields: `context` (additional detail, e.g. failing check name or file path), `ac_ref` (which AC was involved), `resolution` (how the event was closed, filled in-place if known), `retro` (boolean, true when the event is detected at REVIEW time rather than during execution).

Event types (exhaustive — 5 types):
- `blocker` — hard stop: missing dependency, unclear spec, external system unavailable
- `review-fail` — `arch review` exited non-zero; `context` should name the failing check
- `scope-deviation` — interpretation call on an ambiguous AC, whether made in-flight or discovered at REVIEW time; use `retro: true` for the latter. Subsumes `ac-misread`: a misread is a `scope-deviation` detected retroactively, not a separate type. Rationale: the distinction is temporal, not categorical — one type with a flag is less ambiguous than two overlapping types.
- `retry` — same operation attempted 2+ times; `context` should name the operation
- `note` — any other friction worth capturing for Hansei

Full example:
```json
{ "ts": "2026-05-26T10:15Z", "task": "TASK-1029", "type": "review-fail", "msg": "HanseiReconciliation flagged undeclared any casts", "context": "drift-checker.ts:6 occurrences", "resolution": "imported TaskStatus and Hansei types" }
{ "ts": "2026-05-26T11:00Z", "task": "TASK-1029", "type": "scope-deviation", "msg": "AC path pointed to domain/services/ but file lives in application/use-cases/", "retro": true, "ac_ref": "AC2" }
```

**Gap 2 — Lifecycle hook:**
Agents append on the event, not retroactively — except `scope-deviation` with `retro: true`, which may be appended at REVIEW time when the misread is first noticed. Mandatory triggers in DO mode:
1. When `arch review` exits non-zero → `review-fail`
2. When a hard stop is encountered → `blocker`
3. When an AC interpretation decision is made in-flight → `scope-deviation`
4. On the second attempt of any operation → `retry`
5. At REVIEW time, if an AC was misread → `scope-deviation` with `retro: true`

On `scope-deviation` meta-cognition: agents are not required to recognise ambiguity in real time. If a deviation surfaces only at REVIEW, append it then with `retro: true`. The trigger is best-effort for in-flight events; retrospective append at REVIEW is an explicit fallback, not a failure mode.

**Gap 3 — File ownership:**
Per-task file at `.arch/task-logs/TASK-XXXX.jsonl`. Rationale: log is only useful for the current task's Hansei; shared file grows unbounded and complicates cleanup. The `.arch/task-logs/` subdirectory is a one-time addition.
Cleanup: agent deletes the log file immediately after writing Hansei at DONE. The Hansei is the durable artifact; the log is ephemeral scaffolding.

**Gap 4 — DO.md convention:**
A new `## Execution Logging` section in `docs/agents/DO.md` is the sole adoption surface. It must specify: when to append, the schema, the file path pattern, and the cleanup rule. No other files need updating — agents load DO.md at session start.

**Human DO mode (review concern #3):** Out of scope for this IDEA. Human operators close tasks via `arch task done` which launches the Hansei wizard — they have interactive recall and don't need a background log. Convention applies to agent sessions only; DO.md is agent-facing.

## Decision
PROMOTE → TASK-1048
[influenced-by: none]
