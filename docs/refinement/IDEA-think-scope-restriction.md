# IDEA: Restrict THINK scope to AI-only work — delegate mechanical phases to CLI
**Created:** 2026-04-30
**Source:** Architectural audit — THINK agent handles both mechanical governance (archival, flow) and deep AI reasoning (idea refinement, Kaizen); context overload as system scales
**Status:** DRAFT
**Meta:** P1 | S | local | docs/agents/THINK.md, arch.config.json

## Problem
THINK currently does three fundamentally different kinds of work in one session:
1. **Mechanical governance** (Phase 1): file moves, status checks, focus assignment — deterministic, CLI-executable.
2. **AI refinement** (Phase 2): reading IDEAs, filling gaps, evaluating dependencies — requires reasoning.
3. **Kaizen analysis** (Phase 3): protocol metrics, pattern detection — requires reasoning.

As `docs/refinement/` and `docs/tasks/` grow, Phase 1 consumes increasing context on work the CLI can do faster and more reliably. By the time the AI reaches Phase 2 (where it adds real value), the context window is partly spent on bookkeeping.

## Proposed solution
Once IDEA-protocol-as-code lands (Phase 1 delegates to `arch govern`), formalize the scope boundary in THINK.md:

> **THINK is the AI reasoning layer. It handles work that requires judgment, pattern recognition, or architectural insight. It does not re-implement logic the CLI can execute deterministically.**

Concretely:
- Phase 1: `arch govern` (CLI owns this entirely)
- Phase 2: AI owns — idea gaps, dependency analysis, promotion evaluation
- Phase 3: AI owns — Kaizen signals, protocol simplification, ORACLE distillation (when implemented)

This is not a three-role split (LIBRARIAN/ARCHITECT/ANALYST). It is a two-layer model: CLI layer for deterministic work, AI layer for reasoning work. The split is enforced by Protocol-as-Code, not by separate agent identities.

## Dependencies
IDEA-protocol-as-code (prerequisite — Phase 1 must delegate to CLI before scope restriction is meaningful).

## Estimated size
S

## Gaps
- Define the escalation path when `arch govern` encounters a condition it cannot resolve deterministically (e.g. all READY tasks are blocked) — it must hand off to the AI layer with a clear signal.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
