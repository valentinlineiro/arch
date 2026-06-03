# IDENTITY.md
<!-- ARCH Framework v1.3.0 — Frozen scope definition. Do not extend without ADR. -->

## Definition (frozen)

ARCH is a git-native operational protocol for human+AI collaborative software development. It governs the lifecycle of decisions, tasks, and architectural records — not the code itself.

## Scope — Inside

- Task lifecycle (capture → start → implement → close + Hansei)
- Architectural decisions (ADRs, governance records)
- Sprint management and velocity tracking
- Drift detection and enforcement (DriftChecker, arch review)
- Agent execution protocol (DO.md, THINK.md, AGENTS.md)
- Context indexing for agent sessions
- Corpus quality and federation

## Scope — Outside

- Runtime behavior, application logic, or domain code
- CI/CD pipelines (ARCH may inform them, not own them)
- Test frameworks (ARCH verifies cmd predicates, does not write tests)
- Infrastructure provisioning
- Human psychology, motivation, or emotional state

## Invariants (deterministic core)

1. **Git-native**: All state lives in git-tracked files. No external databases.
2. **Flat task structure**: One file per task. No nesting. No parent-child hierarchy.
3. **Focus sovereignty**: One focused task at a time. Govern assigns; human overrides.
4. **Deterministic gate**: `arch review` output is fully reproducible given the same repo state.
5. **Hansei on close**: Every closed task carries a retrospective. No exceptions for M+.

## Rejection criteria

ARCH rejects features that:
- Require external state (databases, APIs as source of truth)
- Introduce probabilistic or non-deterministic governance gates
- Govern human behaviour rather than work artifacts
- Duplicate what git, the shell, or the task format already provide

## Current priority lock

Simplification and external adoption readiness (sprint/v1.3.0-2026-06). All new features evaluated against: does this reduce the learning curve or enable a new adopter to get value faster?

## Re-entry index

| Need | Go to |
|------|-------|
| Start executing | AGENTS.md |
| Full execution protocol | docs/agents/DO.md |
| Reflection / IDEA triage | docs/agents/THINK.md |
| Task format reference | docs/TASK-FORMAT.md |
| Governance authority | docs/GOVERNANCE.md |
| Architectural decisions | docs/adr/ |
| Active sprint | arch status |
