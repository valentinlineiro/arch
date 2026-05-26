# IDEA: Progressive CLI surface — depth graduates on demand
**Created:** 2026-05-25
**Source:** Product strategy discussion
**Status:** DRAFT
**Meta:** P0 | M | local | docs/refinement/

## Problem
ARCH currently exposes ~30 commands and ~15 document types at first contact. This complexity is a retention moat presented as an acquisition wall. A new user running `arch help` sees the full system and has no signal for where to start. The depth that makes ARCH powerful for experienced users actively repels users who haven't yet experienced the value.

## Proposed solution
Restructure the CLI surface into tiers that graduate on demand:

**Day 1 (always visible):** `init`, `review`, `task capture` — three commands, one document type (the task). These cover the full acquisition loop.

**Tier 2 (surfaces after first task is closed):** `govern`, `analyze`, `task done` — governance and lifecycle commands. Appear in help once the user has completed one task cycle.

**Tier 3 (surfaces on explicit request or after N tasks):** ADRs, TENSIONs, Chronicle, REFLECT, sentinel — the full ontology. Available always via `arch help --full`, but not shown by default.

The commands exist at all tiers from day one; only the help surface and suggested-next-action prompts are gated. A user who knows to type `arch sentinel log` can always do so. The goal is that the user is never asked to trust a system they don't yet understand — complexity is discoverable, not required.

## Dependencies
- IDEA-plg-onboarding-flow (the Day 1 surface is the onboarding surface)

## Estimated size
M

## Gaps

## Decision
PROMOTE → TASK-1022. Scope simplified from the three-tier state machine to a two-surface visibility gate: `arch help` shows three commands (init, review, task capture); `arch help --full` shows the full inventory. No progressive unlock, no usage tracking, no tier state. All commands remain callable at all times — only the help surface is gated. This is the prerequisite surface for PLG onboarding flow.
