# IDEA: consolidate-root-agent-docs
**Meta:** Source: Phase-2.5 | Status: DRAFT | Size: XS | Sessions: 3

### Problem
Structural duplication and stale content in root documentation.
- `GEMINI.md` is a symlink to `docs/AGENTS.md` (v0.6.0 detailed protocol).
- `AGENTS.md` at the root is a regular file with stale v0.1 content and non-English examples ("promover").

This creates a cognitive trap for new agents/contributors who might read the root `AGENTS.md` instead of the authoritative `GEMINI.md`.

### Proposed Solution
1. Delete `AGENTS.md` at the root.
2. Ensure `GEMINI.md` remains the primary entry point (via symlink or direct file).
3. Update all references to `AGENTS.md` to point to `GEMINI.md` or `docs/AGENTS.md`.

### Constraint axes
- Dependency ordering: Satisfied.
- Temporal validity: Satisfied.
- Abstraction layer: Satisfied.
- Observability validity: Satisfied.
- Priority displacement: Satisfied (Correctness/Cleanliness).

### Decision
REJECT: Fixed directly. Root `AGENTS.md` converted to symlink → `docs/AGENTS.md`. No task needed.
**Closed:** 2026-05-16T10:35:11Z

## Decision
REJECT: Fixed directly — root AGENTS.md converted to symlink in session 2026-05-16.
