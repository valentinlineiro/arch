# ADR-007: Census Context Budget Check in DriftChecker

**Date:** 2026-05-05
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

ADR-002 establishes context-as-budget as a core principle: directories consumed by an LLM agent have a finite line-count capacity before they exceed the model's effective context window. There is currently no enforcement mechanism — directories can silently grow past capacity with no warning until a task fails or produces degraded output.

## Decision

Add a `contextBudget` block to `arch.config.json` mapping directory paths to line-count thresholds, and add a `Census` check to `DriftChecker` that reads those thresholds, counts lines across all files in each configured directory, and emits a WARN with a suggested PURGE or REFACTOR action when a threshold is exceeded.

## Rationale

- `DriftChecker` is the established home for all structural health checks; `Census` is a structural check.
- Configuring thresholds in `arch.config.json` keeps policy out of code and allows per-repo tuning without touching the domain layer.
- PURGE vs. REFACTOR suggestion is derived from the directory type: archive directories warrant periodic purging; active directories warrant decomposition or refactoring.
- Alternatives considered: a standalone `arch census` command (adds CLI surface, harder to enforce on every review), or a pre-commit hook (fires too late — at commit time, not at review time).

## Consequences

**Positive:**
- Context budget violations surface in every `arch review` run before they become execution failures.
- Threshold policy is visible and version-controlled in `arch.config.json`.

**Negative / trade-offs:**
- Line counts are a proxy metric — a directory of 500-line files hits the threshold faster than one of short files, regardless of actual token load. Acceptable for the current threat model.
- Adding `Census` to `DriftChecker` requires a dist rebuild on every change to that file.

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
<!-- Reference in tasks: ADR-007 — no need to re-read, decision is final -->
