# IDEA: ARCH needs a validated first-external-adopter path

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** Strategic — smartcart-os was a controlled pilot (same person, maximum charity)
**Candidate-class:** 6-writing
**Candidate-size:** S
**Depends:** TASK-1080
**Decision:** Pending human review.

## Problem

ARCH has one pilot: smartcart-os. Same developer, same mental model, maximum charity to the tool. This is not external validation. The true test is a second team or developer who encounters ARCH cold and decides whether the governance overhead is worth the value within their first session.

That test hasn't happened. Until it does, every design decision is based on one data point.

## Proposed Solution

A structured external pilot program:

1. **Target profile** — one developer or team with an active TypeScript project, no prior ARCH exposure, willing to spend 2 hours trying it
2. **Entry point** — arch init with archProfile:minimal (TASK-1080 must ship first), a 5-minute getting started guide, and a feedback form wired to ARCH's own corpus federation
3. **Success criteria** — they capture 3 tasks and close 1 without asking for help. That's the minimum viable governance loop.
4. **Failure mode logging** — every place they get stuck, every error message they see, every command that confused them → IDEA files in ARCH's own refinement queue

The output is not testimonials. The output is a set of ARCH IDEAs that couldn't have been generated from internal use.

## Validation hints

- One external developer closes a task using arch task done without human guidance
- At least 3 new IDEAs filed from the pilot that weren't previously identified
- arch init with archProfile:minimal completes in under 2 minutes for a cold user
