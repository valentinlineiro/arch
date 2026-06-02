# IDEA: AC verification layer too shallow — stubs pass but flows break

**Status:** DEFERRED
**Created:** 2026-06-02
**Source:** Strategic — smartcart-os TASK-008 incident (stub broke main CTA)
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** DEFERRED — TASK-1075 is a partial fix. Condition: 3+ flow regressions detected in a 30-day window that TASK-1075 did not catch.

## Problem

TASK-008 stubbed POST /api/inventory (correct per cut list). POST /api/inventory was the main CTA. The governed close path verified the stub was in place. A real user discovered the breakage. The AC predicates verified local correctness; nobody checked end-to-end flow correctness.

TASK-1075 (FlowRegressionRisk check) is a partial fix — it warns when a stub touches a Core Flow path. But the underlying problem is deeper: verification at the AC level does not compose into verification at the flow level.

## Proposed Solution

A flow-level smoke test layer that runs on govern tick when Core Flows are defined:

1. Parse Core Flows from PROJECT.md (already done by checkCoreFlows)
2. For flows with `cmd:` predicates — run them as integration smoke tests on each govern tick
3. Emit FLOW_CHECK_FAIL to INBOX when a smoke test fails, regardless of which task caused it
4. Tag the most recent task to touch the affected code path as a candidate for the regression

This is different from unit tests. It's a living integration check wired into governance.

## Validation hints

- A stubbed endpoint on a Core Flow path causes FLOW_CHECK_FAIL on the next govern tick
- The task that introduced the stub is identified as a regression candidate
- arch govern output shows Core Flows N/N passing after each session
