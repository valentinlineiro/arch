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
- No agent merges its own PR
- Breaking changes (MAJOR) require an ADR before implementation
- Tasks estimated XL must be decomposed before entering sprint/
- `Closed-at: YYYY-MM-DDTHH:MM:SSZ` — optional field written to task file when archiving as DONE. Used for cycle time and velocity metrics.
- **Execution order within the same priority:** smaller size wins (XS → S → M → L)
- **No change without evidence** — every proposal in REFINEMENT.md must include `Source:` field
- **Backlog Health:** The agent MUST proactively propose at least one new IDEA when the count of READY tasks is < 3 (THINK Phase 4).