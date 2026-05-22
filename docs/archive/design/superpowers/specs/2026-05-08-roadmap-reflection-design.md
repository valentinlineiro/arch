# Design: Roadmap Reflection
**Date:** 2026-05-08
**Status:** APPROVED

## Overview

Reflect the strategic ARCH roadmap into two durable project artifacts: a living `docs/ROADMAP.md` that tracks progress across 8 phases, and 12 IDEA files that seed the refinement backlog with all roadmap features.

## Artifact 1: `docs/ROADMAP.md`

### Structure

```
# ROADMAP.md
[Identity statement — frozen]
[Fundamental Principle — anti-hype constraint]
[Legend — status values]

## Phase 0 — Conceptual Consolidation
[objective]
[progress table: Feature | Status | Key Artifact]

## Phase 1 — Friction Reduction
...

## Phase 2 — Memory System
...

## Phase 3 — Routing Engine
...

## Phase 4 — Policy Engine
...

## Phase 5 — Temporal & Energy Model
...

## Phase 6 — Domain Packs
...

## Phase 7 — Multiagent Runtime
...

## Phase 8 — The Moat
...
```

### Progress table format (per phase)

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| arch capture | IN PROGRESS | TASK-210 |

### Status values

- `DONE` — fully implemented, verified, and stable
- `IN PROGRESS` — active task or ADR in flight
- `PARTIAL` — foundational work exists; key gaps remain
- `NOT STARTED` — no task, ADR, or IDEA has begun execution

### Progress snapshot

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Conceptual Consolidation | PARTIAL | Identity frozen; Hansei/semantic gaps remain |
| 1 — Friction Reduction | IN PROGRESS | arch capture + auto-context active (TASK-210); drift detection DONE; auto-linking not started |
| 2 — Memory System | PARTIAL | Layers 1–2 done (tasks/ADRs/KAIZEN); arch ask not started |
| 3 — Routing Engine | DONE | ADR-011 unified strategies; ADR-013 |
| 4 — Policy Engine | NOT STARTED | |
| 5 — Temporal & Energy Model | NOT STARTED | |
| 6 — Domain Packs | NOT STARTED | Software pack implicit in current design |
| 7 — Multiagent Runtime | PARTIAL | THINK/DO agents exist; Chronicle Phase 1 done; Planner/Historian/Optimizer not built |
| 8 — The Moat | IN PROGRESS | Memory accumulating; Chronicle seeding causal graph |

## Artifact 2: IDEA files

### Naming convention

All files use the `IDEA-roadmap-` prefix to namespace them from organic IDEAs.

### DECIDED IDEAs (closed records)

These exist only to complete the index. They point to the task or ADR that owns the work. No new tasks will be created from them.

| File | Points to |
|------|-----------|
| `IDEA-roadmap-arch-capture.md` | TASK-210 |
| `IDEA-roadmap-auto-context-engine.md` | TASK-210 |
| `IDEA-roadmap-drift-detection.md` | ADR-013, TASK-215 |
| `IDEA-roadmap-routing-engine.md` | ADR-011, ADR-013 |

### PENDING IDEAs (actionable)

These are ready for THINK evaluation. Each includes the roadmap's rationale pre-filled. Decision section is blank — human must write it to promote.

| File | Roadmap Feature | Related existing IDEAs |
|------|----------------|------------------------|
| `IDEA-roadmap-automatic-linking.md` | Feature 3 — entity auto-linking | — |
| `IDEA-roadmap-memory-queries.md` | Feature 5 — `arch ask` | `IDEA-rag-context-retrieval.md`, `IDEA-oracle-archive-distillation.md`, `IDEA-institutional-memory-document.md` |
| `IDEA-roadmap-structural-policies.md` | Feature 7 — forbidden deps, naming invariants | `IDEA-formal-protocol-invariants.md` |
| `IDEA-roadmap-ai-proposed-policies.md` | Feature 8 — AI-proposed guidelines | `IDEA-do-step-registry-for-kaizen.md` |
| `IDEA-roadmap-operational-load.md` | Feature 9 — cognitive load, WIP, fatigue tracking | — |
| `IDEA-roadmap-adaptive-planning.md` | Feature 10 — task states for energy/context | `IDEA-context-control.md`, `IDEA-cost-aware-protocol.md` |
| `IDEA-roadmap-domain-packs.md` | Phase 6 — software/startup/household/personal packs | `IDEA-separate-arch-core-from-content.md`, `IDEA-open-standard-portability.md`, `IDEA-multi-repo-arch.md` |
| `IDEA-roadmap-multiagent-runtime.md` | Phase 7 — Planner/Historian/Reviewer/Conductor/Optimizer | `IDEA-parallel-tasks.md`, `IDEA-handle-parallelism.md`, `IDEA-loop-load-balancing.md` |

### IDEA file template (PENDING)

```markdown
# IDEA: [Feature name]
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** PENDING

## Proposal
[What this feature is and what it does]

## Rationale
[Roadmap rationale verbatim or paraphrased — why this feature matters strategically]

## Related IDEAs
[Cross-references to overlapping existing IDEAs]

## Decision

```

### IDEA file template (DECIDED)

```markdown
# IDEA: [Feature name]
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED

## Proposal
[What this feature is]

## Rationale
[Why it matters]

## Decision
PROMOTE → [TASK-XXX / ADR-XXX]
```

## Constraints

- DECIDED IDEAs must not trigger new task creation — they are index records only.
- ROADMAP.md is a living document; it must be updated when tasks related to roadmap features are archived DONE.
- The `IDEA-roadmap-` namespace distinguishes these from organic IDEAs emerging from THINK sessions.
- No tasks are created as part of this work — only the doc and the IDEA files.
