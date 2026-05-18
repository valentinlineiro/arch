## TASK-250: Unify CLI surface by intent-based verb domains
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/index.ts, cli/src/main/ts/application/, docs/agents/DO.md, docs/agents/THINK.md

### Context

The CLI currently exposes ~20 top-level commands mapped to internal mechanisms (e.g., `causal`, `drain`, `batch`, `loop`). The public surface reflects the engine's architecture, not the operator's intent. A new user must learn the internal model before they can act.

The goal is a four-verb intent surface:
- `arch review` — structural validation (unchanged)
- `arch task <subcommand>` — all task lifecycle operations (done, start, review, validate, loop, drain, batch)
- `arch memory <subcommand>` — all knowledge retrieval (ask, causal, index, explain)
- `arch govern` — all governance and scheduling operations (govern, reflect, report)

Existing command names become aliases or are deprecated with a migration message. Nothing in the engine changes — only the dispatch layer and documentation.

### Non-Goals

- No governance semantics changes (task lifecycle, escalation, audit rules unchanged)
- No routing semantics changes (actor routing, strategy config unchanged)
- No new runtime behavior (no new capabilities added to existing commands)
- No removal of aliases until a separate deprecation-removal task is scoped

### Gaps

- **Current command inventory**: `arch review`, `arch task`, `arch govern`, `arch reflect`, `arch report`, `arch ask`, `arch causal`, `arch index`, `arch loop`, `arch batch`, `arch drain`, `arch conduct`, `arch sandbox`, `arch exec`, `arch mv`, `arch inbox`, `arch capture`, `arch validate`. Routing analysis needed to confirm which map cleanly to each of the four verb domains before index.ts is touched.
- **Deprecation message format**: No existing pattern for emitting deprecation warnings in this CLI. Format (stderr vs stdout, prefix style) needs to be decided before implementation to avoid inconsistency across commands.
- **`arch capture` placement**: `arch capture` creates a task from natural language intent — not obviously a `task` subcommand (intake) or `govern` operation (scheduling). Placement decision required before dispatch table is written.
- **Two-version alias lifecycle**: "two minor releases" assumes semver discipline. Pre-1.0, minor versions are not formally cut. Alias policy should reference an explicit removal condition rather than a version count.

### Acceptance Criteria

- [ ] `cli/src/main/ts/index.ts` maps all existing commands under the four-verb surface: `review`, `task`, `memory`, `govern`.  →  prose: verified by reading index.ts dispatch table
- [ ] Each existing command is reachable via its new subcommand path (e.g., `arch task close` supersedes task completion commands, `arch memory ask` supersedes `arch ask`, `arch govern reflect` supersedes `arch reflect`).  →  prose: verified by smoke-testing representative commands
- [ ] Legacy top-level command names emit a deprecation warning with the new canonical path when invoked.  →  prose: verified by running a deprecated command and observing warning output
- [ ] `docs/agents/DO.md` and `docs/agents/THINK.md` reference the new command names. No outdated command invocations remain.  →  prose: verified by grep for old top-level names in agent docs
- [ ] `arch review` passes after changes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [ ] A developer unfamiliar with ARCH internals can discover all operations via `arch <verb> --help` without reading source code.
- [ ] No top-level command names that reference internal mechanism names remain in the public surface.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Decisions

- **Canonical closure verb:** use `arch task close`. `DONE` remains status vocabulary only. `arch task done` and any equivalent legacy completion entrypoints become deprecated aliases.
- **`arch review` stays flat:** `arch review` remains a first-class top-level verb because it is a daily safety action, not a governance subroutine. `govern` absorbs `reflect` and `report`, not `review`.
- **Alias policy:** deprecated top-level aliases remain for two minor releases beginning with the first release that ships the four-verb surface, then are removed.
- **Help ownership:** each canonical verb and subcommand owns its own `--help` output. Top-level help lists the four domains and points users to subcommand help; no generated monolithic help page is required in this task.

## Hansei
**Severity:** H0
**Category:** [MissingDecisionRecord]

**Decision:**
All four design gaps (closure verb, review scope, alias policy, help ownership) were identified during drafting and resolved in the Decisions section before implementation begins. Specification is complete at READY time.

**Constraint:**
Gaps were not visible until the initial draft existed; they emerged from examining the current CLI surface rather than being anticipated upfront. This is expected for large refactoring tasks.

**Cost:**
The two-version alias lifecycle creates a compatibility surface that must be tracked across releases. No implementation debt introduced at draft stage.
