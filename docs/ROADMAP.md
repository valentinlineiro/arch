# ROADMAP.md
<!-- ARCH Strategic Roadmap | v0.6.0 → 1.0.0 → 2.0 -->
<!-- Updated: 2026-05-08 -->

## Identity

> **ARCH is a git-native operational protocol for human+AI collaborative work.**

This definition is frozen. ARCH is not an autonomous AGI swarm, a no-code platform, a chat UI, a SaaS workspace, a Jira replacement, or a second brain.

## Fundamental Principle

> Each new layer must reduce net friction. If a proposed feature increases complexity without eliminating cognitive load, reject it.

## Legend

| Status | Meaning |
|--------|---------|
| `DONE` | Fully implemented, verified, and stable |
| `IN PROGRESS` | Active task or ADR in flight |
| `PARTIAL` | Foundational work exists; key gaps remain |
| `NOT STARTED` | No task, ADR, or IDEA has begun execution |

---

## Phase 0 — Conceptual Consolidation

**Objective:** Close the mental model. Freeze invariants: what ARCH is, what it is not, and the operational model that governs it.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Identity definition frozen | `PARTIAL` | [docs/PRINCIPLES.md](PRINCIPLES.md) |
| Operational model frozen (TASK / THINK / DO / REVIEW / RETRO / GUIDELINES / ADR) | `DONE` | [docs/GOVERNANCE.md](GOVERNANCE.md) |
| Semantic stability (no constant renaming of core concepts) | `PARTIAL` | — |

---

## Phase 1 — Friction Reduction

**Objective:** Eliminate ceremonial work. The system should feel like an operational copilot, not a documentation burden.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| `arch capture` — intent capture with auto-generated task, ACs, complexity, context | `IN PROGRESS` | [TASK-210](tasks/TASK-210.md), [IDEA-roadmap-arch-capture](refinement/IDEA-roadmap-arch-capture.md) |
| Auto Context Engine — infer relevant files, commits, ADRs, guidelines per task | `IN PROGRESS` | [TASK-210](tasks/TASK-210.md), [IDEA-roadmap-auto-context-engine](refinement/IDEA-roadmap-auto-context-engine.md) |
| Automatic entity linking — tasks↔commits, ADRs↔tasks, guidelines↔failures | `NOT STARTED` | [IDEA-roadmap-automatic-linking](refinement/IDEA-roadmap-automatic-linking.md) |
| Drift detection — orphan tasks, dead refs, unapplied ADRs, stale guidelines | `DONE` | [ADR-013](adr/ADR-013-two-tier-drift-detection.md), [TASK-215](archive/TASK-215.md), [IDEA-roadmap-drift-detection](refinement/IDEA-roadmap-drift-detection.md) |

---

## Phase 2 — Memory System

**Objective:** Move from documentation to operative memory. ARCH should understand, not just record.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Layer 1: Operational Memory (tasks, commits, retros, failures) | `PARTIAL` | docs/archive/ (193+ tasks), docs/RETRO.md |
| Layer 2: Decision Memory (ADRs, rationale, rejected alternatives) | `DONE` | docs/adr/ (13 ADRs) |
| Layer 3: Pattern Memory (bug classes, workflow failures, productivity patterns) | `PARTIAL` | [docs/PRINCIPLES.md](PRINCIPLES.md), [docs/KAIZEN-LOG.md](KAIZEN-LOG.md) |
| Layer 4: Semantic Memory (conceptual relationships between entities) | `PARTIAL` | [TASK-210](tasks/TASK-210.md) (ContextIndex) |
| `arch ask` — memory queries that produce causal patterns and recommendations | `NOT STARTED` | [IDEA-roadmap-memory-queries](refinement/IDEA-roadmap-memory-queries.md) |

---

## Phase 3 — Routing Engine

**Objective:** Separate intent from execution. ARCH decides model, cost, context, and depth — not the human.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Intelligent routing by task class, size, and provider | `DONE` | [ADR-011](adr/ADR-011-unified-provider-strategies.md), [ADR-013](adr/ADR-013-two-tier-drift-detection.md), [IDEA-roadmap-routing-engine](refinement/IDEA-roadmap-routing-engine.md) |

---

## Phase 4 — Policy Engine

**Objective:** Convert `arch review` into governance. Structural constraints become machine-enforced invariants.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Structural policies (forbidden deps, arch boundaries, naming invariants, mandatory tests) | `NOT STARTED` | [IDEA-roadmap-structural-policies](refinement/IDEA-roadmap-structural-policies.md) |
| AI-proposed policies (ARCH detects patterns → proposes guidelines → human approves) | `NOT STARTED` | [IDEA-roadmap-ai-proposed-policies](refinement/IDEA-roadmap-ai-proposed-policies.md) |

---

## Phase 5 — Temporal & Energy Model

**Objective:** Model operational reality — cognitive load, WIP, fatigue, and recovery cycles.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Operational load tracking (WIP, cognitive cost, rework, fatigue) | `NOT STARTED` | [IDEA-roadmap-operational-load](refinement/IDEA-roadmap-operational-load.md) |
| Adaptive planning (task states beyond READY/IN_PROGRESS: blocked-by-energy, high-cognitive-cost) | `NOT STARTED` | [IDEA-roadmap-adaptive-planning](refinement/IDEA-roadmap-adaptive-planning.md) |

---

## Phase 6 — Domain Packs

**Objective:** Convert ARCH into a universal protocol applicable beyond software engineering.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Software pack | `PARTIAL` | (implicit in current design) |
| Startup / Household / Personal packs | `NOT STARTED` | [IDEA-roadmap-domain-packs](refinement/IDEA-roadmap-domain-packs.md) |

---

## Phase 7 — Multiagent Runtime

**Objective:** Formalize the agent layer. Only viable once memory, routing, and policies exist.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| THINK / DO agents | `DONE` | docs/agents/THINK.md, docs/agents/DO.md |
| Chronicle — Causal Event Graph | `PARTIAL` | [TASK-212](archive/TASK-212.md) (Phase 1 done) |
| Planner / Historian / Reviewer / Conductor / Optimizer agents | `NOT STARTED` | [IDEA-roadmap-multiagent-runtime](refinement/IDEA-roadmap-multiagent-runtime.md) |

---

## Phase 8 — The Moat

**Objective:** Accumulate operational memory that is irreplaceable. The competitive advantage is not the CLI — it is the institutional knowledge that compounds inside the repo.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Operational memory accumulation | `IN PROGRESS` | docs/archive/ (193+ tasks), docs/KAIZEN-LOG.md |
| Causal event graph (Chronicle) | `PARTIAL` | [TASK-212](archive/TASK-212.md) |
| Cross-task pattern distillation | `NOT STARTED` | [IDEA-oracle-archive-distillation](refinement/IDEA-oracle-archive-distillation.md) |
