# IDEA: Semantic AC Verification via LLM bridge

**Created:** 2026-05-06
**Source:** Human — strategic analysis of L3 autonomy prerequisites
**Status:** DRAFT
**Sessions:** 0

## Problem

AC completion is currently checkbox state only — the agent marks its own checkboxes. There is no independent verification that the claimed completed ACs are semantically satisfied. This means "all ACs checked" is a necessary but insufficient signal for task quality, and the human Auditor must close that gap manually.

## Proposed Solution

A `SemanticACVerifier` service in `cli/src/main/ts/domain/services/` that:

1. Takes a task (ACs + description) and the git diff since the task started
2. Builds a structured verification prompt: "here is the spec, here are the claimed completed ACs, here is the diff — are these ACs genuinely satisfied?"
3. Routes through `ProviderRegistry` to a reasoning-capable model (M tier)
4. Returns `{ pass: boolean; confidence: 'high' | 'medium' | 'low'; evidence: string }`
5. Is called by `ReviewSystem` after `arch review` passes — if confidence is low, falls back to human review rather than halting

Integration: add `arch verify-acs [task-id]` command as a standalone CLI entry point for manual use.

## Dependencies

- TASK-199 (LLM bridge) — **DONE**

## Estimated Size

M — new service + command + integration into ReviewSystem + tests

## Gaps

- What git diff boundary? (task start commit vs HEAD — needs task `lockedAt` timestamp mapping to a commit SHA)
- Confidence threshold for auto-pass vs. human-fallback needs empirical tuning
- Cost per verification run (M-tier model, ~2k tokens per call) — needs cap/circuit-breaker

---

**Decision:**
**Promoted by:**
**Promoted on:**
