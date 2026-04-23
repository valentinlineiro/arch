# BACKLOG.md
<!-- ARCH developed with ARCH -->
<!-- Tasks ordered by priority within each status -->

## Priority legend
`P0` Blocks release or adoption | `P1` Current strategic priority | `P2` Important | `P3` Nice to have

## Size legend
`XS` <2h | `S` 2-4h | `M` 4-8h | `L` 1-2d | `XL` >2d (must decompose)

---

## TASK-001: Publish repo to GitHub as public OSS
**Meta:** P0 | S | BACKLOG
**Class:** 7-operations
**CLI:** human
**CLI-reason:** requires account setup, DNS, repo config — not automatable
**Context-budget:** README.md only
**Depends:** none

### Acceptance Criteria
- [ ] Repo live at github.com/[handle]/arch
- [ ] README renders correctly
- [ ] License: MIT confirmed in repo root
- [ ] Symlinks work after clone (AGENTS.md, CLAUDE.md, GEMINI.md)
- [ ] arch-install.sh updated with real GitHub URL

### Definition of Done
- [ ] Repo public and accessible
- [ ] arch-install.sh points to real raw.githubusercontent.com URL

---

## TASK-002: Write ADR-001 — Why git as the operating system
**Meta:** P1 | S | BACKLOG
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale, requires coherent prose and trade-off analysis
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md
**Depends:** none

### Acceptance Criteria
- [ ] ADR covers: alternatives considered (SaaS DB, local DB, flat files)
- [ ] ADR covers: why git wins (auditability, anti-collision, universality)
- [ ] ADR covers: consequences (no real-time collab, merge conflicts as feature)
- [ ] Under 400 tokens total

### Definition of Done
- [ ] PR approved
- [ ] File: docs/adr/ADR-001-git-as-operating-system.md

---

## TASK-003: Write ADR-002 — Why context is a budget not a default
**Meta:** P1 | S | BACKLOG
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md + docs/adr/ADR-001 (when exists)
**Depends:** TASK-002

### Acceptance Criteria
- [ ] ADR covers: the cost of loading full context on every invocation
- [ ] ADR covers: the context-budget field in task format
- [ ] ADR covers: measured token reduction (~75%)
- [ ] Under 400 tokens total

### Definition of Done
- [ ] PR approved
- [ ] File: docs/adr/ADR-002-context-as-budget.md

---

## TASK-004: Build npx arch-init (remote installer)
**Meta:** P1 | M | BACKLOG
**Class:** 2-code-generation
**CLI:** codex
**CLI-reason:** standard Node.js CLI scaffolder pattern
**Context-budget:** agents/EXEC.md + this task + scripts/arch-install.sh
**Depends:** TASK-001

### Acceptance Criteria
- [ ] `npx arch-init my-project` creates a new directory with full ARCH structure
- [ ] `npx arch-init .` installs into current directory
- [ ] Downloads files from GitHub raw URLs (not bundled)
- [ ] Creates symlinks post-download
- [ ] Works on macOS, Linux, Windows (WSL)
- [ ] Falls back gracefully if network unavailable

### Definition of Done
- [ ] Published to npm as `arch-init`
- [ ] PR approved + CI green

---

## TASK-005: Token audit — measure actual cost per mode
**Meta:** P1 | S | BACKLOG
**Class:** 5-research
**CLI:** claude
**CLI-reason:** requires reading all agent files and counting tokens accurately
**Context-budget:** agents/EXEC.md + this task + all docs/agents/*.md
**Depends:** none

### Acceptance Criteria
- [ ] Measure actual token count for each mode: CONDUCTOR, EXEC, REFINE, RETRO
- [ ] Compare declared budget vs. actual in README
- [ ] Flag any agent protocol over its declared budget
- [ ] Propose reductions for any protocol exceeding budget by >20%

### Definition of Done
- [ ] PR updating README token table with real numbers
- [ ] Any over-budget protocols patched in same PR

---

## TASK-006: Create arch.work landing page
**Meta:** P2 | M | BACKLOG
**Class:** 2-code-generation
**CLI:** claude-code
**CLI-reason:** design judgment needed, not just boilerplate
**Context-budget:** agents/EXEC.md + this task + README.md
**Depends:** TASK-001

### Acceptance Criteria
- [ ] Single HTML file, no framework
- [ ] Communicates: what ARCH is, who it's for, how to start
- [ ] CTA: `npx arch-init` command visible above fold
- [ ] Links to GitHub repo
- [ ] Mobile readable

### Definition of Done
- [ ] Deployed at arch.work (or placeholder domain)
- [ ] PR approved

---

## TASK-007: Write first real RETRO (ARCH sprint 1 close)
**Meta:** P2 | XS | BACKLOG
**Class:** 8-strategy
**CLI:** claude
**CLI-reason:** pattern detection from sprint 1 tasks
**Context-budget:** agents/RETRO.md + docs/DONE.md
**Depends:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005

### Acceptance Criteria
- [ ] RETRO.md populated with real sprint 1 data
- [ ] Sizing accuracy table filled
- [ ] At least one GUIDELINES.md addition proposed (if evidence exists)
- [ ] CLI performance table filled with real observations

### Definition of Done
- [ ] RETRO.md updated in main
- [ ] Human reviewed and applied any GUIDELINES changes

---

## TASK-008: README — add real usage example with CONDUCTOR output
**Meta:** P2 | S | BACKLOG
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** requires narrative judgment, not just formatting
**Context-budget:** agents/EXEC.md + this task + README.md + docs/agents/CONDUCTOR.md
**Depends:** TASK-001

### Acceptance Criteria
- [ ] README includes a real DISPATCH.md example output
- [ ] Shows the full daily workflow: CONDUCTOR → EXEC → PR
- [ ] Under 200 new tokens added to README

### Definition of Done
- [ ] PR approved
