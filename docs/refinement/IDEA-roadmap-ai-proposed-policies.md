# IDEA: AI-proposed policies — ARCH detects patterns and proposes guidelines for human approval
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P2 | M | claude-code | docs/refinement/, docs/guidelines/

## Problem
Guidelines are written reactively — after a failure has already occurred and been codified in KAIZEN-LOG. ARCH has enough operational history to detect recurring failure patterns proactively, but there is no mechanism to surface them as proposed rules.

## Proposed solution
During THINK mode, ARCH analyzes retros, KAIZEN-LOG, and task failure patterns. When it detects a recurring failure class (e.g., 7 auth tasks failed REVIEW for the same reason), it generates a proposed guideline and places it in `docs/refinement/` as an IDEA with `Source: AI-pattern-detection`:

```
Detected: 7 auth tasks failed REVIEW due to missing input validation at service boundary.
Suggested guideline: Validate auth payload schema before persistence.
Proposed as: IDEA-ai-policy-auth-validation-boundary.md
```

The AI never imposes rules. It proposes. The human reviews the IDEA and decides to PROMOTE → GUIDELINE or REJECT. This maintains full human control while enabling compounding learning.

## Rationale
The goal is compounding governance — the system learns from failures and proposes structural responses. Human control is preserved: the AI detects, proposes, and explains; the human decides. This is the operational definition of "human+AI collaborative work" applied to the governance layer itself.

## Related IDEAs
- [IDEA-do-step-registry-for-kaizen.md](IDEA-do-step-registry-for-kaizen.md) — related Kaizen automation surface

## Dependencies
IDEA-roadmap-memory-queries (pattern analysis infrastructure).

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
