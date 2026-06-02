# IDEA: Guideline — distinguish human-written vs agent-written Decision fields

**Status:** DRAFT
**Created:** 2026-05-28
**Source:** smartcart-os THINK Phase 3 — autonomy.md L2 rule requires human-written Decision but has no detection mechanism; confirmed as finding #8 in ARCH audit 2026-05-22 ("trivially scoped PROMOTE exemption undefined")
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** none

## Problem

`docs/guidelines/autonomy.md` states the human must have written the `PROMOTE → TASK-XXX` Decision field before an agent may self-promote. In practice, THINK sessions write `Decision: PROMOTE → TASK-XXX` during analysis. A subsequent THINK session cannot distinguish whether that Decision was written by a human or a prior agent — making the L2 rule unenforceable as written. The same gap exists for `arch init` IDEA promotion and any agent operating under the L2 autonomy rule.

## Proposed fix

Add to `autonomy.md`:

> A Decision field is **human-written** if and only if the commit introducing the `Decision:` line does NOT carry a `[THINK]` or `[DO]` tag in its message. Agents may only write `Decision: (proposed: PROMOTE → TASK-XXX — awaiting human confirmation)` as a non-binding suggestion. The binding `Decision: PROMOTE → TASK-XXX` form is reserved for human authors.

Update `docs/agents/THINK.md` to prohibit binding Decision writes. Update `docs/agents/DO.md` if the same pattern appears there.

## Acceptance Criteria

- [ ] `docs/guidelines/autonomy.md` updated with human-authorship detection rule
- [ ] `docs/agents/THINK.md` updated: THINK may only write `Decision: (proposed: ...)` not `Decision: PROMOTE → ...`
- [ ] `docs/agents/DO.md` checked and updated if needed
- [ ] `arch review` passes

## Sessions: 1

## Decision

PROMOTE → TASK-1086
