# ADR-017: Deterministic Observability & Operational Metrics

**Date:** 2026-05-13
**Status:** ACCEPTED
**Deciders:** Gemini CLI, Human Auditor

---

## Context
ARCH lacked a formal, deterministic mechanism for measuring operational health. Metrics like `REVIEW_FAIL` rate and cycle time were either manually computed (leading to clerical errors) or probabilistic. 

## Decision
Implement a deterministic observability system consisting of:
1. **Structured Event Logging:** A human-readable but strictly formatted append-only log at `docs/EVENTS.md` to record constitutional transitions (`REVIEW -> READY`, `REVIEW -> DONE`).
2. **Git-Aware Archive Parser:** An archive parser that extracts task metadata and uses `git log` (first commit date) as the absolute fallback for task creation dates to ensure accurate cycle time calculation.
3. **Automated Reporting:** An `arch report` command that surgically updates `docs/METRICS.md` using generated block delimiters, preserving human annotations while providing updated system metrics.

## Rationale
"Truth in metrics" requires deterministic sources. By anchoring cycle time to git history and `REVIEW_FAIL` to instrumented state transitions, we eliminate "confident lies" in our observability data. 

## Consequences
**Positive:**
- Automated, accurate reporting of system health.
- Reduced clerical overhead for agents during THINK sessions.
- Clear, auditable record of review failures and successes.

**Negative:**
- `arch review` now requires instrumentation of use-cases modifying task status.
- Slight increase in complexity within the CLI domain services.

---
