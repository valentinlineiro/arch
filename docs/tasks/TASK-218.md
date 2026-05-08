## TASK-218: Automatic entity linking — ADRs↔tasks
**Meta:** P1 | S | DONE | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-217

### Context
Materialize ADR↔task relationships in the ContextIndex so ContextInference can surface files through linked tasks and boost relevant ADRs when they are explicitly referenced in task text.

### Acceptance Criteria
- [x] `AdrTaskLinkEntry` and `AdrTaskLinkTaskEntry` interfaces added to `context-index.ts`
- [x] `ContextIndex.adrTaskLinks` field added; version bumped to 3
- [x] `BuildIndex.buildAdrTaskLinks()` implemented, extracting links from:
    - [x] `ADR:` field in task metadata
    - [x] `Depends:` field in task metadata
    - [x] `Meta:` context paths (7th pipe-separated field)
    - [x] Literal `ADR-XXX` mentions in task body
- [x] `ContextInference.score()` adds ADR-reference pass:
    - [x] Boosts matching ADRs in results
    - [x] Boosts `affectedModules` from matching ADRs
    - [x] Boosts files touched by tasks linked to the matching ADRs
- [x] All ACs verified by new tests in `build-index.test.ts` and `context-inference.test.ts`

### Definition of Done
- [x] All ACs checked.
- [x] `npm test` passes in `cli/`.

## Hansei
This completes the second slice of the automatic entity linking feature. By linking ADRs to tasks, we allow the context engine to 'pivot' through the graph: a task referencing an ADR can now see which files were historically touched by tasks that also referenced that ADR, creating a powerful semantic bridge between high-level decisions and low-level code implementation.
