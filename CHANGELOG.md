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

---

## v0.1.0 — 2026-04-22

Initial release. Method only. No tooling.

### Added
- `docs/AGENTS.md` — universal AI entry point, compatible with AGENTS.md open standard
- `docs/BACKLOG.md` — task backlog with canonical format
- `docs/SPRINT.md` — active sprint template
- `docs/DONE.md` — rolling window of last 10 completed tasks
- `docs/DISPATCH.md` — CONDUCTOR output, current system state
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
