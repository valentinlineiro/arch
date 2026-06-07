# MISSION.md
<!-- Intent constraint for autonomous governance. Read before promoting any IDEA. -->

## Goal

ARCH is a git-native operational protocol for human+AI collaborative software development. It governs the lifecycle of decisions, tasks, and architectural records — producing a governed corpus that improves over time.

## Autonomous scope

These classes of work can be promoted and executed without human confirmation:

- **Bug fixes** — failing tests, broken commands, incorrect output
- **Simplification** — removing dead code with 0 callers, compressing verbose docs
- **Protocol fixes** — updating THINK.md/DO.md when a rule is violated in practice
- **Dependency updates** — patch-level version bumps with passing tests
- **Documentation** — adding examples, fixing typos, improving clarity
- **Test coverage** — adding tests for existing behavior

## Human-gated

These classes require a human Decision field before promotion:

- **New commands** — anything added to the closed surface (IDENTITY.md ## Commands)
- **New subsystems** — anything added to IDENTITY.md ## Subsystems
- **Protocol changes** — modifications to TASK-FORMAT.md, ADR-009, ADR-034
- **External integrations** — corpus federation remotes, new API dependencies
- **Schema changes** — task format, config format, escalation log format
- **Security-relevant changes** — auth, secrets, access control

## Non-goals

- Governing human psychological state or emotional context
- Runtime behavior of applications ARCH governs (not our code)
- CI/CD pipelines (inform, not own)
- Replacing human architectural decision-making

## For arch analyze --scan

When a detected pattern falls in the human-gated class, emit:
```
**Decision:** AWAITING_HUMAN — <pattern class> requires human confirmation per docs/MISSION.md
```

When a detected pattern falls in the autonomous scope, emit:
```
**Decision:** Pending human review.
```
