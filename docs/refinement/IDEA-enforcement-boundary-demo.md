# IDEA: Enforcement boundary demo moment
**Created:** 2026-05-25
**Source:** Product strategy discussion
**Status:** DRAFT
**Meta:** P0 | S | local | docs/refinement/

## Problem
The marketing guarantee — "ARCH is the only tool that guarantees your AI cannot corrupt your project state, because the AI literally cannot enforce its own suggestions" — is specific and true, but the current `arch init` flow does not demonstrate it. Showing `arch review` findings demonstrates detection. The guarantee is about enforcement separation: the AI is structurally blocked from enforcing, not procedurally asked not to. Without a demo moment where the user *sees* the block, the one-liner is a claim, not evidence. The already-burned user has heard claims before.

## Proposed solution
During the `arch init` walkthrough, stage a concrete enforcement moment: simulate (or instrument) an AI agent attempting to commit a change that violates a governance rule, and show the pre-commit hook blocking it with a plain-language explanation of why. The block must be structural — the hook fires regardless of LLM output — and the explanation must name the mechanism: "This was blocked by `arch review`, not by asking the AI to stop." If the user has an existing AI agent integration (detected during init scan), use a real violation from their repo rather than a simulation. The user should leave the init flow having seen the boundary hold, not just having read that it exists.

## Dependencies
- IDEA-plg-onboarding-flow (this moment lives inside the init walkthrough)

## Estimated size
S

## Gaps

## Decision
PROMOTE → TASK-1026. Unblocked, S-sized, highest ROI per engineering day in the set. The demo moment converts the marketing claim ("structurally blocked, not procedurally asked") from assertion to evidence. Ship first — this is the most important moment in the acquisition loop.
