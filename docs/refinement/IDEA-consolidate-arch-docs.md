# IDEA: consolidate-arch-docs
**Created:** 2026-05-22
**Source:** ARCH protocol review — file audit of docs/ identified fragmentation and stale artifacts
**Status:** DRAFT
**Meta:** P1 | M | local | docs/

## Problem

ARCH's `docs/` directory has grown organically over ~300 tasks and now contains significant structural fragmentation. A full audit reveals:

**Root-level docs (21 files)** — many overlap in purpose or are stale:

| File | Status | Verdict |
|------|--------|---------|
| AGENTS.md | ✅ Essential | Keep (entry point) |
| ARCH-CORE.md | ✅ Essential | Keep (execution contract) |
| EPISTEMIC-DOCTRINE.md | ⚠️ Abstract | Candidate for ADR or PRINCIPLES.md merge |
| EVENTS.md | ⚠️ Low value | Manual event log — superseded by git log |
| EXPERIMENT-PROTOCOL.md | ❓ Aspirational | Not actively used; move to superpowers/plans/ |
| GOVERNANCE.md | ✅ Essential | Keep |
| HALT-LOG.md | ❌ Empty | Remove — HALT.md covers this structurally |
| HALT.md | ✅ Essential | Keep |
| IDENTITY.md | ✅ Essential | Keep |
| INBOX.md | ✅ Essential | Keep |
| KAIZEN-LOG.md | ✅ Essential | Keep |
| META-PROTOCOL.md | ❓ DRAFT, abstract | Not referenced anywhere; candidate for removal |
| METRICS.md | ✅ Essential | Keep (auto-generated) |
| PRINCIPLES.md | ✅ Active | Keep |
| PROTOCOL.md | ✅ Active | Keep (version ledger) |
| RETRO.md | ✅ Active | Keep |
| ROADMAP.md | ✅ Active | Keep |
| SENTINEL-LOG.md | ✅ Active | Keep |
| SPRINT-STATE-MACHINE.md | ⚠️ Design doc | Move to superpowers/ or archive — design for TASK-957, likely implemented |
| TASK-FORMAT.md | ✅ Essential | Keep |
| PROTOCOL.md | ✅ Active | Keep |

**agents/ (4 files):**
- DO.md ✅ Essential
- THINK.md ✅ Essential
- THINK-audit.md ⚠️ Draft audit — consolidate into THINK.md or remove
- governance-execution-model.md ⚠️ Design doc — move to superpowers/

**guidelines/ (9 files):**
- core.md, autonomy.md, bugs.md, documentation.md, testing-a-change.md, versioning.md — ✅ Keep
- models.md — ⚠️ Needs fix (see IDEA-fix-config-gaps)
- resources.md — ⚠️ Low-value cheat sheet, could be archived
- what-ai-must-never-do-in-this-repo.md — ⚠️ Partially duplicates core.md + autonomy.md

**course/ (4 files):** Educational — keep but could move to a separate branch or subdirectory.

**superpowers/ (15+ files):** Historical design docs — good for audit trail but rarely referenced. Move to archive.

**tensions/ (8+ files):** Active pattern tracking — keep.

**refinement/archive/ (150+ IDEA files):** Historical decision records. Move some to a true archive subdirectory and purge stale ones.

## Proposed solution

Phase 1 — Consolidate root docs:
1. **Remove HALT-LOG.md** (empty, superseded by HALT.md)
2. **Move EXPERIMENT-PROTOCOL.md** to `docs/superpowers/plans/`
3. **Move SPRINT-STATE-MACHINE.md** to `docs/superpowers/specs/`
4. **Merge EPISTEMIC-DOCTRINE.md** into GOVERNANCE.md as a section (or keep at root but it's constitutional — could argue either way)
5. **Remove EVENTS.md** (manual log, git is authoritative)
6. **Remove META-PROTOCOL.md** (DRAFT, abstract, not referenced)

Phase 2 — Consolidate agents/:
1. **Remove THINK-audit.md** (draft audit, no enforcement — findings should be in THINK.md or archived)
2. **Move governance-execution-model.md** to `docs/superpowers/specs/`

Phase 3 — Consolidate guidelines/:
1. **Fix models.md** (per IDEA-fix-config-gaps)
2. **Merge what-ai-must-never-do-in-this-repo.md** into core.md
3. **Archive resources.md** (cheat sheet, not protocol)

Phase 4 — Archive management:
1. Prune refinement/archive/ — any IDEA older than 60 days with REJECTED/DEFERRED status can be deleted (git has the history)
2. Move superpowers/ to archive/ (historical design docs)

## Expected outcomes
- Root docs reduced from 21 → ~15 (28% reduction)
- agents/ reduced from 4 → 2 (50% reduction)
- guidelines/ reduced from 9 → 7 (22% reduction)
- Total cognitive load from file count reduced ~30%

## Dependencies
- IDEA-resolve-hansei-contradiction (separate but parallel)
- IDEA-fix-config-gaps (separate but parallel)

## Estimated size
M — touches many files, requires coordination to avoid breaking references.

## Gaps
- Need to verify no active task references the files being removed.
- EPISTEMIC-DOCTRINE.md is constitutionally important — merging into GOVERNANCE.md may dilute its standing. Keep as separate file.

## Decision
