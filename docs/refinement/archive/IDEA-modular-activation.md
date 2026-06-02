# IDEA: Modular ARCH activation — archProfile + modules block

**Status:** PROMOTED
**Created:** 2026-06-02
**Source:** Strategic — reduce onboarding friction by making ARCH subsystems independently activatable
**Candidate-class:** 1-code-reasoning
**Candidate-size:** L
**Depends:** none
**Decision:** PROMOTE → TASK-1080

## Problem

ARCH has ~15 active subsystems running simultaneously on first use. A new user's first friction is Hansei validation on a task they consider done — before they've seen any governance value. The learning curve is steep because all enforcement is on by default with no opt-in path.

## Proposed Solution

Two mechanisms:

**archProfile** — named preset:
- `minimal`: task lifecycle only, Hansei advisory, no corpus/sprint/drift structural
- `standard`: task + Hansei blocking M+, TaskHealth+Governance drift, sprint
- `full`: everything enforced (current default, backward compatible)

**modules block** — fine-grained override of profile defaults per-subsystem.

**enforcement vs instrumentation** distinction:
- `blocking` — violations prevent close/review
- `advisory` — warnings, non-blocking
- `disabled` — subsystem does not run

## Validation hints

- `archProfile: minimal` closes XS/S tasks without Hansei forward-action errors
- `archProfile: full` (or absent) matches current behavior exactly
- `arch init` prompts for profile selection in TTY
