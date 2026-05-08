# IDEA: arch ask — memory queries over the full ARCH operational corpus
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P1 | L | claude-code | cli/src/main/ts/

## Problem
ARCH accumulates operational memory across hundreds of tasks, retros, ADRs, and guidelines — but this memory is not queryable. An agent or human wanting to know "why do auth tasks keep failing?" must manually read through archives. Institutional knowledge exists but is not accessible.

## Proposed solution
`arch ask "<question>"` analyzes the full ARCH corpus (tasks, retros, commits, ADRs, guidelines, KAIZEN-LOG) and produces: causal patterns, recurring failure signatures, and actionable recommendations. Example output:

```
arch ask "why do auth tasks keep failing?"

→ Pattern detected (7 occurrences): auth tasks fail REVIEW when input validation
  is missing at the service boundary.

→ Related tasks: TASK-031, TASK-044, TASK-067, TASK-089, TASK-112, TASK-134, TASK-156
→ Related guideline: GUIDELINE-012 (validation before persistence)
→ Suggested action: Add AC template for auth tasks requiring explicit validation step.
```

## Rationale
This is where ARCH starts to feel like an OS rather than a task manager. The moat is not the CLI — it is the accumulated operational memory. `arch ask` is the interface that makes that memory actionable. Without it, the memory exists but cannot be accessed. With it, ARCH compounds every session's knowledge into future sessions.

## Related IDEAs
- [IDEA-rag-context-retrieval.md](IDEA-rag-context-retrieval.md) — RAG infrastructure that could power this
- [IDEA-oracle-archive-distillation.md](IDEA-oracle-archive-distillation.md) — archive distillation approach
- [IDEA-institutional-memory-document.md](IDEA-institutional-memory-document.md) — related memory surface

## Dependencies
TASK-210 (ContextIndex), IDEA-roadmap-automatic-linking (for relationship traversal).

## Estimated size
L

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
