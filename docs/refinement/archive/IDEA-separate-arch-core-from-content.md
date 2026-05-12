# IDEA: Separate ARCH framework from project content
**Created:** 2026-04-29T12:35:00Z
**Source:** User feedback regarding ARCH method and course living in the same place as the framework core.
**Status:** DRAFT
**Meta:** P2 | S | local | docs/, cli/

## Problem
Currently, the ARCH framework core protocols (AGENTS.md, TASK-FORMAT.md) and meta-documentation (course, guidelines) live in the same directory structure as the project-specific tasks and logic. This lacks "separation of concerns" and makes it difficult to maintain the framework independently from the content it manages.

## Proposed solution
Reorganize the `docs/` structure to clearly distinguish between:
1.  **ARCH Core:** (The "Engine") - Protocols, Task Formats, ADRs.
2.  **ARCH Content:** (The "Payload") - Courses, guidelines, and project-specific documentation.
3.  **Project State:** (The "Runtime") - Tasks and Archive.

Possible folder structure refinement:
- `docs/arch/` (Framework core)
- `docs/content/` or `docs/handbook/` (Course, guidelines)
- `docs/tasks/` (Remains as the runtime inbox)

## Dependencies
None.

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

## Decision
REJECT: The co-location of framework files and project files is a feature, not a bug — it makes the protocol self-hosting: ARCH governs its own development using itself. Separating them would require a version management layer and a distribution mechanism that don't exist and aren't needed. IDENTITY.md §5: adds abstraction without removing friction. If a specific file causes navigation confusion, fix that file directly.
