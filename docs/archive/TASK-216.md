## TASK-216: Reflect strategic roadmap into ROADMAP.md and IDEA files
**Meta:** P1 | S | DONE | Focus:yes | 3-writing | claude-code | docs/ROADMAP.md docs/refinement/
**Depends:** none

### Context
A strategic roadmap for ARCH → 1.0.0 → 2.0 was defined covering 8 phases: Conceptual Consolidation, Friction Reduction, Memory System, Routing Engine, Policy Engine, Temporal/Energy Model, Domain Packs, Multiagent Runtime, and The Moat. This task reflects that roadmap into two durable project artifacts: a living `docs/ROADMAP.md` tracking phase progress, and 12 IDEA files seeding the refinement backlog with all roadmap features (4 DECIDED pointing to existing tasks/ADRs, 8 PENDING with roadmap rationale pre-filled).

Design spec: `docs/superpowers/specs/2026-05-08-roadmap-reflection-design.md`

### Acceptance Criteria
- [x] `docs/ROADMAP.md` exists with identity statement, fundamental principle, legend, and 8 phase sections each containing a progress table → file: `docs/ROADMAP.md`
- [x] 4 DECIDED IDEAs exist in `docs/refinement/` pointing to their existing task/ADR → files: `IDEA-roadmap-arch-capture.md`, `IDEA-roadmap-auto-context-engine.md`, `IDEA-roadmap-drift-detection.md`, `IDEA-roadmap-routing-engine.md`
- [x] 8 PENDING IDEAs exist with roadmap rationale pre-filled and blank Decision section → files: `IDEA-roadmap-automatic-linking.md`, `IDEA-roadmap-memory-queries.md`, `IDEA-roadmap-structural-policies.md`, `IDEA-roadmap-ai-proposed-policies.md`, `IDEA-roadmap-operational-load.md`, `IDEA-roadmap-adaptive-planning.md`, `IDEA-roadmap-domain-packs.md`, `IDEA-roadmap-multiagent-runtime.md`
- [x] `arch review` passes → command: `arch review`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.

## Hansei
The roadmap reflection converts an informal strategic vision into a navigable artifact within ARCH's own conventions. The key design decision — DECIDED IDEAs as closed index records rather than active proposals — prevents the backlog from being polluted with work already in flight while still giving ROADMAP.md a complete, linked index of all features. The PENDING IDEAs include the full strategic rationale, which means a future THINK session can evaluate them without needing to reconstruct context from scratch.
