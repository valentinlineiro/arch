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