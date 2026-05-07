# FEATURE 4 — Drift Detection Design

**Date:** 2026-05-07
**Status:** APPROVED
**Feature:** Organizational drift detection to prevent structural collapse

---

## Problem

ARCH accumulates structural debt silently: tasks fall out of the causal graph, guidelines reference paths that no longer exist, ADRs are accepted but never executed, and the documentation layer develops semantic contradictions over time. None of these are caught by the existing 17 DriftChecker rules because they operate at a different level — organizational meaning, not just file integrity.

---

## Architecture Decision: Two Tiers

Drift detection splits into two systems with distinct responsibilities:

| Tier | System | Mode | Layer |
|------|--------|------|-------|
| Truth | `DriftChecker` | Deterministic | Enforcement |
| Meaning | THINK Phase 3.5 | LLM-assisted | Cognition |

These tiers must NOT be mixed. DriftChecker is 100% deterministic, reproducible, and audit-able. Semantic analysis lives in THINK and produces insight, never verdicts.

**Principle:** enforcement must be deterministic; interpretation can be probabilistic.

---

## Tier 1: DriftChecker Extensions

Three new checks are added to `cli/src/main/ts/domain/services/drift-checker.ts`, each implementing the existing `DriftResult` contract (`check`, `status`, `details[]`).

### 1. `checkOrphanTasks`

**Definition:** a task is orphan if there is no directed path from any node in the Active Root Set to that task in the dependency graph.

**Active Root Set:** all tasks in `docs/tasks/` where Meta status ∈ `{READY, IN_PROGRESS}`. This is the *operational frontier* of the system — not the causal origin (that will be INTENT nodes when introduced). When `docs/intents/` is formalized with CAPTURED/PROMOTED statuses, those nodes extend the root set.

**Graph construction:**
- For each task with `**Depends:** A, B`, add directed edges `A → task` and `B → task` (i.e., the "enables" direction: prerequisite → dependent).
- Only active tasks (docs/tasks/) participate as traversal targets. Archived tasks are excluded.

**Algorithm:** BFS/DFS from all active root nodes following the enables-direction edges. Any task in `docs/tasks/` not reached by this traversal and not itself in the active root set is flagged as an orphan.

**Output:** `TASK-XXX is not reachable from any active node (orphan task).`

**Known limit:** BLOCKED tasks with a valid path to the active set will still appear as orphans if their DEPENDS chain doesn't connect to a READY/IN_PROGRESS task — this is correct behavior, not a false positive. A BLOCKED task with no live upstream is structurally detached.

---

### 2. `checkObsoleteGuidelines`

**Definition:** a guideline rule is obsolete if it references a path or file that no longer exists in the repository.

**Scope:** all files in `docs/guidelines/`.

**Extraction:** same pattern as the existing `checkDeadContext`:
- Backtick-quoted paths matching `docs/`, `cli/`, or repo-relative patterns
- Explicit path references in the form `path/to/file`

For each extracted path, verify existence via `fileSystem.exists()`. Non-existent paths = obsolete references.

**Output:** `docs/guidelines/core.md: dead reference 'docs/sprint/'`

**Known limit:** this detects *structural* obsolescence (dead paths), not *semantic* obsolescence (rules that are no longer relevant but reference valid paths). Semantic obsolescence is handled by THINK Phase 3.5.

---

### 3. `checkUnappliedADRs`

**Definition:** an ADR is unapplied if it has ACCEPTED status but its ID is never referenced in any task or archive file.

**Scope:**
- Source: `docs/adr/*.md` where `**Status:** ACCEPTED`
- Search target: all files in `docs/tasks/` and `docs/archive/`
- ADRs in status DRAFT, SUPERSEDED, or DEPRECATED are skipped

**Algorithm:** for each ACCEPTED ADR, extract its ID (e.g., `ADR-006`). Search for that string in all task and archive files. No match = unapplied.

**Output:** `ADR-003: ACCEPTED but never referenced in any task file.`

**Known limit:** this measures *traceability*, not *impact*. An ADR may be applied implicitly (e.g., its decision is embedded in architecture without a task reference). This is a conscious design constraint — determinism requires explicit references.

Extension point: when `docs/intents/` is introduced, IDEA files should also be included in the search target.

---

## Tier 2: THINK Phase 3.5 — Semantic Drift Analysis

`docs/agents/THINK.md` gains a new phase inserted between Phase 3 (Idea Refinement) and Phase 4 (Kaizen).

### Placement

```
THINK
 ├── Phase 1: Governance & Replenishment
 ├── Phase 2: Refinement Execution
 ├── Phase 3: Idea Refinement
 ├── Phase 3.5: Semantic Drift Analysis   ← NEW
 └── Phase 4: Continuous Kaizen
```

### Trigger

Phase 3.5 runs after Phase 3 on every THINK invocation. It may be skipped under explicit time pressure — the agent must note this in the terminal report.

### Inputs

| Source | What is read |
|--------|-------------|
| `docs/guidelines/*.md` | Full content of all guideline files |
| `docs/adr/*.md` | ACCEPTED ADRs — Context and Decision sections |
| `docs/tasks/` | Meta lines + ACs only |
| `docs/archive/` | Meta lines only |
| `docs/refinement/IDEA-*.md` | DRAFT and PROMOTED entries |

### Analysis scope

1. **Conceptual contradictions:** two guideline sections asserting conflicting behaviors for the same domain. Example: commit frequency rules stated differently in `core.md` and `bugs.md`.

2. **Structural duplication:** materially identical sections or rules in more than one guideline file — candidates for consolidation.

3. **ADR conceptual drift:** ACCEPTED ADRs whose stated rationale conflicts with how the system currently operates, judged against active tasks and current guidelines.

### Output

Ephemeral terminal report (same format as other THINK phase output). Findings that warrant action are filed as new IDEA files in `docs/refinement/` — never as tasks directly.

**Contract:** Phase 3.5 produces insight, not verdicts. Its output feeds Phase 3 (refinement queue) and Phase 4 (Kaizen). It never feeds DriftChecker.

### Distinction from Phase 3

| Phase 3 | Phase 3.5 |
|---------|-----------|
| Task-oriented | System-oriented |
| Evaluates individual IDEAs | Evaluates cross-cutting patterns |
| Local signal | Global signal |

Both phases produce IDEAs. This is intentional — they are distinct IDEA classes. Future design may formalize this distinction with a source tag (e.g., `Source: Phase-3.5`).

---

## Implementation Scope

### In scope

- 3 new methods in `DriftChecker`: `checkOrphanTasks`, `checkObsoleteGuidelines`, `checkUnappliedADRs`
- Each method registered in `check()` alongside existing 17 checks
- Unit tests for all three new checks
- `docs/agents/THINK.md` updated with Phase 3.5 protocol
- ADR documenting the active root set definition and the two-tier separation

### Out of scope

- No TypeScript for Phase 3.5 execution (protocol-only)
- No LLM call infrastructure in the CLI
- No `arch analyze` command
- INTENT nodes in the active root set (extension point only)

---

## Extension Points

- **Active Root Set → INTENT-centric model**: the current root set is execution-centric (READY/IN_PROGRESS tasks). When `docs/intents/` is introduced with CAPTURED/PROMOTED statuses, those nodes become the true causal origin. This is a paradigm shift — the system moves from "what is currently executing" to "what is currently intended." Plan this transition deliberately; it changes the semantics of every orphan result.
- **checkUnappliedADRs**: include IDEA files in the search target when intents are formalized.
- **Phase 3.5 IDEA source typing**: Phase 3 produces task-oriented IDEAs; Phase 3.5 produces system-oriented IDEAs. When the IDEA volume scales, add a `Source: phase-3 | phase-3.5` field to `IDEA-*.md` files so the system knows why each IDEA exists. Without this, the refinement queue loses provenance.
- **Phase 3.5 scope control**: Phase 3.5 is a global observer layer. It will tend to grow if not constrained. Consider a max-output rule (e.g., at most 3 new IDEAs per THINK run from Phase 3.5) to prevent it from flooding the refinement queue.
