# IDEA: Autonomous loop — arch operating by itself with human-in-the-loop gates
**Created:** 2026-04-28
**Source:** Human request — desire for arch to self-sustain via CI with controlled human checkpoints
**Status:** DRAFT
**Meta:** P1 | M | 7-operations | .github/workflows/, scripts/arch.sh, docs/agents/

## Problem
Currently arch is entirely human-triggered: a person must run `arch conduct`, `arch review`, or `arch exec` for anything to happen. There is no self-sustaining loop. Work stalls when the human is away, backlogs go unassessed, and THINK mode is only as frequent as the human remembers to invoke it.

## Proposed solution
Define a minimal autonomous loop with clear human-in-the-loop gates:

### Loop anatomy

```
[CI schedule / push trigger]
        │
        ▼
   arch conduct          ← THINK mode: assess, refine, replenish backlog
        │
        ├─ output: ephemeral report (terminal / CI log)
        ├─ autonomous promotions (L2 autonomy: XS ops/writing IDEAs only)
        └─ opens PR if any file changed
                │
                ▼
        [Human gate]     ← review THINK output, approve/reject PR
                │
      approved? │
                ▼
          arch exec      ← DO mode: implement the focused task
                │
                └─ opens PR with implementation
                        │
                        ▼
                [Human gate]  ← code review, merge
                        │
                      merged
                        │
                        ▼
                  arch review  ← post-merge integrity check
                        │
                     passed? → loop back to conduct
```

### CI trigger points
1. **Scheduled conduct** — cron (e.g. daily or on each push to main) runs `arch conduct` in CI. Output posted as PR or CI summary.
2. **On PR merge** — triggers `arch review` automatically.
3. **Manual exec** — human approves a task and triggers `arch exec` (via workflow dispatch or label on PR).

### Human-in-the-loop positions
- After THINK: human reviews the report and any auto-promoted tasks before exec runs.
- After DO: standard PR review and merge approval.
- Escape hatch: human can always push directly, skip conduct, or override autonomy level.

### Autonomy levels preserved
Existing L2 autonomy rules (only XS ops/writing IDEAs can be auto-promoted) must be enforced in CI the same way they are locally.

## Dependencies
- IDEA-pluggable-cli-registry (conduct/exec need stable headless invocation before wiring to CI)

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
