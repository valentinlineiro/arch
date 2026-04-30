# IDEA: Add turns-per-size metric to METRICS.md (Mura / unevenness detection)
**Created:** 2026-04-30
**Source:** Human proposal (Mura — unevenness waste) — METRICS.md tracks tasks and cycle time but not execution depth per size tier
**Status:** DRAFT
**Meta:** P2 | S | local | docs/METRICS.md, docs/agents/THINK.md

## Problem
METRICS.md tracks closed task count and cycle time, but not how many turns (agent interactions) each task consumed relative to its declared size. An S task that takes 40 turns is a Mura signal — the size estimate was wrong, the task was underspecified, or the agent hit unexpected complexity. Without this metric, sizing accuracy is only measured by outcome (estimated vs actual), not by execution depth.

## Proposed solution
Add a `Turns` field to the task Meta line (optional, filled at close):

```
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/ | Turns:12
```

Add a "Turns-per-Size" table to the `METRICS.md` sprint template:

| Size | Expected turns | Actual avg | Delta |
|------|---------------|------------|-------|
| XS   | 1–5           | —          | —     |
| S    | 5–15          | —          | —     |
| M    | 15–30         | —          | —     |
| L    | 30–60         | —          | —     |

THINK Phase 3 reads Turns fields from the last 10 archived tasks and flags any size tier where actual avg exceeds expected by >50% as a `[MURA]` signal, proposing a sizing recalibration task.

## Dependencies
IDEA-hansei-reflection-on-done-tasks (both enrich the close step — natural to implement together).

## Estimated size
S

## Gaps
- Define "turn" precisely: one human message + agent response cycle, or each tool call?
- Decide whether Turns is self-reported by the agent or derived from session metadata.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
