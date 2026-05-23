## TASK-218: Automatic entity linking — ADRs↔tasks
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-217

## Hansei
This completes the second slice of the automatic entity linking feature. By linking ADRs to tasks, we allow the context engine to 'pivot' through the graph: a task referencing an ADR can now see which files were historically touched by tasks that also referenced that ADR, creating a powerful semantic bridge between high-level decisions and low-level code implementation.
