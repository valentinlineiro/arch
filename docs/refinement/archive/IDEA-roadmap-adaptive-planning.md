# IDEA: Adaptive planning — task states that model energy, context, and cognitive cost
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DEFERRED
**Meta:** P3 | S | claude-code | docs/TASK-FORMAT.md, docs/guidelines/

## Problem
ARCH task statuses (READY, IN_PROGRESS, DONE, BLOCKED) model pipeline state but not human state. A task can be technically READY but practically unreachable because the operator lacks the cognitive bandwidth, context, or energy for it right now. This mismatch causes poor sprint planning and frustration.

## Proposed solution
Extend the task status vocabulary with optional human-state qualifiers:

- `READY/high-cost` — technically ready but requires deep focus (not suitable for fragmented time)
- `READY/context-heavy` — requires loading significant prior context before starting
- `BLOCKED/energy` — blocked not by technical dependency but by operator capacity
- `READY/maintenance` — low cognitive cost, suitable for low-energy sessions

These are advisory states, not workflow gates. `arch next` incorporates them when suggesting the next task, optionally accepting a `--energy low|medium|high` flag.

## Rationale
Sustainable systems model the constraints of their operators. For personal, household, and startup use cases — where the same person writes code, manages operations, and handles life — energy is a first-class constraint. Ignoring it produces plans that look good on paper and fail in practice.

## Related IDEAs
- [IDEA-context-control.md](IDEA-context-control.md) — context budget awareness
- [IDEA-cost-aware-protocol.md](IDEA-cost-aware-protocol.md) — cost-aware task ordering

## Dependencies
IDEA-roadmap-operational-load.

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

### Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites (signal corpus, arch ask compounding). Re-evaluate when READY count drops below 5 or Phase B reaches 50%.
