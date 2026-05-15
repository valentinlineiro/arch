# INBOX

## Loop Status
- **Active Tasks:** 0
- **Ready Tasks:** 20
- **Pending Promotion:** 29
- **Pending Review:** 1 (TASK-247)

## Refinement Queue (29)
- IDEA: Ontological Tension Detection — a new artifact class and detection capability (IDEA-architectural-tension-capture.md)
- IDEA: automate-turn-count-recording (IDEA-automate-turn-count-recording.md)
- idea: Agent context control (IDEA-context-control.md)
- IDEA: cross-layer-coverage-identity (IDEA-cross-layer-coverage-identity.md)
- IDEA: `arch task done` — Socratic Hansei Wizard (IDEA-daas-hansei-wizard.md)
- IDEA: Discipline as a Service (DaaS) — Vision (IDEA-daas-vision.md)
- IDEA: dynamic-model-provisioning (IDEA-dynamic-model-provisioning.md)
- IDEA: excision-structural-consistency-check (IDEA-excision-legitimacy-check.md)
- IDEA: Feature branch workflow — fully automatic branch-per-task execution (IDEA-feature-branch-workflow.md)
- IDEA: fix-phase-naming-drift (IDEA-fix-phase-naming-drift.md)
- IDEA: focus-status-alignment (IDEA-focus-status-alignment.md)
- IDEA: Grandfather legacy tasks in arch review (IDEA-grandfather-legacy-tasks.md)
- IDEA: inbox-approval-gate-reads (IDEA-inbox-approval-gate-reads.md)
- IDEA: Loop mode load balancing (IDEA-loop-load-balancing.md)
- IDEA: OpenClaw integration — mobile bridge for ARCH (IDEA-openclaw-integration.md)
- IDEA: optimize-decomposition-for-local-llms (IDEA-optimize-decomposition-for-local-llms.md)
- idea: Parallel task execution with merge conflict handling (IDEA-parallel-tasks.md)
- IDEA: RAG context retrieval — semantic search over ARCH corpus (IDEA-rag-context-retrieval.md)
- IDEA: Adaptive planning — task states that model energy, context, and cognitive cost (IDEA-roadmap-adaptive-planning.md)
- IDEA: AI-proposed policies — ARCH detects patterns and proposes guidelines for human approval (IDEA-roadmap-ai-proposed-policies.md)
- IDEA: Automatic entity linking — tasks, commits, ADRs, and guidelines auto-connect (IDEA-roadmap-automatic-linking.md)
- IDEA: Roadmap — Deterministic Drift & Contextual Checks (IDEA-roadmap-deterministic-drift.md)
- IDEA: Domain packs — protocol extensions for software, startup, household, and personal use (IDEA-roadmap-domain-packs.md)
- IDEA: arch ask — memory queries over the full ARCH operational corpus (IDEA-roadmap-memory-queries.md)
- IDEA: Multiagent runtime — Planner, Historian, Reviewer, Conductor, Optimizer agents (IDEA-roadmap-multiagent-runtime.md)
- IDEA: Operational load tracking — model cognitive load, WIP, fatigue, and rework (IDEA-roadmap-operational-load.md)
- IDEA: Structural policies — machine-enforced architectural boundaries in arch review (IDEA-roadmap-structural-policies.md)
- IDEA: Sentinel call log infrastructure (IDEA-sentinel-log-infrastructure.md)
- IDEA: task-template-linter (IDEA-task-template-linter.md)

## Recently Completed
- TASK-892: arch task create - Template-based Acceptance Criteria
- TASK-891: arch task create - Instant Task Scaffolding
- TASK-890: arch task start - Contextual Memory Injection
- TASK-889: arch task edit - Interactive Metadata Management
- TASK-248: Fix arch review drift warnings - dead context paths and missing Hansei sections

---

## [2026-05-14 15:35] REVIEW_REQUEST | TASK-247
TASK-247 Focus Sovereignty Model is ready for audit.

**What was built:**
- `focus-ledger.ts`: FocusRuling type + parseLedger/committedRulings/serializeLedger
- `govern-system.ts`: 6-rule AGFM tick cycle replacing naive focus assignment
- `review-system.ts`: FOCUS_INTEGRITY_VIOLATION + FOCUS_SOVEREIGNTY detection
- 8 unit tests covering all AC scenarios

**Verified live:**
- First govern tick: INTEGRITY_FIX emitted for TASK-207 and TASK-247 (migration case), FOCUS_ACQUIRED for TASK-245
- `arch review` passes after govern tick
- `.arch/focus-ledger.jsonl` contains ruling for every tick

**Known divergence (see Hansei):**
ADR-020 ruling names differ from AGFM ruling names. AGFM is authoritative for implementation.
