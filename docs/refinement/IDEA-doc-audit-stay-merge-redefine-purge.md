# IDEA: Audit all ARCH docs — stay, merge, redefine, or purge

**Status:** DRAFT
**Created:** 2026-06-04
**Source:** Protocol audit — 72 active doc files, many are dead weight
**Candidate-class:** 6-writing
**Candidate-size:** M
**Depends:** none
**Decision:** _(pending)_

## Problem

ARCH has 72 active markdown files across 9 subdirectories. Not all carry their weight. Sprint artifacts linger at root level, empty files exist, guidelines are fragmented into 7 tiny files that each could be a section, multi-hundred-line review docs sit alongside active protocol, and the principles doc has an unresolved provenance gap since KAIZEN-LOG was archived.

Each doc increases context budget pressure and onboarding surface area. The framework should be lean enough that every file justifies its existence.

## Audit results

### PURGE (4 files — delete, no content worth preserving)

| File | Lines | Rationale |
|------|-------|-----------|
| `docs/90-day-sprint-acs.md` | 105 | Sprint-specific AC breakdown for v1.2.1. Historical artifact, not a living document. Sprint is long closed. |
| `docs/HALT-LOG.md` | 0 | Empty placeholder. Halt events are recorded in `.arch/escalations.jsonl` and INBOX.md. No content to preserve. |
| `docs/reviews/ARCH-comprehensive-review-2026-05-22.md` | 400 | One-off comprehensive review. Historical snapshot, not ongoing reference. Belongs in archive. |
| `docs/reviews/cli-arch-review-2026-05-20.md` | 157 | One-off CLI architectural review. Same category — historical artifact. |

### MERGE (5 files — content moves into existing docs, source deleted)

| File | Lines | Target | Rationale |
|------|-------|--------|-----------|
| `docs/HALT.md` | 13 | `guidelines/core.md` | 13-line halt conditions table. Too small for its own file; fits as a subsection of core conventions. |
| `docs/guidelines/documentation.md` | 10 | `guidelines/core.md` | 10 lines of doc format rules. A single subsection in core.md. |
| `docs/guidelines/testing-a-change.md` | 20 | `guidelines/core.md` | 20-line testing matrix by change type. Core convention. |
| `docs/PROJECT.md` | 11 | `AGENTS.md` | 11-line project Definition of Done checklist. Belongs in the universal entry point. |
| `docs/CODE-QUALITY-AUDIT.md` | 94 | `guidelines/` | Root-level doc about code quality audit process. It's a guideline — should live in guidelines/, not root. |

### REDEFINE (1 file — rewrite with fixes)

| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| `docs/PRINCIPLES.md` | 49 | Source field references `KAIZEN-LOG` which was archived (TASK-1107). Principles exist without enforcement connection. | 1) Replace KAIZEN-LOG source links with actual TASK-IDs or ADR references. 2) Add `Enforced-by:` field linking to the mechanism (arch review rule, pre-commit hook, etc.). 3) Keep at root level — principles are constitutional, not guidelines. |

### STAY (62 files — no action)

All ADRs (19), agent protocols (2), course materials (4), remaining guidelines (4: autonomy.md, bugs.md, core.md, models.md, versioning.md), root docs (10: AGENTS.md, EVENTS.md, GOVERNANCE.md, IDENTITY.md, INBOX.md, METRICS.md, NOTIFICATIONS.md, PROTOCOL.md, PROTOCOL-UPGRADES.md, RETRO.md, SENTINEL-LOG.md, TASK-FORMAT.md), refinement IDEAs (6 active), ROADMAP-IDEAS.md, TEMPLATE.md, task templates (4), tensions (8).

Note: `versioning.md` (81 lines) was considered for move to root docs/ since it defines protocol and CLI versioning policy, not agent behavior. No change recommended now — it works where it is.

## Execution plan

1. Delete 4 purge files
2. Merge 5 files into targets (inline content, delete source)
3. Rewrite PRINCIPLES.md with Enforced-by links
4. Run `arch review`, commit

## Validation hints

- git diff shows deletions for purge/merge targets
- guidelines/core.md grows by ~43 lines (HALT + documentation + testing)
- AGENTS.md grows by ~11 lines (PROJECT.md DoD)
- CODE-QUALITY-AUDIT.md moves to guidelines/
- PRINCIPLES.md has Enforced-by fields, no KAIZEN-LOG references
