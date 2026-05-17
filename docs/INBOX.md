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

## [AWAITING_REVIEW] TASK-903 [L3-AUTO]
**Closed:** 2026-05-16T22:21:28.401Z
**Title:** Focus-Status alignment drift check in arch review

| AC | Type | Pass | Detail |
|---|---|---|---|
| `DriftChecker.checkFocusStatusAlignment()` added: scans all  | prose | ✔ | prose: human-verified (non-automated) |
| `checkFocusStatusAlignment` registered in `DriftChecker.chec | file | ✔ | exists: cli/src/main/ts/application/use-cases/drift-checker. |
| Unit test: IN_PROGRESS + Focus:no → WARN. READY + Focus:yes  | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-904 [L3-AUTO]
**Closed:** 2026-05-16T22:23:17.592Z
**Title:** ExcisionStructuralCheck: structural consistency gates for protected path deletions

| AC | Type | Pass | Detail |
|---|---|---|---|
| `DriftChecker.checkExcisionStructure()` added. When the last | cmd | ✔ | exit 0 (expected 0) |
| `EscalationMaturity` check updated: when last commit deletes | file | ✔ | exists: cli/src/main/ts/application/use-cases/drift-checker. |
| `checkExcisionStructure` result is surfaced as a named check | cmd | ✔ | exit 0 (expected 0) |
| Unit tests: all-pass case, Gate 1 fail (orphan reference), G | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | cmd | ✔ | exit 0 (expected 0) |

## [AWAITING_REVIEW] TASK-905 [L3-AUTO]
**Closed:** 2026-05-16T22:28:46.126Z
**Title:** Automate turn-count recording in arch task done

| AC | Type | Pass | Detail |
|---|---|---|---|
| `MarkTaskDone.execute()` computes turn count from git log wh | file | ✔ | exists: cli/src/main/ts/application/use-cases/mark-task-done |
| Turn count is written to the task file as `**Turns:** N` in  | file | ✔ | exists: cli/src/main/ts/infrastructure/filesystem/markdown-t |
| `arch report` cycle-time output uses the recorded Turns fiel | prose | ✔ | prose: human-verified (non-automated) |
| Unit test: task with `lockedCommit` set → turns computed fro | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-907 [L3-AUTO]
**Closed:** 2026-05-16T22:30:49.784Z
**Title:** Task template linter: validate TASK-FORMAT schema in arch review

| AC | Type | Pass | Detail |
|---|---|---|---|
| `DriftChecker.checkTaskTemplateCompliance()` added: scans al | cmd | ✔ | exit 0 (expected 0) |
| `checkTaskTemplateCompliance` registered in `DriftChecker.ch | file | ✔ | exists: cli/src/main/ts/application/use-cases/drift-checker. |
| `docs/TASK-FORMAT.md` updated with a machine-readable schema | file | ✔ | exists: docs/TASK-FORMAT.md |
| Unit tests: valid task → OK. Missing Size → WARN. Invalid Pr | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | cmd | ✔ | exit 0 (expected 0) |

## [AWAITING_REVIEW] TASK-899 [L3-AUTO]
**Closed:** 2026-05-16T22:32:23.919Z
**Title:** Grandfather legacy tasks in HanseiPresent drift check

| AC | Type | Pass | Detail |
|---|---|---|---|
| `DriftChecker.checkHanseiPresent()` reads `governance.hansei | file | ✔ | exists: cli/src/main/ts/application/use-cases/drift-checker. |
| `arch review` produces zero HanseiPresent WARNs for pre-thre | cmd | ✔ | exit 0 (expected 0) |
| `arch review` still WARNs on post-threshold tasks missing a  | cmd | ✔ | exit 0 (expected 0) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-902 [L3-AUTO]
**Closed:** 2026-05-16T22:37:18.165Z
**Title:** Pre-implementation detection: arch task next --verify

| AC | Type | Pass | Detail |
|---|---|---|---|
| `arch task next --verify` runs `DeterministicACVerifier.veri | cmd | ✔ | exit 0 (expected 0) |
| If all `cmd:` and `file:` predicates pass AND evidence conta | cmd | ✔ | exit 0 (expected 0) |
| If any predicate fails or evidence is prose-only: no warning | cmd | ✔ | exit 0 (expected 0) |
| `arch task next` (without `--verify`) is unchanged — no pred | cmd | ✔ | exit 0 (expected 0) |
| Unit test: focus task with all passing cmd predicates trigge | prose | ✔ | prose: human-verified (non-automated) |
| Unit test: focus task with failing cmd predicate emits no wa | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | cmd | ✔ | exit 0 (expected 0) |

## [AWAITING_REVIEW] TASK-906 [L3-AUTO]
**Closed:** 2026-05-16T22:39:21.648Z
**Title:** arch inbox --resurrect: surface TTL-rejected IDEAs for re-evaluation

| AC | Type | Pass | Detail |
|---|---|---|---|
| `GenerateInbox.getResurrectQueue()` added: reads `docs/refin | file | ✔ | exists: cli/src/main/ts/application/use-cases/generate-inbox |
| `arch inbox --resurrect` subcommand renders the resurrection | cmd | ✔ | exit 0 (expected 0) |
| THINK Phase 3 doc updated: every 20 govern ticks (or when RE | file | ✔ | exists: docs/agents/THINK.md |
| `arch review` passes. | cmd | ✔ | exit 0 (expected 0) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-908 [L3-AUTO]
**Closed:** 2026-05-17T07:11:10.293Z
**Title:** arch review --task: scoped Auditor review command

| AC | Type | Pass | Detail |
|---|---|---|---|
| `arch review --task TASK-XXX` command: runs scoped review fo | prose | ✔ | prose: human-verified (non-automated) |
| Full system review (`arch review` with no args) is unchanged | cmd | ✔ | exit 0 (expected 0) |
| `ReviewCommand` detects `--task TASK-XXX` arg and delegates  | file | ✔ | exists: cli/src/main/ts/application/commands/review-command. |
| `arch review --task` exits 1 when a `cmd:` predicate fails. | prose | ✔ | prose: human-verified (non-automated) |
| Unit tests: all-pass task → exit 0 + evidence table. Failing | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes clean after implementation. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-911 [L3-AUTO]
**Closed:** 2026-05-17T12:05:15.285Z
**Title:** Persistent session identity : Actor field in task lock

| AC | Type | Pass | Detail |
|---|---|---|---|
| `Task` model gains `actor?: string` field. | file | ✔ | exists: cli/src/main/ts/domain/models/task.ts |
| `MarkTaskInProgress.execute()` reads `actor` from `arch.conf | file | ✔ | exists: cli/src/main/ts/application/use-cases/mark-task-in-p |
| `MarkdownTaskRepository.save()` persists `Actor: <value>` al | file | ✔ | exists: cli/src/main/ts/infrastructure/filesystem/markdown-t |
| `arch report` cycle-time breakdown extended: if Actor field  | file | ✔ | exists: cli/src/main/ts/application/commands/report-command. |
| Backwards compatible: tasks without Actor field continue to  | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | prose | ✔ | prose: human-verified (non-automated) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-912 [L3-AUTO]
**Closed:** 2026-05-17T12:06:38.155Z
**Title:** arch deps TASK-XXX : dependency tree visualization

| AC | Type | Pass | Detail |
|---|---|---|---|
| `arch deps TASK-XXX` prints the dependency tree for the name | cmd | ✔ | exit 0 (expected 0) |
| `arch deps --all` prints the full dependency graph sorted by | cmd | ✔ | exit 0 (expected 0) |
| Cycle detection: if a dependency cycle exists, emit `[CYCLE] | cmd | ✔ | exit 0 (expected 0) |
| `DepsCommand` registered in `index.ts` under `arch deps`. | file | ✔ | exists: cli/src/main/ts/index.ts |
| Unit test: linear chain A→B→C renders correctly. Cycle A→B→A | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes. | cmd | ✔ | exit 0 (expected 0) |

## [AWAITING_REVIEW] TASK-913 [L3-AUTO]
**Closed:** 2026-05-17T12:20:25.341Z
**Title:** arch task split TASK-XXX : interactive task decomposition

| AC | Type | Pass | Detail |
|---|---|---|---|
| `arch task split TASK-XXX` validates the task exists and is  | prose | ✔ | prose: human-verified (non-automated) |
| Non-interactive mode: `arch task split TASK-XXX --titles "Ti | file | ✔ | exists: cli/src/main/ts/application/commands/task-command.ts |
| Original task is archived with status DONE, `Closed-at` time | prose | ✔ | prose: human-verified (non-automated) |
| `arch task split TASK-XXX` with no `--titles` flag: interact | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes after split. | cmd | ✔ | exit 0 (expected 0) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-914 [L3-AUTO]
**Closed:** 2026-05-17T13:13:54.966Z
**Title:** arch task new --class: task scaffolding by class

| AC | Type | Pass | Detail |
|---|---|---|---|
| `arch task new --class <class> --size <size> "Task title"` c | file | ✔ | exists: cli/src/main/ts/application/commands/task-command.ts |
| Template source: `docs/templates/task-<class>.md` files (hum | file | ✔ | exists: docs/templates/ |
| `arch task new` with no args prints usage showing valid clas | prose | ✔ | prose: human-verified (non-automated) |
| `M` and `L` sizes automatically include `### Gaps` section r | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes after task creation. | cmd | ✔ | exit 0 (expected 0) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |
