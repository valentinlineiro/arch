# IDEA: Mechanize protocol-level controls in arch review
**Created:** 2026-05-05
**Source:** Codex external review — "several important controls are still protocol-level, not executable-level"
**Status:** DRAFT
**Meta:** P1 | L | claude-code | cli/src/main/ts/domain/services/, docs/agents/DO.md

## Problem
Several DO.md-mandated steps — Sentinel preflight reasoning calls, Hansei insertion on task close, fresh-session auditing, approval entries — are convention-only. `arch review` cannot verify whether they occurred. The system's own principle (PRINCIPLES.md) states that convention-only gates eventually fail; the governance design is stronger than the enforcement layer.

## Proposed solution
Encode DO.md's required close-step artifacts as machine-checkable predicates in `arch review`. Candidate checks:
1. **Hansei present on DONE tasks** — scan archived tasks for a `## Hansei` section; flag tasks closed without one.
2. **Approval entry on DONE tasks** — verify a `## Approval` or equivalent sign-off block exists before DONE transition.
3. **Sentinel call logged** — if a structured log of Sentinel calls is defined, verify it is non-empty for IN_PROGRESS tasks above a cost threshold.

Each new check follows the existing DriftChecker pattern and surfaces as a named drift violation in `arch review`.

## Dependencies
- Requires agreement on which DO.md steps are worth hardening first (Hansei is lowest cost; Sentinel is highest)
- TASK-189 (executable AC predicates) is a prior art reference for the pattern

## Estimated size
L — three distinct drift checks, each needing a parser, test coverage, and DO.md/TASK-FORMAT.md updates

## Gaps
<!-- THINK fills this section when invoked -->

## Decision
<!-- Human writes here after THINK evaluation -->
