# Auto Context Engine Design

**Date:** 2026-05-07
**Status:** APPROVED

---

## Goal

Eliminate manual `Meta:` context authoring for task execution. Given a task file, the Auto Context Engine automatically infers relevant files, ADRs, and guidelines, writes them as a persistent `### Relevant Context` section, and makes that section available to `arch exec` without runtime file scanning.

---

## Core Principle

> Context is not ephemeral input. It is a hypothesis stored in the system.

The engine operates as a **two-phase system** with strict separation:

- **Build phase** — compresses repo knowledge into a structural index once
- **Lookup phase** — queries the index deterministically at execution time

Runtime never scans files. Runtime only does lookups.

---

## Architecture

### Phase 1: Build (Index Compilation)

**Trigger:** `arch govern` (always) + `arch index` (on demand)

**Output:** `.arch/context-index.json` — git-tracked, committed with `[THINK]` tag on govern runs.

The index is not a cache. It is a versioned artifact of the system. Its diffs are readable, its evolution is auditable, and any corruption is recoverable via `git revert`.

**Index structure:**

```json
{
  "version": 1,
  "builtAt": "2026-05-07T14:00:00Z",
  "files": {
    "cli/src/main/ts/domain/models/intent.ts": {
      "symbols": ["Intent", "IntentStatus", "IntentOrigin"],
      "imports": [],
      "tags": ["domain", "model", "intent"],
      "criticality": "core",
      "runtimeUsage": "hot"
    }
  },
  "adrs": {
    "ADR-002": {
      "title": "Context as a budget, not a default",
      "keywords": ["context", "budget", "token", "agent", "cost"],
      "affectedModules": ["cli/src/main/ts/domain/services/config-loader.ts"],
      "strength": "enforced"
    }
  },
  "guidelines": {
    "testing-a-change.md": {
      "tags": ["test", "ci", "validation"],
      "taskClasses": ["2-code-generation", "7-operations"]
    },
    "versioning.md": {
      "tags": ["version", "schema", "migration"],
      "taskClasses": ["2-code-generation"]
    }
  }
}
```

**Field derivation (all deterministic, no manual annotation):**

| Field | Source |
|---|---|
| `symbols` | TypeScript compiler API — exported identifiers from each file |
| `imports` | Static `import` statements resolved via `tsconfig.json` |
| `tags` | Path segment tokenization + lowercased, camelCase-split symbol names |
| `criticality` | Path heuristic: `domain/` → `core`, `application/` → `domain`, `infrastructure/` → `support`, `test/` → `utility` |
| `runtimeUsage` | Import depth from `index.ts`: depth 1–2 → `hot`, depth 3–4 → `warm`, deeper → `cold` |
| ADR `keywords` | Title tokens + first section tokens (stopwords removed) |
| ADR `affectedModules` | File paths mentioned in ADR body |
| ADR `strength` | ADR `Status:` field: `ACCEPTED` → `enforced`, `PROPOSED` → `advisory`, anything else → `advisory` |
| Guideline `taskClasses` | Static mapping in `arch.config.json` (new field: `contextRules`) |

For non-TypeScript files (`.md`, `.json`), symbol/import extraction is skipped; only path tags are indexed.

---

### Phase 2: Lookup (Inference at IN_PROGRESS transition)

**Trigger:** `arch task start TASK-XXX` — runs `ContextInference` after setting status to `IN_PROGRESS`, before committing. The write-back is part of the same atomic commit.

**Algorithm:**

1. Extract keywords from task title + description + ACs (lowercase, remove stopwords, split camelCase)
2. Score every index entry using the edge-type weight table:

| Match type | Weight |
|---|---|
| `direct_import` | 3.0 |
| `symbol_match` | 2.0 |
| `keyword_match` | 1.0 |
| `tag_match` | 0.5 |

3. Apply multipliers:

| Dimension | Multiplier |
|---|---|
| `criticality: core` | × 1.5 |
| `criticality: domain` | × 1.2 |
| `criticality: support` | × 1.0 |
| `criticality: utility` | × 0.7 |
| `runtimeUsage: hot` | × 1.3 |
| `runtimeUsage: warm` | × 1.0 |
| `runtimeUsage: cold` | × 0.7 |

4. Rank by final score. Select top-5 files, top-3 ADRs (sorted by `strength` first, score second), top-2 guidelines (matched by task class, then score).

5. Compute confidence:
   `confidence = (overlap_density × 0.4) + (adr_strength_consistency × 0.35) + (graph_coherence × 0.25)`
   — where overlap density = matched keywords / total task keywords; adr_strength_consistency = fraction of top ADRs that are `enforced`; graph_coherence = fraction of top files that are mutually connected in the import graph.

6. Write `### Relevant Context` to the task file: appended after the `### Context` section if present, otherwise inserted before `### Acceptance Criteria`.

**Output format in task file:**

```markdown
### Relevant Context
_confidence: 0.82_

**Files:**
- cli/src/main/ts/domain/models/intent.ts _(core, hot)_
- cli/src/main/ts/domain/repositories/intent-repository.ts _(core, warm)_

**ADRs:**
- ADR-002: Context as a budget, not a default _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md
```

**Graceful degradation:** If `.arch/context-index.json` does not exist, `ContextInference` skips silently. The task starts without `### Relevant Context`. No error, no halt.

---

### Optional Enrichment (LLM delta)

Activated via `--enrich` flag on `arch task start` or `arch context TASK-XXX --enrich`.

An XS LLM call receives:
- The full task file
- Top-10 scored candidates (before trimming to top-5/3/2)
- The current `confidence` score

The LLM returns additions only. It cannot remove entries from the deterministic set. Its output is merged as a delta:

```
final_context = deterministic_set ∪ llm_additions
```

Deterministic defines truth candidates. LLM defines relevance weighting on ambiguous edges.

`--enrich` is an exception path, not the default. If the system requires it regularly, the index quality needs improvement, not the LLM budget.

---

## Integration Points

| Component | Change |
|---|---|
| `arch govern` | Calls `BuildIndex` at end of run |
| `arch index` | New command: runs `BuildIndex` on demand |
| `mark-task-in-progress.ts` | Runs `ContextInference` before commit |
| `arch.config.json` | New `contextRules` field: guideline → task class mapping |
| `.arch/context-index.json` | New git-tracked file |

**New use cases:**
- `BuildIndex` — reads all TS files via compiler API, reads ADRs and guidelines, writes `.arch/context-index.json`
- `ContextInference` — reads index, extracts task keywords, scores, writes `### Relevant Context`

**New command:**
- `arch index` — surfaces `BuildIndex` as an on-demand CLI command

---

## Testing

- `build-index.test.ts`: symbol extraction from TS fixture, import graph resolution, ADR keyword parsing, guideline tag mapping, criticality/runtimeUsage derivation
- `context-inference.test.ts`: keyword extraction, scoring with known index fixture, write-back format, confidence calculation, graceful skip when index absent, `--enrich` delta merge (mock LLM)

---

## Deferred

- Threshold policy for auto-triggering `--enrich` based on confidence score (needs empirical calibration)
- Depth penalty for graph expansion beyond direct imports (phase 2 intelligence)
- `runtimeUsage` derivation from actual execution logs (currently static heuristic)
- Scoring weight calibration (weights above are initial estimates; empirical tuning after real usage)
- Historical task similarity (phase 2)
- Git commit proximity analysis (phase 2)

---

## Invariants

- The LLM never removes deterministic context entries — only adds
- `arch exec` reads `### Relevant Context` from the task file; it does not re-run inference
- The index is always rebuilt on `arch govern`, never partially updated
- `ContextInference` failure never blocks task start — it degrades gracefully
