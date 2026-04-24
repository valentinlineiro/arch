# RETRO.md
<!-- One entry per sprint — most recent at top -->
<!-- AI reads only the latest entry in RETRO mode -->

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
