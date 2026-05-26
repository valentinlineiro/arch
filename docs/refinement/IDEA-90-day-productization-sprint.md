# IDEA: 90-day productization sprint — ship the constitutional insight as a product
**Created:** 2026-05-25
**Source:** Strategic review session
**Status:** DRAFT
**Meta:** P0 | L | local | docs/refinement/

## Problem
ARCH has a lead on the separation-of-powers insight for AI governance — deterministic enforcement, LLM-assisted analysis, never LLM enforcement. That lead is time-limited. A simpler competitor with a better CLI wins by default if ARCH spends the window polishing the ontology rather than shipping the minimum defensible surface. The IDEA bottleneck, TENSIONs, Chronicle, REFLECT tracking, and dual-truth reconciliation are retention features — they don't matter if nobody installs.

The 3-phase cli-protocol-decoupling (TASK-1011/1014/1015) was the right prerequisite work and is done. The productization window is open now.

## Proposed solution
90-day sprint with four and only four objectives:

1. **`arch init` that works in any repo in under 2 minutes** — scans, bootstraps `.arch/`, runs review, exits with a concrete action item. Scope: repos with no prior governance; existing-governance conflict resolution is out of scope for this sprint.
2. **`arch review` that finds real issues and suggests fixes** — output must be actionable for a user who has never read an ARCH doc. Requires `arch fix` companion command.
3. **`arch task capture` that feels like free value** — zero required reading. The meta line must not leak through the first-use surface.
4. **Progressive CLI surface** — three commands visible by default; depth graduates on demand. Remove everything that requires reading a doc to understand from the default help surface.

**What is explicitly deferred:**
- IDEA bottleneck / escalation dedup (governance hygiene, not acquisition)
- Chronicle normal-path coverage (retention feature)
- REFLECT measurement independence (retention feature)
- TENSION resolution / dual-truth reconciliation (retention feature)
- Friction measurement instrumentation (retention feature)
- TASK-1019 (TENSION-006 INBOX regen) — M-sized governance infrastructure invisible to new users; deprioritize to P2

**The moat:** separation-of-powers shipped as a tool, not a philosophy. If the user feels the value of governance before they understand what governance is, ARCH owns the category. If the ontology ships first, a simpler tool wins.

## Dependencies
- TASK-1011/1014/1015 (cli-protocol-decoupling — complete, unblocked)
- IDEA-plg-onboarding-flow (promotion to task is the first sprint deliverable)
- IDEA-progressive-cli-surface
- IDEA-enforcement-boundary-demo
- IDEA-compliance-front-door

## Estimated size
L

## Gaps

## Decision
PROMOTE → TASK-1028. Sprint thesis is sound; the acquisition window is real and time-limited. Revised rating: ★★★★☆ (not ★★★★★) — execution-ready only after AC decomposition, which is the first deliverable of the task itself. The task's initial output is a breakdown of ACs per objective (init, review, capture, progressive CLI); sub-tasks are created from those ACs. The four objectives are locked; scope additions require a new IDEA.
