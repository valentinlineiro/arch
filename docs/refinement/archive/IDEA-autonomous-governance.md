# IDEA: Autonomous governance - self-balancing loop without human interaction
**Created:** 2026-04-28
**Source:** Human request — ARCH should prioritize, execute, and replenish autonomously, avoiding starvation
**Status:** PROMOTED → TASK-102
**Meta:** P1 | M | 7-operations | docs/agents/THINK.md, docs/agents/DO.md, .github/workflows/

## Problem
ARCH currently requires human intervention at every decision point: which task to focus, when to conduct, when to exec. Without active human steering, the backlog stagnates, critical tasks wait alongside P3 noise, and no new work surfaces. The system cannot sustain itself — it starves when the human is absent.

## Proposed solution
Define a governance layer that runs the full cycle autonomously, using priority rules and cycle-based triggers to self-balance:

### Governance rules

**Rule 1 — Critical first**
If any P0 task is READY, the next exec cycle MUST target it. No P1+ task may be picked while a P0 exists. This is a hard constraint, not a suggestion.

**Rule 2 — Replenishment before starvation**
Before each exec cycle, check READY count. If READY < 3, run a conduct cycle first. Do not exec until the backlog is replenished or conduct confirms no new tasks can be generated.

**Rule 3 — Conduct cadence**
Run conduct automatically after every N exec cycles (default N=3), regardless of backlog depth. This prevents the backlog from decaying silently — new patterns are detected, kaizen proposals surface, and the system stays current.

**Rule 4 — Focus rotation**
After each exec cycle completes (task → DONE), clear Focus:yes and let governance pick the next task by priority order. No human needed to advance the queue.

**Rule 5 — Starvation detection**
If a READY P1 task has not been picked for more than K conduct cycles (default K=5), escalate it to P0 automatically and log a `[GOVERNANCE]` kaizen entry.

### Cycle loop (fully autonomous)

```
governance tick
  │
  ├─ READY < 3? → conduct first
  │
  ├─ P0 exists? → exec P0
  │
  ├─ exec_count % N == 0? → conduct
  │
  ├─ exec focused task (highest priority READY)
  │
  ├─ task → DONE → clear Focus:yes
  │
  └─ repeat
```

### Human-in-the-loop escape hatches (preserved)
- Human can override Focus:yes at any time to redirect governance.
- Human can set a task to BLOCKED to remove it from governance pick.
- Governance never merges PRs — that gate stays human.
- Governance never promotes beyond L2 autonomy rules.

## Dependencies
- TASK-087 (auto-create bug task on review failure) — governance needs review integrated into the cycle.
- TASK-088 (autonomous loop - CI workflows) — governance is the policy layer on top of the CI triggers defined there.

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
