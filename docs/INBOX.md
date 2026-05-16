# INBOX

## Loop Status
- **Active Tasks:** 0
- **Ready Tasks:** 20
- **Pending Promotion:** 28 (IDEA-context-control TTL-archived this session)
- **Pending Review:** 1 (TASK-247)

## Pending Escalations
- `AWAITING_PROMOTION` (open): IDEA-roadmap-adaptive-planning, IDEA-roadmap-ai-proposed-policies, IDEA-roadmap-automatic-linking, IDEA-roadmap-domain-packs, IDEA-roadmap-memory-queries, IDEA-roadmap-multiagent-runtime, IDEA-roadmap-operational-load, IDEA-roadmap-structural-policies, IDEA-sentinel-log-infrastructure, IDEA-task-template-linter
- `AWAITING_PROMOTION` (new this session): IDEA-daas-vision, IDEA-daas-hansei-wizard

## Refinement Queue (28)
- IDEA: Ontological Tension Detection — a new artifact class and detection capability (IDEA-architectural-tension-capture.md)
- IDEA: automate-turn-count-recording (IDEA-automate-turn-count-recording.md)
- IDEA: cross-layer-coverage-identity (IDEA-cross-layer-coverage-identity.md)
- IDEA: `arch task done` — Socratic Hansei Wizard ⭐ structurally admissible, REVIEW session 1 (IDEA-daas-hansei-wizard.md)
- IDEA: Discipline as a Service (DaaS) — Vision ⭐ partially executed (Features 1–3 done), session 1 (IDEA-daas-vision.md)
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
- TASK-892: arch task create - Template-based Acceptance Criteria (P1|S)
- TASK-891: arch task create - Instant Task Scaffolding (P1|M)
- TASK-890: arch task start - Contextual Memory Injection (P1|M)
- TASK-889: arch task edit - Interactive Metadata Management (P1|S)
- TASK-248: Fix arch review drift warnings - dead context paths and missing Hansei sections (P2|XS)

---

## [2026-05-15] THINK_NOTE | arch report INVALID
`arch report` returned `CRITICAL INTEGRITY BREACH` with 0% confidence. Metrics engine shows cycle time only for 1 task. Likely: focus-ledger migration edge case or missing cost metadata. Needs investigation before next metrics review.

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

## [AWAITING_REVIEW] TASK-898 [L3-AUTO]
**Closed:** 2026-05-16T20:58:16.027Z
**Title:** Fix malformed archive meta lines and add pre-archive guard

| AC | Type | Pass | Detail |
|---|---|---|---|
| Scan all files in `docs/archive/TASK-*.md` for malformed met | cmd | ✔ | exit 0 (expected 0) |
| Backfill missing Size and Class fields in any malformed arch | file | ✔ | exists: docs/archive/ |
| Add `checkArchiveMetaIntegrity` check to `DriftChecker`: sca | cmd | ✔ | exit 0 (expected 0) |
| `arch review` passes clean after implementation. | cmd | ✔ | exit 0 (expected 0) |
| `arch report` exits 0 after backfill (no CRITICAL INTEGRITY  | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-900 [L3-AUTO]
**Closed:** 2026-05-16T22:03:51.465Z
**Title:** Replace INBOX.md approval-gate reads with .arch/approvals.jsonl

| AC | Type | Pass | Detail |
|---|---|---|---|
| `EscalationStore` extended with `APPROVED` and `REDIRECT` ty | file | ✔ | exists: cli/src/main/ts/application/use-cases/escalation-sto |
| `sandbox-command.ts` no longer reads `docs/INBOX.md`. Instea | file | ✔ | exists: cli/src/main/ts/application/commands/sandbox-command |
| `loop-engine.ts handleResume()` no longer reads `docs/INBOX. | file | ✔ | exists: cli/src/main/ts/application/use-cases/loop-engine.ts |
| `docs/INBOX.md` retains a human-readable prose summary of pe | file | ✔ | exists: cli/src/main/ts/application/commands/sandbox-command |
| `arch review` passes. | cmd | ✔ | exit 0 (expected 0) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |
