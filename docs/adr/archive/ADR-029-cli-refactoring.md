# ADR-029: Human-Centric CLI Surface & Command Dispatcher

## Status
ACCEPTED

## Context
The ARCH CLI surface was originally designed for LLM interpretation, leading to esoteric and philosophical command names (e.g., `arch review`, `arch govern reflect`, `arch memory causal show`). This creates onboarding friction for humans and complicates the maintenance of the monolithic `index.ts` entry point, which grew to over 460 lines.

## Decision
1.  **Human-Centric Renaming**:
    -   `arch review` → `arch review`
    -   `arch govern reflect` → `arch analyze`
    -   `arch memory causal show` → `arch trace`
    -   `arch compile` → (internalized)
2.  **Registry-Driven Dispatcher**: Introduce `CommandDispatcher` to decouple command resolution and instantiation from the CLI entry point.
3.  **Alias Pruning**: Remove all legacy and deprecated aliases to reduce the maintenance surface.
4.  **Minimal Bootstrap**: Enhance `arch init` with a `--minimal` flag to support a streamlined, 3-file protocol setup.

## Consequences
-   **Usability**: Humans can intuitively guess command names.
-   **Maintainability**: `index.ts` is reduced to service initialization and dispatcher invocation.
-   **Breaking Changes**: Existing agents and scripts relying on the old names (e.g., `arch review`) will need to be updated.
-   **Internal Consistency**: Classes and files have been renamed to match the new surface (e.g., `CheckCommand`, `AnalyzeCommand`).
