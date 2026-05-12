# IDEA: auto-sprint-sizing
**Created:** 2026-05-06
**Source:** User request "idea: auto sprint sizing. ARCH should help human to know the kind of tasks being done in a spring"
**Status:** DRAFT
**Sessions:** 3
**Meta:** P2 | S | local | docs/agents/DO.md, docs/METRICS.md
<!-- cli: local | claude | gemini | human -->

## Problem
When a human opens a sprint, they often assign tasks without a clear understanding of the total effort or the thematic distribution of the work. Sprints are "opened" by adding tasks, but there is no immediate feedback on whether the sprint is "too large", "too small", or skewed toward a specific class of work (e.g., all 7-operations).

## Proposed solution
1.  **Sprint Sizing Summary:** During the `Sprint Open` sequence (or via a new `arch sprint status` command), ARCH should generate a sizing report.
2.  **Composition Analysis:**
    *   **Total Effort:** Sum of estimated sizes (XS=1, S=3, M=8, L=21 - Fibonacci or similar weighting).
    *   **Thematic Breakdown:** Percentage of tasks per `Class` (e.g., 40% Code Generation, 60% Operations).
    *   **Complexity Index:** Ratio of M+ tasks vs XS/S tasks.
3.  **Human Guidance:** ARCH should output a concise "Sprint Profile" to the terminal when a sprint is opened or modified.
    *   *Example:* "Sprint 'v0.7-beta' opened. Size: 42 points (Medium-Heavy). Theme: 80% Infrastructure refactoring. Risk: High (3 L-sized tasks)."

## Dependencies
IDEA-sprint-open-protocol (Promoted)

## Estimated size
S

## Gaps
- **Sprint membership is undefined:** No canonical field marks a task as "in sprint." `Focus:yes` is a priority signal, not a sprint membership signal. The data model for "which tasks belong to this sprint" must be defined in TASK-176 (sprint-open-protocol) before sizing is possible.
- **Size weights are uncanonical:** XS=1, S=3, M=8, L=21 are proposed but not documented in TASK-FORMAT.md or METRICS.md. These must be ratified before any tooling consumes them.
- **Output coupling:** If `arch sprint status` is a new command, it conflicts with the existing session-based sprint reporting in DO.md. Decide whether to extend DO.md's Sprint Open output or add a standalone command.
- **Dependency completeness:** TASK-176 must be DONE before this IDEA can be accurately scoped. The sizing report format depends on how sprint state is persisted.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
