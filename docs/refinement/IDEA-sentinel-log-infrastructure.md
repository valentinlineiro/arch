# IDEA: Sentinel call log infrastructure
**Created:** 2026-05-05
**Source:** Split from IDEA-mechanize-protocol-controls
**Status:** DRAFT
**Sessions:** 2
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

## Constraint axis evaluation (2026-05-12)
| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | **Violated** | Sentinel mechanism is not mechanically defined — the Gaps section itself states this. Building a log before the call mechanism is formalized is wrong order. |
| Temporal validity | **Violated** | Sentinel calls are convention-only; insufficient empirical base to know whether calls are happening, how often, or what "high-cost" threshold means |
| Abstraction layer | Satisfied | New CLI command + drift check is correct layer if prerequisites existed |
| Observability validity | **Violated** | The observable (Sentinel calls) doesn't exist in reliable form — can't log what isn't being captured |
| Priority displacement | Active | L-sized; downstream of Sentinel semantics being defined |

Not structurally admissible. The Gaps section correctly identifies the blocker: resolve Sentinel call semantics first.

## Decision
<!-- Human writes here after THINK evaluation -->
