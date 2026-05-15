# IDEA: `arch task create` — Template-based Acceptance Criteria
**Created:** 2026-05-15
**Source:** DaaS Sprint Reflection
**Status:** DRAFT
**Meta:** P1 | S | local | cli/src/main/ts/

## Problem
`arch task create` currently relies on an LLM to draft Acceptance Criteria (ACs). This is brittle (non-deterministic output), requires an API call, and often produces vague results that need manual correction.

## Proposed solution
Implement a **Template Library** within the CLI that maps `task-class` to a set of mandatory/suggested ACs.

**Workflow:**
1.  User runs `arch task create "intent" --class 2-code-generation`.
2.  CLI identifies the class and selects the corresponding template from a local JSON/TS registry.
3.  The scaffolded task file is pre-populated with deterministic ACs (e.g., "Implement logic in X", "Add unit tests", "arch review passes").
4.  LLM drafting (if available) is used only to *supplement* the template with intent-specific ACs, rather than being the sole source.

## Rationale
Ensures 100% reliability for core task scaffolding even without an internet connection or LLM provider. Standardizes the "Definition of Ready" for common task types.

## Dependencies
`CreateTask.ts`, `registry.json` (or new template registry).

## Estimated size
S

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
