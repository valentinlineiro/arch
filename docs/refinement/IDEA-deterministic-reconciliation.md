# IDEA: Deterministic Hansei reconciliation baseline
**Created:** 2026-05-17
**Source:** Session observation — arch reflect --hansei is LLM-assisted with no auditable baseline
**Status:** DRAFT
**Sessions:** 0
**Meta:** P1 | M | 1-code-reasoning | cli/src/main/ts/domain/services/, cli/src/main/ts/application/use-cases/hansei-auditor.ts

## Problem

`arch reflect --hansei` calls `HanseiAuditor` which uses LLM reasoning to compare declared Hansei against observed implementation. The output is probabilistic: the model might say "H1 looks right" or "this looks like H3a" without traceability. There's no way to know if the LLM is hallucinating patterns or catching real concealment.

The invariant — "THINK is proposals only, never enforcement" — means the LLM output can't gate anything. But it can still produce false signal that accumulates in the causal graph as noise.

## Proposed Solution

**Two-tier reconciliation:**

**Tier 1 — Deterministic (always runs, auditable):**
Scan the diff between `lockedCommit` and HEAD for mechanically detectable patterns:
- `any` casts or `@ts-ignore` not declared in Constraint
- `TODO`/`FIXME`/`HACK` comments added since lockedCommit
- `console.log` in non-CLI layer code (already caught by HanseiReconciliation check)
- New dependencies added that aren't mentioned in Cost
- Files outside the declared context paths modified

If found: emit `[TIER1-DRIFT] TASK-XXX: <pattern> detected but not declared in Hansei` to stdout. Severity suggestion: H2 if single pattern, H3a if multiple.

**Tier 2 — LLM-assisted (runs after Tier 1, optional):**
Current `HanseiAuditor` behavior — but only for tasks that pass Tier 1 clean. If Tier 1 already found drift, skip LLM (it would be redundant).

`arch reflect --hansei --tier1-only` flag for deterministic-only mode in non-TTY or cost-sensitive contexts.

**Auditability guarantee:** Tier 1 output is reproducible from the same diff. Every WARN can be traced to a specific line.

## Constraint Axes
- Dependency ordering: Depends on `lockedCommit` field (TASK-905 DONE) — valid now
- Temporal validity: Valid now; grows more valuable with corpus
- Abstraction layer: Correct — THINK/analysis layer only
- Observability validity: Tier 1 fully deterministic; Tier 2 probabilistic but isolated
- Priority displacement: P1 — fixes the auditability gap in the reconciliation system

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
