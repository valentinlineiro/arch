# IDEA: Cap THINK replenishment when undecided IDEAs already exist

**Status:** DRAFT
**Created:** 2026-05-27
**Source:** smartcart-os THINK Phase 3 — pipeline stall when IDEAs accumulate without decisions; confirmed in ARCH session 2026-06-02 (THINK created new replenishment IDEA despite 2+ undecided IDEAs already in docs/refinement/)
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** none

## Problem

THINK's replenishment rule ("propose a new IDEA when READY tasks < 3") fires regardless of how many undecided IDEAs already exist in `docs/refinement/`. In this session, THINK created `IDEA-ready-task-replenishment-visibility` despite `IDEA-auto-task-turns` and `IDEA-refinement-archival-gate` already sitting undecided. Adding more IDEAs to a stalled decision queue deepens the backlog without unblocking it.

The existing TTL mechanism (ttlCycles=10, Sessions counter) handles eventual expiry but does not prevent new IDEAs from being added to an already-congested queue.

## Proposed fix

Add to `docs/agents/THINK.md` Phase 1 replenishment rule:

> Before creating a replenishment IDEA, count IDEAs in `docs/refinement/` with no `Decision:` field set. If count ≥ 3, do **not** create a new IDEA — instead, cite the blocked decisions as the replenishment signal in INBOX and surface the oldest undecided IDEA as the priority action.

This stops new IDEA generation from masking a decision bottleneck.

## Acceptance Criteria

- [ ] `docs/agents/THINK.md` Phase 1 replenishment rule updated with the ≥3 undecided cap
- [ ] INBOX output when cap applies names the oldest undecided IDEA explicitly
- [ ] `arch review` passes

## Sessions: 1

## Decision

PROMOTE → TASK-1087
