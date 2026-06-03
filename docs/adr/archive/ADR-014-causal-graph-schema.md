# ADR-014: Causal Graph Schema for Chronicle

**Date:** 2026-05-11
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

Chronicle records operational events (TASK_STARTED, TASK_COMPLETED) but stores no causal relationships between entities. This means `arch ask` can surface co-occurrence between tasks and decisions but cannot answer causal questions: why did a task exist, which guideline was violated, which ADR a task implements.

Without causal structure, recurring failure detection is limited to lexical co-occurrence — which is a proxy for causality, not causality itself. The memory layer cannot compound.

## Decision

Add a flat, append-only causal relation store at `.arch/causal-graph.jsonl`. Each line is a JSON object:

```json
{"from": "TASK-220", "to": "ADR-011", "relation": "implements", "timestamp": "...", "note": "..."}
```

**Allowed relation types:** `implements`, `caused_by`, `violated`, `fixes`, `spawned`, `references`.

**Schema invariants:**
- `from` and `to` are entity identifiers (free-form strings, typically TASK-NNN, ADR-NNN, GUIDELINE-name)
- `relation` is one of the six allowed types
- `timestamp` is ISO-8601
- `note` is optional free-text context
- File is append-only — no mutation or deletion of existing lines

**New domain model:** `cli/src/main/ts/domain/models/causal-relation.ts` defines the TypeScript types. The graph is exposed through `CausalGraph` use-case and `arch causal add|show` commands.

## Consequences

- Causal assertions are human-writable (`arch causal add`) and machine-readable
- Git-tracked: the graph is auditable through normal git history
- No graph DB dependency — plain JSONL, queryable with a linear scan
- Future: `arch ask` can incorporate causal graph edges to distinguish correlation from asserted causation
