## TASK-890: arch task start - Contextual Memory Injection
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/ | Closed-at: 2026-05-15T12:00:00Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The AdrEntry model does not carry a constraint field — only title, keywords, affectedModules, strength. The designed output example showed a constraint line per ADR that cannot be populated without reading the ADR markdown files. Implemented with title-only output rather than inventing a field or adding file reads to the hot path.
**Constraint:** AdrEntry is a domain model in a protected path (arch.config.json protectedPaths includes domain/models/). Adding a constraint field requires an ADR.
**Cost:** One design assumption invalidated at implementation time — the constraint display was dropped from the ADR injection block. Minor divergence from the designed stdout format.
**Forward Action:** If ADR constraint injection is needed, extend AdrEntry with a constraint field via ADR and rebuild the context index. Track as an IDEA if this matters.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
