# SPRINT.md
<!-- Sprint 1 — ARCH bootstrapping -->

## Sprint 1
**Period:** 2026-04-23 → 2026-05-07
**Goal:** ARCH is public, documented with ADRs, and installable via npx
**Committed:** 8 tasks
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
**Meta:** P1 | S | REVIEW | Sprint 1
**Locked-by:** gemini-cli
**Locked-at:** 2026-04-23T12:00:00Z
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
- [ ] PR approved
- [x] File: docs/adr/ADR-001-git-as-operating-system.md

---

## TASK-003: Write ADR-002 — Why context is a budget not a default
**Meta:** P1 | S | READY | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md
**Depends:** TASK-002

### Acceptance Criteria
- [ ] Covers: cost of loading full context on every invocation
- [ ] Covers: the context-budget field in task format
- [ ] Covers: measured token reduction (~75%)
- [ ] Under 400 tokens total

### Definition of Done
- [ ] PR approved
- [ ] File: docs/adr/ADR-002-context-as-budget.md

---

## TASK-004: Build npx arch-init (remote installer)
**Meta:** P1 | M | READY | Sprint 1
**Class:** 2-code-generation
**CLI:** codex
**CLI-reason:** standard Node.js CLI scaffolder
**Context-budget:** agents/EXEC.md + this task + scripts/arch-install.sh
**Depends:** TASK-001

### Acceptance Criteria
- [ ] `npx arch-init my-project` creates full ARCH structure
- [ ] `npx arch-init .` installs into current directory
- [ ] Downloads from GitHub raw URLs
- [ ] Creates symlinks post-download
- [ ] Works on macOS, Linux, Windows (WSL)

### Definition of Done
- [ ] Published to npm as `arch-init`
- [ ] CI green

---

## TASK-005: Token audit — measure actual cost per mode
**Meta:** P1 | S | READY | Sprint 1
**Class:** 5-research
**CLI:** claude
**CLI-reason:** requires reading all agent files + accurate token counting
**Context-budget:** agents/EXEC.md + this task + all docs/agents/*.md
**Depends:** none

### Acceptance Criteria
- [ ] Actual token count per mode: CONDUCTOR, EXEC, REFINE, RETRO
- [ ] Compare vs. declared budget in README
- [ ] Flag protocols over budget by >20%
- [ ] Propose reductions where needed

### Definition of Done
- [ ] PR updating README token table with real numbers
- [ ] Over-budget protocols patched in same PR

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
**Meta:** P1 | S | REVIEW | Sprint 1
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
- [ ] PR approved
- [ ] No status-drift possible between BACKLOG.md and SPRINT.md after a "move to sprint" operation

---

## Sprint log

| Date | Event |
|------|-------|
| 2026-04-23 | Sprint 1 started — ARCH bootstrapped with ARCH |

---

## Blocked tasks
_None_
