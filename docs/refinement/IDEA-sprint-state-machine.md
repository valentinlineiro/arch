# IDEA: sprint-state-machine
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

TASK-957 (automatic sprint lifecycle) is BLOCKED because "sprint" does not exist as a formal entity in the system. The current design has events, a counter config, and ledger entries, but no state machine. Without one:

- The ledger is not trustworthy (no invariants to validate against)
- `arch govern` cannot be idempotent (no defined state to check before acting)
- The retro is not derivable (no canonical source of truth for sprint boundaries)
- Any implementation is cosmetic on top of implicit, unverified state

The system also has a multi-oracle problem: `arch.config.json`, `.arch/focus-ledger.jsonl`, `docs/tasks/`, and `docs/RETRO.md` all implicitly encode sprint state with no arbiter. Bugs under this model are irreproducible and replays can diverge.

## Proposed direction

This IDEA should produce a design document (not code) that closes three contracts:

**1. SprintState model**

Define sprint as a system entity with explicit states:
- `ACTIVE` — sprint is open, tasks are being archived toward it
- `CLOSED` — close condition met, retro written, new sprint not yet opened
- `NEXT_PENDING` — (optional) transition state if close and open are separated in time

For each state: what is invariantly true, what events are valid, what events are forbidden.

**2. Source of truth declaration**

Pick one oracle and make it authoritative. Candidates:
- Focus-ledger as the event log (SPRINT_OPEN timestamp = start of sprint; everything derived from it)
- arch.config.json as intent + ledger as audit trail

The multi-oracle problem must be resolved here. The design must answer: if ledger and config disagree, which wins and why?

**3. Authority boundary for arch govern**

Define what `arch govern` is permitted to read, write, and never touch on the sprint path:
- Reads: ledger (to derive current state), task archive (to count)
- Writes: ledger (new events), RETRO.md (projection), config (sprint name update)
- Never touches: task status, focus assignment (these are existing govern responsibilities with their own invariants)

Idempotency must be a provable property of the state machine, not a "we'll be careful" claim.

## Scope

This is a design artifact only. Output: a spec in `docs/superpowers/specs/` or a committed design document. No code. Once this design is approved, TASK-957 can be unblocked and re-specced against it.

## Governance class
Class: 0 (design / pre-implementation)
Does NOT produce: code, ADRs, config changes
Produces: closed state machine contract that TASK-957 depends on

## Decision
PROMOTE → TASK-960
