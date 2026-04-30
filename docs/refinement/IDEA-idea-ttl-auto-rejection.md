# IDEA: Define IDEA TTL and auto-rejection path for stale DRAFTs
**Created:** 2026-04-30
**Source:** Protocol audit — refinement queue has 17 IDEAs with no resolution path for long-lived DRAFTs
**Status:** DRAFT
**Meta:** P2 | XS | local | docs/agents/THINK.md, docs/refinement/

## Problem
The refinement queue currently holds 17 active IDEAs. There is no rule for what happens to a DRAFT IDEA that receives no human Decision across multiple THINK sessions. IDEAs can accumulate indefinitely, increasing Phase 2 overhead and reducing signal quality for the ideas that do matter.

## Proposed solution
Add a TTL rule to THINK Phase 2: if a DRAFT IDEA has been present for more than 3 THINK sessions without a Decision written, flag it in terminal output as `[STALE-IDEA]` and propose rejection. The human can override by writing a Decision. If no override comes by the next session, the agent moves it to `docs/refinement/archive/` with status `REJECTED: TTL expired`.

The TTL counter can be tracked via a `**Sessions:** N` field appended to the IDEA file by THINK on each pass.

## Dependencies
None.

## Estimated size
XS

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
