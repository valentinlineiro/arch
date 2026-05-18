# RETRO.md
<!-- One entry per sprint — most recent at top -->
<!-- AI reads only the latest entry in RETRO mode -->

---

## Sprint v1.0.0 Retrospective
**Closed:** 2026-05-18
**Committed:** 12 tasks | **Delivered:** 12 | **Velocity:** 100%

### Sizing Accuracy
| Task | Declared | Actual | Delta |
|------|----------|--------|-------|
| TASK-934 | S | S | 0 |
| TASK-937 | M | M | 0 |
| TASK-938 | M | M | 0 |
| TASK-942 | S | S | 0 |
| TASK-944 | S | S | 0 |
| TASK-946 | M | M | 0 |
| TASK-249 | S | S | 0 |

**Observation:** Sizing was accurate across the board. XS tasks (TASK-935, 936, 943, 945) closed without ceremony. The tiered obligations model is working as designed — protocol overhead is proportional to task scope.

### Key Deliverables
1. **Tiered obligations** (TASK-934, TASK-937) — XS/S Hansei triggered-only; M/L mandatory; L3 self-archive gate enforced.
2. **Refinement funnel** (TASK-249) — TTL enforcement via `ttlCycles`; admission gate distinguishing executable vs. speculative ideas.
3. **Deterministic capture** (TASK-941, TASK-942) — LLM gated behind `--draft`; `arch memory ask` narrowed to committed corpus only.
4. **CLI consolidation** (TASK-943, TASK-944, TASK-945) — `arch.sh` eliminated; `@valentinlineiro/arch` published to npm; all live docs migrated to canonical `arch` binary.
5. **1.0.0 release** (TASK-946) — `modePreamble` bug fixed in reflect; context injection suppressed below 0.1 confidence; Census budget recalibrated (ADR-022); version bumped across all docs.

### Detected Patterns & Risks
1. **Organically captured work:** The arch.sh → npm transition was initiated as a debugging question ("why is there still a duality?") and produced 3 tasks (TASK-943, TASK-944, TASK-945) with no prior refinement. The work was sound but the capture happened mid-session rather than from the backlog. This pattern is acceptable for XS/S work; it would be a risk for M+.
2. **Task title drift:** TASK-941 was titled "Verify Stripped Template Generation for Small Task" but implemented "capture deterministic by default." The title was a refinement artifact that was never updated at implementation time. `arch task capture` now generates the task — the title must reflect implementation intent, not the refinement question.
3. **Regression undetected until triggered:** The `modePreamble is not defined` bug in `reflect-command.ts` existed in the committed codebase but was only surfaced when `arch govern` auto-triggered `arch reflect` at runtime. No test covered the `runAnalysis` code path. The fix was trivial; the detection was accidental.
4. **External analysis accuracy gradient:** A performance review correctly identified `getById` full-scan as a real bottleneck but incorrectly proposed lazy loading (misunderstanding the tsup bundle) and overstated sequential I/O latency as "seconds." Measured startup: 44ms. This illustrates that static code reading without running the system produces mixed-quality diagnoses.

### Proposed Guideline Additions
- **Title at implementation, not refinement:** When a task's implementation scope diverges from its refinement title, update the title before the first IN_PROGRESS commit. A misleading title in the archive corrupts future `arch ask` retrieval.
- **Smoke test for reflect path:** `arch govern reflect` must be verified to run without error as part of the release checklist. A runtime-only failure path with no test coverage will stay broken indefinitely.

### Next Sprint Focus
Performance improvements sprint. Anchored on the `getById` full-scan bottleneck: direct path lookup by ID instead of scanning all 340 files. See backlog for scoped tasks.

---

## Sprint v0.6.0-final Retrospective
**Closed:** 2026-05-05
**Committed:** 12 tasks | **Delivered:** 12 | **Velocity:** 100%

### Sizing Accuracy
| Task | Declared | Actual | Delta |
|------|----------|--------|-------|
| TASK-189 | M | M | 0 |
| TASK-192 | S | S | 0 |
| TASK-195 | XS | XS | 0 |
| TASK-197 | XS | XS | 0 |

**Observation:** Sizing for protocol/writing tasks is highly accurate. Autonomous execution of M-sized tasks (TASK-189) is successful, but requires 15+ turns, indicating a complexity threshold for single-session completion.

### Detected Patterns & Risks
1. **Protocol Drift:** The rollout of the `## Hansei` mandate (TASK-195) created immediate friction where protocol (DO.md) and enforcement (CLI) were out of sync for a short window.
2. **Coordination Overhead:** 40+ IDEAs in refinement are creating visual noise in INBOX.md.
3. **Execution Latency:** The shift to L3 autonomy (TASK-190) is blocked by the need for better conflict resolution on append-only files (TASK-191).

### Proposed Guideline Additions
- **Atomic Rollout:** Protocol changes involving machine enforcement MUST update `DO.md` and the CLI in the same task or an immediate dependent task to prevent agent confusion.
- **Hansei Discipline:** XS tasks on the happy-path should use the minimal 1-sentence Hansei template to maintain velocity while meeting the archival guard requirement.

---

## Sprint 2 Retrospective
**Closed:** 2026-04-24
**Committed:** 4 tasks | **Delivered:** 4 | **Velocity:** 100%

### Sizing Accuracy
| Task | Declared | Actual | Delta |
|------|----------|--------|-------|
| TASK-026 | L | L | 0 |
| TASK-025 | M | M | 0 |
| TASK-029 | S | S | 0 |

**Observation:** Sizing has stabilized after the initial bootstrap phase. The 'Architectural Buffer' rule added in RETRO 1 is working.

### Detected Patterns & Risks
1. **Deterministic Dominance:** The move from AI-agents to CLI-engines for validation (TASK-012/TASK-025) has eliminated non-deterministic errors.
2. **Clean Evolution:** The Clean Architecture in  allowed for a 15-minute re-refinement to pivot the Reviewer engine logic without breaking core stability.

### Proposed Guideline Additions
- **Validation Gate:** Before any status move to , the agent or human should run . Zero violations are required for a clean handover.


---

## Sprint 1 Retrospective
**Closed:** 2026-04-24
**Committed:** 10 tasks | **Delivered:** 14 | **Velocity:** 140% (Overflow from refinement)

### Sizing Accuracy
| Task | Declared | Actual | Delta |
|------|----------|--------|-------|
| TASK-027 | M | L/XL | +2 sizes |
| TASK-010 | M | M | 0 |
| TASK-024 | S | S | 0 |

**Pattern:** Architectural tasks (rerewards, migrations) are consistently underestimated. Logic complexity and test setup add hidden overhead.

### Detected Patterns & Risks
1. **Hygiene Leak:** Creating new code roots (e.g., ) without  causes immediate repository pollution.
2. **Ad-hoc Scope Shift:** TASK-012 was redefined mid-sprint. While efficient for speed, it bypasses the architectural gatekeeping of the REFINE mode.
3. **Drift in Metadata:** Several tasks completed their logic but left stale locks or outdated meta lines.

### Proproposed Guideline Additions
- **Hygiene:** Every new code sub-directory must include a  in its initialization commit.
- **Strict Refinement:** If a task's core definition (deterministic vs AI-based) changes, it must return to  unless an explicit  is provided.
- **Architectural Buffer:** Re-architecting or migration tasks must default to size  to account for tests and structure.

### Pre-retro flags (human-submitted)
- **Status drift** — tasks not reflecting actual state (e.g. locks not cleared, status not updated after PR merge). Investigate: missing HUMAN mode invocations, unclear ownership handoff between agents.

---
<!-- Add new retros above this line -->
