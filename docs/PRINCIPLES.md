# PRINCIPLES.md
<!-- Durable institutional principles distilled from KAIZEN-LOG -->
<!-- Source entries are kept in KAIZEN-LOG.md for full auditability -->
<!-- Status: ACTIVE | SUPERSEDED -->

---

## P-001: Register every violation formally

**Source:** KAIZEN-LOG — "Bugs without formal registration" (Sprint 3)
**Status:** ACTIVE
**Rule:** Any WARN from `arch check`, or any detected misalignment, must create a bug task in `docs/tasks/` before the session ends. Detection without registration is noise.
**Rationale:** Ad-hoc bug fixes without a task record are invisible to future agents and cannot be tracked for recurrence. Formal registration is what turns a one-off fix into a hardening signal.

---

## P-002: When deleting an artifact, scan for references

**Source:** KAIZEN-LOG — "Legacy tasks with stale dependencies" (Sprint 3)
**Status:** ACTIVE
**Rule:** Before removing or renaming any file, run a grep for its path or name across `docs/` and task files. Update or remove every reference in the same commit.
**Rationale:** Stale references accumulate silently and mislead agents in future sessions. The deletion commit is the only moment when the full impact is visible and cheap to fix.

---

## P-003: Quality gates must be machine-enforced, not conventional

**Source:** KAIZEN-LOG — "`arch check` does not validate ACs before archiving" (Sprint 3)
**Status:** ACTIVE
**Rule:** Any intended gate (AC completion, no-merge policy, format validity) must produce a non-zero exit from `arch check` or a pre-commit hook. A gate enforced only by convention will eventually be skipped under velocity pressure.
**Rationale:** TASK-031 was archived DONE with unchecked ACs. The detection lag was one full session. Machine enforcement closes the gap to zero.

---

## P-004: Coordination surfaces must reflect actual state

**Source:** KAIZEN-LOG — "Decision Blindness" (Sprint 3); TASK-187 (stale INBOX, 2026-05-04)
**Status:** ACTIVE
**Rule:** `docs/INBOX.md` and task statuses must be updated atomically with the state change they reflect. A coordination surface that lags reality is worse than no surface — it actively misleads.
**Rationale:** INBOX showed TASK-172 and TASK-173 as active after both were archived DONE. Agents and humans reading the surface made decisions on false state. Toyota-style visual management is only valuable when it is live.

---

## P-005: Completed tasks must be archived immediately

**Source:** KAIZEN-LOG — "Completed Task Stagnation" (Sprint 5)
**Status:** ACTIVE
**Rule:** A task marked DONE must be moved to `docs/archive/` in the same session. No DONE task should remain in `docs/tasks/` past the session that completed it.
**Rationale:** DONE tasks in the active directory inflate perceived backlog, consume context budget, and create ambiguity about what is truly in flight. Immediate archival keeps the active view signal-rich.
