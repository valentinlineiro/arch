# IDEA: Periodic architecture revision for continuous efficiency
**Created:** 2026-04-29T08:48:00Z
**Source:** human
**Status:** DRAFT
**Meta:** P1 | S | claude | process

## Problem
ARCH is designed for continuous Kaizen, but without a scheduled revision, efficiency improvements may happen ad-hoc or not at all. The system needs a guaranteed periodic checkpoint to cut unnecessary steps and simplify usage.

## Proposed solution
1. Add a scheduled trigger (e.g., weekly or bi-weekly) to run a focused "Architecture Revision" mode
2. This revision should:
   - Audit all recent tasks for patterns of unnecessary steps
   - Review CLI commands for consolidation opportunities
   - Simplify documentation that has grown complex
   - Identify friction from task Cost/Steps metrics (once implemented)
3. Output a revision report with specific proposals for streamlining

## Dependencies
- IDEA-task-metrics (for cost/steps data) — optional enhancement
- None blocking

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->