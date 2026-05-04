# CHANGELOG.md

All notable changes to the ARCH framework are documented here.

Format: `[type] description — [evidence or rationale]`
Types: `Added` `Changed` `Fixed` `Removed` `Migration`

Versioning rules:
- `MAJOR` — breaks existing task format or agent protocols (migration guide required)
- `MINOR` — new agent, new task class, new document (backward compatible)
- `PATCH` — improved instructions, reduced token cost, clarified protocol (transparent)

---

## [Unreleased]

### Added
- [TASK-175] `ExecCommand` TypeScript class — agent routing logic (`invoke_agent`) moved from `arch.sh` into typed, tested TypeScript. Supports preferred CLI, model tier injection, `{prompt}`/`{prompt_file}` substitution, local routing mode, and CLI fallback order.

### Changed
- [TASK-175] `arch.sh` reduced to a thin dispatcher — `invoke_agent` function and inline `node -e` scripts removed. All routing logic now lives in `ExecCommand`.

### Removed
- [TASK-175] Post-`task done` govern side effect removed from `arch.sh`. `arch task done` now only marks a task done; governance (archival, focus selection) is the responsibility of `arch govern` or `arch loop`.

### Added
- [TASK-025] `arch validate` command — deterministic validation of task format and config.
- [TASK-012] `arch review` command — deterministic review of guidelines and git diffs.
- [TASK-027] Node.js/TypeScript CLI core — Clean Architecture implementation in `cli/`.
- [TASK-010] Initial `arch` CLI — bash wrapper for agent orchestration.
- [TASK-024] TASK-FORMAT v0.2 spec — compressed 3-line format with regex validation.
- [TASK-023] ADR-003: Ephemeral DISPATCH — justifies terminal-only conductor output.
- [TASK-015] Automatic DISPATCH.md commits in CONDUCTOR protocol.
- [TASK-004] `npx arch-init` — remote installer for scaffolding new projects.

### Changed
- [TASK-029] README rework — included real-world Sprint 1 metrics and v0.2 diagrams.
- [TASK-026] ARCH v0.2 Migration — consolidated agents into `THINK` and `DO` modes.
- [TASK-022] Evidence requirement — all THINK actions must cite concrete signals.

### Fixed
- [TASK-013] Atomic status moves — HUMAN agent now syncs BACKLOG and SPRINT in one commit.
- [TASK-016] Mandatory commits — EXEC agent must commit artifacts before status to REVIEW.

---

## v0.1.0 — 2026-04-22

Initial release. Method only. No tooling.

### Added
- `docs/AGENTS.md` — universal AI entry point, compatible with AGENTS.md open standard
- `docs/BACKLOG.md` — task backlog with canonical format
- `docs/SPRINT.md` — active sprint template
- `docs/DISPATCH.md` — DEPRECATED (use docs/INBOX.md)
- `docs/REFINEMENT.md` — idea refinement before backlog entry
- `docs/RETRO.md` — sprint retrospective with AI pattern detection
- `docs/GUIDELINES.md` — permanent rules, human-approved only
- `docs/ROUTING.md` — CLI decision tree by task class (8 classes)
- `docs/agents/CONDUCTOR.md` — meta-agent: diagnoses system, writes DISPATCH
- `docs/agents/EXEC.md` — execution protocol (~200 tokens)
- `docs/agents/REFINE.md` — refinement protocol (~300 tokens)
- `docs/agents/RETRO.md` — retrospective protocol (~200 tokens)
- `docs/adr/ADR-000-template.md` — Architecture Decision Record template
- `scripts/arch-install.sh` — local installer, works without GitHub
