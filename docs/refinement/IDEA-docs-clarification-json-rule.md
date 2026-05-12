# IDEA: Clarify "no JSON" rule in documentation guidelines
**Created:** 2026-05-12
**Source:** Phase-3.5
**Status:** DRAFT
**Sessions:** 1
**Meta:** P3 | XS | writing | docs/guidelines/

## Problem
`docs/guidelines/documentation.md` states: "All framework files are Markdown — no YAML, no JSON, no special syntax". This is ambiguous and potentially contradictory, as the project uses `arch.config.json` and other JSON-based files for configuration and internal state (e.g., in `.arch/`).

## Proposed solution
Clarify that the "no JSON/YAML" rule applies strictly to protocol definitions, task files, and human-facing documentation, while allowing JSON for configuration and machine-readable state.

## Rationale
Removes conceptual contradiction and aligns documentation with observed system behavior.

## Decision
<!-- Human writes here after THINK evaluation -->
