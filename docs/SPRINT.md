# SPRINT.md
<!-- Sprint 1 — ARCH bootstrapping -->

## Sprint 1
**Period:** 2026-04-23 → 2026-05-07
**Goal:** ARCH is public, documented with ADRs, and installable via npx
**Committed:** 10 tasks
**Velocity target:** — (first sprint, no baseline)

---

## Active tasks

## TASK-001: Publish repo to GitHub as public OSS
**Meta:** P0 | S | DONE | Sprint 1
**Class:** 7-operations
**CLI:** human
**CLI-reason:** requires account setup — not automatable
**Context-budget:** README.md only
**Depends:** none

### Acceptance Criteria
- [x] Repo live at github.com/valentinlineiro/arch
- [x] README renders correctly
- [x] License: MIT confirmed
- [x] Symlinks work after clone
- [x] arch-install.sh updated with real GitHub URL

### Definition of Done
- [x] Repo public and accessible
- [x] arch-install.sh points to real raw.githubusercontent.com URL

---

## TASK-002: Write ADR-001 — Why git as the operating system
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale, trade-off analysis
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md
**Depends:** none

### Acceptance Criteria
- [x] Covers: alternatives considered (SaaS DB, local DB, flat files)
- [x] Covers: why git wins (auditability, anti-collision, universality)
- [x] Covers: consequences (no real-time collab, merge conflicts as feature)
- [x] Under 400 tokens total

### Definition of Done
- [x] PR approved
- [x] File: docs/adr/ADR-001-git-as-operating-system.md

---

## TASK-003: Write ADR-002 — Why context is a budget not a default
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md
**Depends:** TASK-002

### Acceptance Criteria
- [x] Covers: cost of loading full context on every invocation
- [x] Covers: the context-budget field in task format
- [x] Covers: measured token reduction (~75%)
- [x] Under 400 tokens total

### Definition of Done
- [x] PR approved
- [x] File: docs/adr/ADR-002-context-as-budget.md

---

## TASK-004: Build npx arch-init (remote installer)
**Meta:** P1 | M | DONE | Sprint 1
**Class:** 2-code-generation
**CLI:** codex
**CLI-reason:** standard Node.js CLI scaffolder
**Context-budget:** agents/EXEC.md + this task + scripts/arch-install.sh
**Depends:** TASK-001

### Acceptance Criteria
- [x] `npx arch-init my-project` creates full ARCH structure
- [x] `npx arch-init .` installs into current directory
- [x] Downloads from GitHub raw URLs
- [x] Creates symlinks post-download
- [x] Works on macOS, Linux, Windows (WSL)

### Definition of Done
- [x] Published to npm as `arch-init`
- [x] CI green

---

## TASK-005: Token audit — measure actual cost per mode
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 5-research
**CLI:** claude
**CLI-reason:** requires reading all agent files + accurate token counting
**Context-budget:** agents/EXEC.md + this task + all docs/agents/*.md
**Depends:** none

### Acceptance Criteria
- [x] Actual token count per mode: CONDUCTOR, EXEC, REFINE, RETRO
- [x] Compare vs. declared budget in README
- [x] Flag protocols over budget by >20%
- [x] Propose reductions where needed

### Definition of Done
- [x] PR updating README token table with real numbers
- [x] Over-budget protocols patched in same PR

---

## TASK-010: Build `arch` CLI (project interaction layer)
**Meta:** P0 | M | READY | Sprint 1
**Class:** 2-code-generation
**CLI:** codex
**CLI-reason:** standard Node.js CLI implementation
**Context-budget:** agents/EXEC.md + this task + scripts/arch-install.sh + TASK-004
**Depends:** TASK-004

### Acceptance Criteria
- [ ] `arch conduct` — invokes CONDUCTOR mode via Claude
- [ ] `arch exec [TASK-ID]` — invokes EXEC mode for given task (or next READY if no ID)
- [ ] `arch refine` — invokes REFINE mode against REFINEMENT.md
- [ ] `arch retro` — invokes RETRO mode to close sprint
- [ ] `arch human` — invokes HUMAN mode for natural language interaction
- [ ] `arch status` — prints DISPATCH.md content to terminal
- [ ] `arch task done ID` — marks task DONE without opening Claude
- [ ] `arch task start ID` — marks task IN_PROGRESS without opening Claude
- [ ] `arch` command available after `npx arch-init` (bundled in same package)

### Definition of Done
- [ ] All commands working on macOS, Linux, Windows (WSL)
- [ ] PR approved + CI green

---

## TASK-009: Add HUMAN agent to ARCH framework
**Meta:** P0 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** requires editing framework files and maintaining protocol consistency
**Context-budget:** agents/EXEC.md + this task + docs/agents/HUMAN.md + CLAUDE.md + README.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/HUMAN.md` committed to repo
- [x] HUMAN mode added to `CLAUDE.md` (modes section, same structure as others)
- [x] README updated to document the HUMAN agent and its role

### Definition of Done
- [x] PR approved
- [x] HUMAN agent invocable from CLAUDE.md like any other mode

---

## TASK-013: Fix HUMAN agent — sync BACKLOG and SPRINT in one operation
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol patch requires coherent prose and consistency across agent files
**Context-budget:** agents/EXEC.md + this task + docs/agents/HUMAN.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/HUMAN.md` "Mueve [tarea(s)] al sprint" operation updated to modify both BACKLOG.md and SPRINT.md atomically
- [x] Decision recorded: BACKLOG entry is updated (status field) or removed — one approach chosen and documented
- [x] Single commit covers both file changes (no two-step drift window)
- [x] Existing "After every operation" report section updated if status vocabulary changes

### Definition of Done
- [x] PR approved
- [x] No status-drift possible between BACKLOG.md and SPRINT.md after a "move to sprint" operation

---

## TASK-011: Maintain CHANGELOG
**Meta:** P2 | S | READY | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** backfill requires reading git history and writing coherent prose
**Context-budget:** agents/EXEC.md + this task + docs/agents/HUMAN.md + git log
**Depends:** none

### Acceptance Criteria
- [ ] `CHANGELOG.md` created at repo root following Keep a Changelog format
- [ ] Backfilled with all tasks completed to date (TASK-001, TASK-009)
- [ ] HUMAN.md updated: task completion flow includes a changelog entry step
- [ ] Future entries follow `## [Unreleased]` → versioned section pattern

### Definition of Done
- [ ] PR approved
- [ ] CHANGELOG.md present in repo root

---

## TASK-016: Mandatory EXEC Commits before REVIEW
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol update requires coherent prose and consistency
**Context-budget:** agents/EXEC.md + this task
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/EXEC.md` updated to include a mandatory "Commit artifacts" step as the final action before changing status to `REVIEW`.
- [x] Protocol specifies that the commit message must include the TASK-ID.
- [x] Clarifies that the agent should stop after this commit.

### Definition of Done
- [x] PR approved
- [x] EXEC agent protocol reflects the new requirement.

---

## TASK-015: Update CONDUCTOR protocol — commit DISPATCH.md automatically
**Meta:** P2 | XS | REVIEW | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol refinement requires coherent prose and consistency
**Context-budget:** agents/CONDUCTOR.md + this task
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/CONDUCTOR.md` updated to include "Commit DISPATCH.md" as the final step.
- [x] Defined commit message pattern: `chore: conductor dispatch [date]`
- [x] Protocol clarifies that CONDUCTOR still stops immediately after the commit.

### Definition of Done
- [ ] PR approved
- [x] CONDUCTOR agent protocol reflects the new requirement.

---

## Sprint log

| Date | Event |
|------|-------|
| 2026-04-23 | Sprint 1 started — ARCH bootstrapped with ARCH |

---

## Blocked tasks
_None_
