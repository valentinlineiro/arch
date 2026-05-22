# arch capture — Design Spec

**Date:** 2026-05-07
**Scope:** ARCH 1.0.0 — FASE 1: REDUCCIÓN MASIVA DE FRICCIÓN, FEATURE 1
**Status:** Approved

---

## Summary

`arch capture` introduces a new entity — INTENT — and a new primitive: append-only signal ingestion. It is not a task-creation command. It captures potential operational signal with near-zero friction, preserving human intention without forcing premature structure.

THINK gains a new first phase — Intent Operationalization — that transforms captured signals into operational artifacts under human governance.

This design introduces pre-operational cognition into ARCH: the ability to model uncertainty, ambiguity, and weak signals before they become executable work.

---

## Core Pipeline

```
CAPTURE → INTENT (CAPTURED)
       → THINK: Intent Operationalization
       → PROMOTED (→ TASK draft) | SIGNAL | SUPERSEDED | DISCARDED
       → Human confirms READY
```

---

## Entity: INTENT

**Location:** `docs/intents/INTENT-NNN.md`
**ID counter:** separate from TASK-NNN (starts at INTENT-001)

### File format

```yaml
---
id: INTENT-014
schema_version: 1
status: CAPTURED
created_at: 2026-05-07T14:32:00Z
updated_at: 2026-05-07T14:32:00Z

origin:
  source: cli              # cli | voice | webhook | ... (extensible)
  branch: feat/auth
  cwd: cli/src/main/ts     # relative to repo root when inside repo
  triggered_by: capture
  recent_files:            # operational context, NOT confirmed causality
    - cli/src/main/ts/domain/services/sandbox.ts
    - cli/src/main/ts/application/commands/exec-command.ts

interpretations: []        # append-only; populated by THINK, never by capture

promoted_to: []            # [TASK-104, ADR-009, ...]; set on promotion; INTENT persists
superseded_by: []          # [TASK-077, INTENT-009]; set when SUPERSEDED
---

auth flow feels too fragmented
```

**Body is the canonical signal.** Frontmatter is metadata and lifecycle only — no duplication.

### Lifecycle states

| State | Meaning |
|---|---|
| `CAPTURED` | Raw signal, awaiting interpretation |
| `PROMOTED` | Transformed into operational artifact(s); `promoted_to` populated |
| `SIGNAL` | Retained operational knowledge — friction, pattern, systemic observation. Not a soft discard. |
| `SUPERSEDED` | Absorbed by existing TASK or INTENT; `superseded_by` populated |
| `DISCARDED` | No signal value; closed with reason |

### Invariants

- `arch capture` only writes: `id`, `schema_version`, `status: CAPTURED`, `created_at`, `updated_at`, `origin`, empty `interpretations`, empty `promoted_to`, empty `superseded_by`, and body text.
- `interpretations` is append-only. No entry is ever overwritten.
- INTENT files are never deleted. INTENT is a permanent causal record.
- `promoted_to` may contain multiple entries (e.g. TASK + ADR).
- `SIGNAL` is not discard. Signals may recur, cluster, or reveal systemic drift.

---

## Command: `arch capture`

### Invocation

```
arch capture "auth flow feels too fragmented"
arch capture "maybe we need offline support"
```

Multiple words without quotes are joined as raw intent (forgiving by design).

### Behavior

Strictly local. No LLM. No network. Offline-friendly.

1. Read next INTENT ID from `docs/intents/`
2. Read local context:
   - `git branch --show-current` → branch
   - `git diff --cached --name-only` → staged files
   - `git diff --name-only` → modified unstaged files
   - `cwd` relative to repo root if inside repo, absolute otherwise
3. Write `docs/intents/INTENT-NNN.md`
4. Print: `INTENT-NNN captured.`

**Target latency:** <1 second.

### Output

```
INTENT-014 captured.
```

Nothing else. No summaries, no hints, no analysis.

### Edge cases

| Case | Behavior |
|---|---|
| No argument | Error: `arch capture requires an intent string` |
| `docs/intents/` does not exist | Create on first capture |
| Git unavailable | `branch` and `recent_files` omitted; `cwd` uses absolute path |

### What it does NOT do

- No validation of intent quality
- No duplicate detection
- No LLM call
- No THINK invocation
- No task creation

---

## THINK Integration

### Phase order (updated)

```
Phase 1 — Intent Operationalization   ← new; fresh signals processed first
Phase 2 — Governance & Replenishment
Phase 3 — Refine IDEAs
Phase 4 — Kaizen
```

Each phase has strict input/output boundaries. No cross-phase logic.
- Phase 1 does not perform governance.
- Phase 2 does not interpret signals.
- Phase 3 does not create tasks from intents.

### Phase 1: Intent Operationalization

THINK scans `docs/intents/` for `status: CAPTURED` and processes each.

**Assessment → outcome:**

| Assessment | Outcome | Status |
|---|---|---|
| Can be transformed into bounded operational work | Create TASK draft; human confirms READY | `PROMOTED` |
| Retained operational knowledge (friction, pattern, systemic drift) | Record interpretation; preserve as memory | `SIGNAL` |
| Absorbed by existing TASK or INTENT | Populate `superseded_by` | `SUPERSEDED` |
| No signal value | Close with reason | `DISCARDED` |

**After processing, THINK appends to `interpretations`:**

```yaml
interpretations:
  - timestamp: 2026-05-07T15:00:00Z
    actor: THINK
    classification: architectural-concern   # bug | refactor | arch-concern | friction | research | signal-only
    notes: "maps to ADR-002 concern, related to TASK-077"
    confidence: low   # low | medium | high — hint only
```

**`confidence` is a non-operational hint.** It does not affect routing, promotion, or state transitions. It must never be used as a decision driver.

### Governance invariant

THINK sets status and populates `interpretations`. For PROMOTED intents, THINK creates a TASK draft but does NOT set `READY`. Human confirms `READY`.

```
capture → signal preserved
THINK  → signal interpreted
human  → execution legitimized
```

---

## Architectural notes

### INTENT as causal record

INTENT is not a staging area for tasks. It is the origin of operational work.

```
INTENT-014 → TASK-104 → ADR-009 → GUIDELINE-021
```

This chain enables retros, causal analysis, and organizational memory.

### SIGNAL as retained knowledge

SIGNAL intents are not failures. They are weak signals that may:
- Recur across multiple captures
- Cluster into epics or ADR concerns
- Reveal systemic friction invisible at the task level

Future enrichment (async, not in 1.0.0) will operate primarily on SIGNALs.

### THINK as composed protocol

THINK currently owns: signal interpretation, governance, idea refinement, kaizen. This is a known accumulation risk. The mitigation is strict phase isolation — not decomposition yet. Each phase has a defined responsibility and must not bleed into adjacent phases. Future direction: THINK as a composed set of named sub-protocols (signal interpreter, planner, historian, optimizer).

### Known risks

- **THINK accumulation:** Four phases in one protocol is a known risk. Mitigation is strict phase isolation. Future direction: named sub-protocols. Do not add cross-phase logic.
- **`confidence` contract:** Currently "hint only, never a decision driver." If any future module (ranking, clustering) reads it indirectly, silent drift is introduced. Formal resolution: either remove it or declare it a pure annotation field with no operational consumers.
- **`recent_files` is not memory:** It is a contextual noise snapshot — operational context at capture time. Must not be treated as semantic relatedness or used as a memory primitive.
- **Implicit intent type gap:** INTENT has no structured type field (bug / idea / observation / question). This is intentionally deferred to THINK's classification. Will become a friction point at scale — consider adding a lightweight `hint_type` field in a future schema version.

### Deferred to post-1.0.0

- Async enrichment (domain detection, related file analysis, LLM-based classification)
- `related_intents` / `cluster_id` for clustering relationships
- `actor.version` for interpretation replay
- Multi-source capture (voice, webhook, mobile)
- Event log (`INTENT_CAPTURED`, `TASK_PROMOTED`, etc.)
- Duplicate detection in capture
