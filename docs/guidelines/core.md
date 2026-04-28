## CORE
<!-- Always loaded. Max 200 tokens. -->

- Commits follow Conventional Commits. **This table is the authoritative reference for all agents:**

  | Prefix      | When to use                                          |
  |-------------|------------------------------------------------------|
  | `feat:`     | New feature, new task, new agent capability          |
  | `fix:`      | Bug fix in protocol, CLI, or config                  |
  | `chore:`    | Status changes, maintenance, dependency updates      |
  | `docs:`     | Changes to README, ADRs, guides                      |
  | `refactor:` | Restructuring without behavior change                |
  | `test:`     | Adding or updating tests only                        |
  | `idea:`     | Committing a draft IDEA to refinement/               |
- Every PR references a TASK-ID: `docs(conductor): add velocity check [ARCH-012]`
- If a follow-up commit only fixes the previous one and no one else has seen it yet, use `git commit --amend` instead of a new commit
- **Git Safety:** Agents must use `git fetch` to safely sync state. History-changing operations (`git pull`, `git merge`, `git rebase`) are FORBIDDEN without explicit human approval.
- No agent merges its own PR (Exception: Level 3 Autonomy defined in `autonomy.md`)
- Breaking changes (MAJOR) require an ADR before implementation
- Tasks estimated XL must be decomposed before entering sprint/
- `Closed-at: YYYY-MM-DDTHH:MM:SSZ` — optional field written to task file when archiving as DONE. Used for cycle time and velocity metrics.
- **Execution order within the same priority:** smaller size wins (XS → S → M → L)
- **No change without evidence** — every proposal in REFINEMENT.md must include `Source:` field
- **Backlog Health:** The agent MUST proactively propose at least one new IDEA when the count of READY tasks is < 3 (THINK Phase 4).
- **Autonomy Pilot (Level 2):** Agents are authorized to self-promote IDEAs to TASKS if they are sized **XS** and belong to class `7-operations` or `6-writing`.
- **Language — English-first:** All new documentation, task titles, guideline entries, and commit messages must be written in English. Non-ASCII characters in task titles are a drift signal detected by `arch review`. Legacy Spanish content is grandfathered — translate on edit, not proactively.
- **Dependency Hygiene:** `npm install` in `cli/` should only be run when intentionally adding or upgrading dependencies to prevent unintended `package-lock.json` churn. Always verify diffs before committing lock files.
- **Build Requirement:** Any change to the CLI source (`cli/src/main/ts/`) must be followed by `npm run build` within the `cli/` directory to update the `dist/` artifacts used by `scripts/arch.sh`. Failure to build leads to stale behavior during verification.