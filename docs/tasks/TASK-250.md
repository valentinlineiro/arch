## TASK-250: Unify CLI surface by intent-based verb domains
**Meta:** P1 | M | REVIEW | Focus:yes | 2-code-generation | claude | cli/src/main/ts/index.ts, cli/src/main/ts/application/, docs/agents/DO.md, docs/agents/THINK.md

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

All gaps resolved. Implementation may proceed.

**Command-to-domain mapping** (from index.ts inventory, 2026-05-18):

| Domain | Canonical path | Legacy alias (deprecated) |
|---|---|---|
| `arch review` | `arch review` | `arch validate`, `arch lint` (already deprecated) |
| `arch task` | already canonical | — |
| `arch task capture` | new subcommand | `arch capture` |
| `arch task loop` | new subcommand | `arch loop` |
| `arch task batch` | new subcommand | `arch batch` |
| `arch task drain` | new subcommand | `arch drain` |
| `arch task sandbox` | new subcommand | `arch sandbox` |
| `arch task mv` | new subcommand | `arch mv` |
| `arch task exec` | new subcommand | `arch exec` |
| `arch task merge-resolve` | new subcommand | `arch merge-resolve` |
| `arch task verify-acs` | new subcommand | `arch verify-acs` |
| `arch task next` | already exists as subcommand | `arch next` (already deprecated) |
| `arch task rank` | already exists as subcommand | `arch rank` (already deprecated) |
| `arch task promote` | already exists as subcommand | `arch promote` (already deprecated) |
| `arch govern` | already canonical | — |
| `arch govern reflect` | new subcommand | `arch reflect` |
| `arch govern report` | new subcommand | `arch report` |
| `arch govern inbox` | new subcommand | `arch inbox` |
| `arch govern conduct` | new subcommand | `arch conduct` |
| `arch govern approve` | new subcommand | `arch approve` |
| `arch memory ask` | new subcommand | `arch ask` |
| `arch memory causal` | new subcommand | `arch causal` |
| `arch memory index` | new subcommand | `arch index` |
| `arch memory explain` | new subcommand | `arch explain` |
| `arch memory deps` | new subcommand | `arch deps` |
| Flat | `arch init` | — (bootstrap, no domain) |
| Flat | `arch version` | — |

**Deprecation message format**: use existing pattern already in index.ts — `process.stderr.write("Warning: 'arch <old>' is deprecated. Use 'arch <new>' instead.\n")`. No new format needed.

**`arch capture` placement**: `arch task capture` — it creates a task (task lifecycle intake), not a governance operation.

**Alias lifecycle pre-1.0**: "two minor releases" replaced with: aliases remain until removed in a dedicated deprecation-removal task that requires explicit operator approval. No version-count commitment pre-1.0.

### Acceptance Criteria

- [x] `cli/src/main/ts/index.ts` maps all existing commands under the four-verb surface: `review`, `task`, `memory`, `govern`.  →  prose: verified by reading index.ts dispatch table
- [x] Each existing command is reachable via its new subcommand path (e.g., `arch task close` supersedes task completion commands, `arch memory ask` supersedes `arch ask`, `arch govern reflect` supersedes `arch reflect`).  →  prose: verified by smoke-testing representative commands
- [x] Legacy top-level command names emit a deprecation warning with the new canonical path when invoked.  →  prose: verified by running a deprecated command and observing warning output
- [x] `docs/agents/DO.md` and `docs/agents/THINK.md` reference the new command names. No outdated command invocations remain.  →  prose: verified by grep for old top-level names in agent docs
- [x] `arch review` passes after changes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [x] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [x] A developer unfamiliar with ARCH internals can discover all operations via `arch <verb> --help` without reading source code.
- [x] No top-level command names that reference internal mechanism names remain in the public surface.
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Decisions

- **Canonical closure verb:** use `arch task close`. `DONE` remains status vocabulary only. `arch task done` and any equivalent legacy completion entrypoints become deprecated aliases.
- **`arch review` stays flat:** `arch review` remains a first-class top-level verb because it is a daily safety action, not a governance subroutine. `govern` absorbs `reflect` and `report`, not `review`.
- **Alias policy:** deprecated top-level aliases remain until a dedicated deprecation-removal task is explicitly approved by the operator. Pre-1.0, no version-count commitment — removal requires an explicit decision, not a calendar.
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
