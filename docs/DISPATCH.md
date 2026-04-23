# DISPATCH.md
Generated: 2026-04-23T12:00:00Z
Sprint: 1 | Health: 🟢 GREEN

## Immediate actions (human required)
- [x] **Status drift investigation** — Pre-retro flag in RETRO.md notes tasks not reflecting actual state and missing HUMAN mode invocations. Audit: confirm no IN_PROGRESS locks were left unclosed in past sessions, and that the HUMAN agent was invoked for every status transition. — Urgency: this sprint — **Result:** No drift detected. All status transitions follow HUMAN protocol. No unclosed locks.

## Agent invocations (ready to run)
Ordered by priority. TASK-010 (P0) blocks on TASK-004 — run TASK-004 first.

1. **codex exec TASK-004** — context: agents/EXEC.md + SPRINT.md#TASK-004 + scripts/arch-install.sh — reason: P1 unblocked; TASK-010 (P0, `arch` CLI) cannot start until this is DONE.
2. **claude exec TASK-016** — context: agents/EXEC.md + SPRINT.md#TASK-016 — reason: P1, XS effort; hardens EXEC protocol so agents always commit before REVIEW.
3. **claude exec TASK-005** — context: agents/EXEC.md + SPRINT.md#TASK-005 + all docs/agents/*.md — reason: P1 audit; validates token budgets across all modes, patches over-budget protocols.
4. **claude exec TASK-011** — context: agents/EXEC.md + SPRINT.md#TASK-011 + docs/agents/HUMAN.md + git log — reason: P2; CHANGELOG backfill + wires changelog step into HUMAN protocol.
5. **codex exec TASK-010** — context: agents/EXEC.md + SPRINT.md#TASK-010 + scripts/arch-install.sh + TASK-004 output — reason: P0 `arch` CLI; start only after TASK-004 is DONE.

## Maintenance actions
- SPRINT.md header declares "Committed: 8 tasks" but the active tasks section contains 10 entries (TASK-011 and TASK-016 were added to sprint after initial commit). Update the committed count to 10 — human or HUMAN agent can patch this with a one-line edit.

## Flags for next planning session
- TASK-007 (first real RETRO) depends on TASK-004 and TASK-005 being DONE — keep this in view as sprint progresses; if those slip past mid-sprint, RETRO will be delayed.
- TASK-010 is P0 but sits behind TASK-004 (P1). If TASK-004 encounters scope growth, escalate TASK-010 timeline immediately.
