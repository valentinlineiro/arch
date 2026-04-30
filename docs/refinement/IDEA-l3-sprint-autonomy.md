# IDEA: L3 Sprint Autonomy — arch loop scoped to a sprint
**Created:** 2026-04-30
**Source:** Autonomous loop architecture — Level 3 "Pilot Mode"; agent executes full sprint without per-task human triggers
**Status:** DRAFT
**Meta:** P2 | M | local | cli/src/, docs/guidelines/autonomy.md, docs/GOVERNANCE.md, arch.config.json

## Problem
Level 2 autonomy (current) means the agent executes one task at a time with human re-triggering between tasks. Level 3 would let the human define a sprint goal and have the agent autonomously work through all tasks in that sprint — stopping only at Andon Cord conditions or INBOX checkpoints. This is the difference between "supervised task execution" and "supervised sprint execution."

## Proposed solution
L3 is `arch loop --sprint <slug>` with sprint-scoped HITL gates:

**Scope:** The loop only picks up tasks tagged `**Sprint:** sprint/<slug>`. Tasks outside the sprint are not touched regardless of priority.

**Sprint-level checkpoints (in addition to task-level Andon Cord):**
- If > 2 tasks in the sprint hit Andon Cord conditions, halt the entire sprint and escalate — don't continue with remaining tasks.
- At sprint midpoint (50% of tasks archived), write a mid-sprint summary to INBOX for async human review before continuing.

**Governance update:** Add L3 entry to `docs/guidelines/autonomy.md` and `docs/GOVERNANCE.md` defining which categories allow sprint-level autonomy (operations and writing only in the initial pilot; code-generation requires explicit human opt-in per sprint).

**Exit condition:** Sprint ends when all tagged tasks are DONE and archived, or when an unresolvable Andon Cord halt occurs.

## Dependencies
- IDEA-arch-loop-engine (L3 is `arch loop --sprint`; requires the base loop first)
- IDEA-andon-cord (sprint-level halt escalates task-level Andon Cord conditions)
- IDEA-inbox-regeneration-protocol (mid-sprint summary written to INBOX)

## Estimated size
M

## Gaps
- Define "sprint midpoint" precisely for sprints with an odd number of tasks.
- Decide initial L3-eligible task classes (ops/writing only vs broader).

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
