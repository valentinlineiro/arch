# IDEA: arch deps TASK-XXX — dependency tree visualization
**Created:** 2026-05-17
**Source:** Session observation — arch causal output is opaque, backlog navigation is manual
**Status:** DRAFT
**Sessions:** 0
**Meta:** P2 | S | 2-code-generation | cli/src/main/ts/application/commands/, cli/src/main/ts/application/use-cases/

## Problem

`arch causal` exists but outputs raw JSONL — not readable during planning. `arch task next` selects the next task but doesn't show *why* that task is next or what it unlocks. Backlog prioritization requires manually reading each task file to understand the dependency graph.

With 10+ active tasks, understanding "if I close TASK-206, which tasks become unblocked?" requires grep. This is exactly the kind of traversal that should be a command.

## Proposed Solution

`arch deps TASK-XXX` — dependency tree for a task:

```
arch deps TASK-206

TASK-206 (P3 M READY)
  └─ unlocks:
      ├─ TASK-098 (P3 S READY — blocked)
      ├─ TASK-099 (P3 S READY — blocked)
      ├─ TASK-100 (P3 S READY — blocked)
      └─ TASK-101 (P3 S READY — blocked)

  └─ depends on: (none)
```

`arch deps --all` — full dependency graph as ASCII tree, sorted by unblocking leverage (tasks that unlock the most downstream work shown first).

Terminal-only. Read-only. No LLM. Pure graph traversal over `Depends:` fields in task files.

## Constraint Axes
- Dependency ordering: None — reads existing Depends fields
- Temporal validity: Valid now
- Abstraction layer: Correct — read-only query
- Observability validity: Deterministic — graph traversal only
- Priority displacement: P2

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
