# IDEA: context injector must not project planned artifacts as existing
**Created:** 2026-05-27
**Source:** smartcart-os observation — "ADR-001: Cost-only optimization for Cádiz pilot _(advisory)_" appeared in task context before ADR-001 existed as a file; injector read the ADR name from the task description body and treated it as an existing artifact
**Status:** DRAFT
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S

## Problem

The context injector extracts artifact references (ADR names, task IDs, file paths) from task description text and includes them in the context index. When a task *mentions* an artifact by name in its prose — e.g. "This task will produce ADR-001" — the injector surfaces that artifact as if it already exists. Downstream task agents read the context and may confidently reference ADR-001 as an authoritative constraint before it has been written.

The marker _(advisory)_ rather than _(enforced)_ suggests the system detected the artifact doesn't fully exist yet, but the entry still appears in context — which is misleading enough to cause confusion.

This is a false positive in artifact extraction: existence should be verified against the filesystem, not inferred from task prose.

## Proposed outcome

A task agent's context only includes ADRs, files, and external artifacts that exist as actual files on disk at context-generation time. References to planned-but-not-yet-created artifacts are omitted (or clearly flagged as `[PLANNED]`, not `_(advisory)_`).

## Proposed solution

In the context injector / context-index builder, after extracting artifact references from task text:
1. Resolve each ADR reference (`ADR-\d+`) to a file in `docs/adr/`
2. Resolve each file path reference to an actual path
3. Only include entries where the artifact exists; drop the rest (or emit a distinct `[PLANNED]` marker that agents are trained to treat as non-authoritative)

The `_(advisory)_` tag may already serve this role partially — if so, the fix is ensuring agents' prompts explicitly instruct them that `_(advisory)_` means "referenced in prose, file not verified."

## Validation hints

- `cli/src/main/ts/application/use-cases/` — find context-index builder / injector
- Test: create a task body that mentions "ADR-999" (nonexistent); run context rebuild; verify ADR-999 does NOT appear in the context index (or appears as `[PLANNED]` only)
- `npm test` passes

## Dependencies

None

## Gaps

## Decision
PROMOTE → TASK-1061
