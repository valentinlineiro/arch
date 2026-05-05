# IDEA: Sentinel call log infrastructure
**Created:** 2026-05-05
**Source:** Split from IDEA-mechanize-protocol-controls
**Status:** DRAFT
**Sessions:** 1
**Meta:** P2 | L | claude-code | cli/src/main/ts/, docs/agents/DO.md

## Problem
DO.md mandates Sentinel preflight reasoning calls for high-cost or high-risk operations, but there is no structured log of these calls. `arch review` cannot verify they occurred. The control is entirely convention-dependent.

## Proposed solution
Define a Sentinel call log format and infrastructure:
1. `docs/SENTINEL-LOG.md` — append-only log, one entry per call: `[date] TASK-XXX | trigger: <reason> | outcome: GO | HALT`.
2. `arch sentinel log TASK-XXX --trigger "<reason>" --outcome GO|HALT` — CLI command that appends a validated entry.
3. A `SentinelCoverage` drift check: for IN_PROGRESS tasks above a configurable cost threshold, verify at least one SENTINEL-LOG entry exists within the current session.

## Dependencies
- Requires definition of "cost threshold" that triggers a mandatory Sentinel call (currently undefined).
- Requires agreement on what "Sentinel call" means mechanically — is it a separate LLM call, a structured self-check, or a human gate?

## Estimated size
L — new CLI command, log parser, drift check, DO.md/TASK-FORMAT.md updates, tests

## Gaps
- The meaning of "Sentinel call" is not mechanically defined in DO.md. This IDEA cannot be well-scoped until that definition is resolved. Consider deferring until Sentinel semantics are clearer.

## Decision
<!-- Human writes here after THINK evaluation -->
