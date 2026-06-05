# IDENTITY.md
<!-- ARCH Framework v1.3.0 — Frozen scope definition. Do not extend without ADR. -->

## Definition (frozen)

ARCH is a git-native operational protocol for human+AI collaborative software development. It governs the lifecycle of decisions, tasks, and architectural records — not the code itself.

## Commands (closed surface)

These are the wired arch commands. **Adding a command requires an ADR before implementation.**

| Command | Purpose |
|---------|---------|
| `arch init` | Bootstrap a repo with ARCH governance |
| `arch task` | Full task lifecycle: new, start, done, capture, list |
| `arch govern` | Enforce system health, archive done tasks, assign focus |
| `arch review` / `arch check` | Run DriftChecker and report violations |
| `arch capture` | Quick task capture from terminal |
| `arch triage` | Process incoming IDEAs from corpus federation |
| `arch upgrade` | Check and apply CLI version updates |
| `arch analyze` | Run THINK reflection session |
| `arch audit` | Compliance report (--report) |
| `arch status` | Show focused task and backlog state |
| `arch ask` | Query the task corpus |
| `arch corpus` | Manage corpus federation |
| `arch fix` | Auto-remediate common drift violations |
| `arch serve` | Serve ARCH dashboard (experimental) |

## Subsystems (closed surface)

These are the active subsystems. **Adding a subsystem requires an ADR before implementation.**

| Subsystem | Purpose |
|-----------|---------|
| `DriftChecker` | Orchestrates governance checks via TaskHealthChecker, StructuralChecker, GovernanceChecker |
| `GovernSystem` | Heartbeat: archives tasks, assigns focus, runs inbox hygiene, sprint lifecycle |
| `HanseiAuditor` / `TaskValidator` | Validates retrospective completeness on task close |
| `DeterministicACVerifier` | Verifies cmd/file/prose AC predicates against real system state |
| `EscalationStore` | Upsert-semantics escalation log: one record per (type, subject) key |
| `SprintService` | Sprint open/close lifecycle and velocity tracking |
| `BuildIndex` / `CorpusIndexService` | Context injection and corpus federation |
| `MarkTaskDone` / `MarkTaskInProgress` | Task lifecycle state machines |

## Scope — Inside

- Task lifecycle (capture → start → implement → close + Hansei)
- Architectural decisions (ADRs, governance records)
- Sprint management and velocity tracking
- Drift detection and enforcement
- Agent execution protocol (DO.md, THINK.md, AGENTS.md)
- Context indexing for agent sessions
- Corpus quality and federation

## Scope — Outside

- Runtime behavior, application logic, or domain code
- CI/CD pipelines, infrastructure provisioning
- Test frameworks (ARCH verifies cmd predicates, does not write tests)
- Human psychology, motivation, or emotional state

## Invariants

1. **Git-native**: All state lives in git-tracked files.
2. **Flat tasks**: One file per task. No nesting.
3. **Focus sovereignty**: One focused task at a time.
4. **Deterministic gate**: `arch review` is reproducible given the same repo state.
5. **Hansei on close**: Every M+ closed task carries a retrospective.
6. **Caller-on-day-one**: Every new service or subsystem must have a real caller in the same commit.

## Rejection criteria

Features that require external state, introduce non-deterministic governance gates, govern human behaviour, or duplicate what git already provides.

## Re-entry index

| Need | Go to |
|------|-------|
| Start executing | AGENTS.md |
| Full execution protocol | docs/agents/DO.md |
| Reflection / IDEA triage | docs/agents/THINK.md |
| Task format reference | docs/TASK-FORMAT.md |
| Governance authority | docs/GOVERNANCE.md |
| Architectural decisions | docs/adr/ |
| Current system state | docs/RETRO.md ## Current State |
