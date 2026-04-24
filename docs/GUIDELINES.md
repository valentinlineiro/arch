# GUIDELINES.md
<!-- Rules for developing ARCH with ARCH -->
<!-- Every rule here has evidence. No speculative rules. -->

---

## CORE
<!-- Always loaded. Max 200 tokens. -->

- Commits follow Conventional Commits:

  | Prefix      | When to use                                          |
  |-------------|------------------------------------------------------|
  | `feat:`     | New backlog task, new agent                          |
  | `chore:`    | Status changes, maintenance commits                  |
  | `docs:`     | Changes to README, ADRs, guides                      |
  | `fix:`      | Bug fix in protocol or config                        |
  | `refactor:` | Restructuring without behavior change                |
- Every PR references a TASK-ID: `docs(conductor): add velocity check [ARCH-012]`
- If a follow-up commit only fixes the previous one and no one else has seen it yet, use `git commit --amend` instead of a new commit
- No agent merges its own PR
- Breaking changes (MAJOR) require an ADR before implementation
- Tasks estimated XL must be decomposed before entering SPRINT.md
- **No change without evidence** — every proposal in REFINEMENT.md must include `Source:` field

---

## Documentation
- All framework files are Markdown — no YAML, no JSON, no special syntax
- **TASK-FORMAT.md** is the authoritative reference for the task format (v0.2+).
- Token budget must be declared or re-verified after any change to `docs/agents/`
- If a protocol change increases token cost, justify it explicitly in the PR
- ADRs are permanent — to reverse a decision, create a new ADR that supersedes
- **ADR-003** documents the explicit exception to ADR-001: DISPATCH output is ephemeral (terminal only, not committed)

---

## Versioning
- PATCH: protocol improvement, token reduction, clarification — no migration needed
- MINOR: new agent or task class — backward compatible — update ROUTING.md
- MAJOR: format change that breaks existing BACKLOG/SPRINT files — migration guide required
- Tag format: `vX.Y.Z` — tag on `main` after merge, never before

---

## Testing a change
Before merging any change to `docs/agents/`:
- Apply it to at least one real project using ARCH
- Run one full cycle (CONDUCTOR → EXEC or REFINE → output review)
- Note the result in the PR body

---

## What AI must never do in this repo
- Modify GUIDELINES.md directly — propose in RETRO.md only
- Promote tasks to BACKLOG without explicit human approval
- Change task format without a MAJOR version bump and migration guide
- Merge PRs

## Engineering Hygiene
- **Zero-Day .gitignore:** Any commit that initializes a new code directory must include a relevant  to prevent tracking build artifacts or dependencies.
- **Architectural Buffer:** Re-architecting, migrations, or structural changes must default to size  or higher to account for Clean Architecture overhead and testing.

## Task Integrity
- **Scope Stability:** If a task's implementation model changes fundamentally (e.g., from AI Agent to Deterministic Engine), it MUST return to  unless the human provides an explicit  in the meta line.

## Changelog
| Version | Date | Description | Impact |
|---------|------|-------------|--------|
| v0.1.0  | 2026-04-23 | Initial ARCH bootstrap | N/A |
| v0.2.0  | 2026-04-24 | Clean Architecture CLI + THINK/DO modes | MAJOR |
