# IDEA: Operational load tracking — model cognitive load, WIP, fatigue, and rework
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DEFERRED
**Meta:** P3 | M | claude-code | docs/METRICS.md, cli/src/main/ts/

## Problem
ARCH models tasks as units of work but ignores the human reality of cognitive load. WIP accumulation, context-switching cost, fatigue cycles, and rework are invisible to the system. Productivity is treated as linear throughput when it is not.

## Proposed solution
Extend METRICS.md and task metadata to track operational load signals:
- WIP count and trend (tasks simultaneously IN_PROGRESS)
- Cognitive cost per task (derived from size × class × context switches)
- Rework rate (tasks that hit REVIEW_FAIL or required re-opening)
- Recovery cycles (time between high-load sessions and next productive session)

`arch review` warns when WIP exceeds a configured threshold. THINK mode incorporates load metrics into sprint replenishment recommendations.

## Rationale
Productivity is not throughput. A system that pushes more tasks into IN_PROGRESS when WIP is already high will produce rework, not output. Modeling operational load turns ARCH from a task tracker into a sustainable work system — necessary for household, personal, and startup use cases where energy is the real constraint.

## Related IDEAs
- [IDEA-mura-turns-per-size-metric.md](IDEA-mura-turns-per-size-metric.md) — related efficiency metric

## Dependencies
None.

## Estimated size
M

## Gaps

## Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites (signal corpus, arch ask compounding).

### Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites (signal corpus, arch ask compounding). Re-evaluate when READY count drops below 5 or Phase B reaches 50%.
