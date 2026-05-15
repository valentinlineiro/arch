# IDEA: `arch task create` — Instant Task Scaffolding
**Created:** 2026-05-15
**Source:** DaaS Vision
**Status:** DRAFT
**Meta:** P1 | M | local | cli/src/main/ts/

## Problem
Creating a new task requires manually creating a file, copying a template, and filling in metadata. This "creation friction" leads to users doing work that isn't tracked or postponing task decomposition.

## Proposed solution
Implement `arch task create "<intent>"` to scaffold a task file instantly.

**Behavior:**
1.  **Drafting:** The CLI uses an LLM (in a non-enforcement role) to draft the `Acceptance Criteria`, `Size`, and `Class` based on the intent string.
2.  **Fallback:** If no LLM is configured or available, the CLI MUST fallback to a "skeleton-only" task (empty ACs, default Size/Class) without failing.
3.  **Context Inference:** The CLI runs `ContextInference` to suggest relevant files.
4.  **File Creation:** Creates `docs/tasks/TASK-XXX.md` with status `DRAFT` or `READY` (if fully specified).
5.  **Validation:** The generated task must pass `arch review --fast` before being saved. LLM-drafted content is treated as a proposal and must pass the same regex validation as human content.

## Rationale
Moves from "Documentation Burden" to "Operational Copilot." The system does the heavy lifting of scaffolding, while the human performs the final review and promotion.

## Dependencies
`ContextInference.ts`, `PromoteIdea.ts` (shared scaffolding logic).

## Estimated size
M

### Acceptance Criteria
- [ ] Subcommand `arch task create` implemented.
- [ ] LLM drafting for Title, ACs, Size, and Class based on intent.
- [ ] Explicit fallback to "skeleton-only" task if LLM is unavailable.
- [ ] ContextInference integration for file suggestions.
- [ ] Output passes `arch review --fast` validation.
- [ ] Auto-commit of the new task file.

## Decision
PROMOTE → TASK-891

