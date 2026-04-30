# IDEA: Probabilistic trust model — earned autonomy via historical success rate
**Created:** 2026-04-30
**Source:** Strategic vision — L1/L2/L3/L4 levels are binary declarations; real trust is statistical and task-specific
**Status:** DRAFT
**Meta:** P2 | L | local | docs/guidelines/autonomy.md, docs/GOVERNANCE.md, docs/METRICS.md, arch.config.json

## Problem
The current L1–L4 autonomy levels are declared, not earned. A task class is either "agent can auto-approve" or "requires human." In practice, trust is statistical: an agent might have a 95% success rate on XS ops tasks and a 58% rate on M code tasks — those should attract different approval requirements automatically. The binary model is too coarse and requires manual recalibration rather than adapting from evidence.

## Proposed solution
Track a `successRate` per agent × task class × size tier in `docs/METRICS.md`. Each archived task contributes one data point: pass (all ACs met, arch review OK) or fail (Andon Cord triggered, human override required).

Auto-approval thresholds in `arch.config.json`:
```json
"trustThresholds": {
  "autoApprove": 0.90,
  "requireReview": 0.70,
  "requireHuman": 0.0
}
```

If an agent's success rate for a given class/size exceeds `autoApprove`, the Auditor step is skipped. Below `requireReview`, the Auditor runs. Below `requireHuman`, the loop halts for explicit approval. Trust degrades automatically if recent failures spike.

## Dependencies
IDEA-hansei-reflection-on-done-tasks (pass/fail signal comes from the close step).
TASK-142 (Auditor role must exist before it can be conditionally skipped).

## Estimated size
L — must be decomposed before entering READY.

## Gaps
- Define minimum sample size before trust score is considered reliable (e.g. 10 tasks).
- Decide decay function: does a failure 50 tasks ago count as much as one 5 tasks ago?
- Define what happens when trust score is undefined (new agent, new class) — default to human approval.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
