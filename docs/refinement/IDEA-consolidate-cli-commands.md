## IDEA: Consolidate CLI commands — 18 → 10

**Status:** DRAFT
**Decision:** —

### Problem
ARCH exposes 18 user-facing commands. 8 of them are redundant subsets, loose aliases, or internal plumbing that leaked onto the UX surface. This creates cognitive overhead for the operator, a larger maintenance surface, and more tests to write — all forms of muda that don't serve the TPS model.

### Proposed consolidation

**Keep (irreducible TPS core):**
- `loop` — JIT pull system
- `govern` — heijunka + replenishment
- `exec` — standardized work execution
- `conduct` — kaizen / THINK
- `review` — jidoka quality gate (absorbs `validate` and `lint`)
- `task` — state machine, absorbs: `start`, `done`, `reject`, `next` (→ `task next`), `rank` (→ `task rank`), `promote` (→ `task promote`)
- `inbox` — andon + human coordination (absorbs `status`)
- `mv` — context hygiene utility
- `sandbox` — privileged execution gate (internal but keep as explicit surface)
- `version` — standard

**Remove / merge:**
- `status` → `inbox`
- `validate` → `review`
- `lint` → `review` (or `review --fast` for format-only)
- `archive` (arch.sh alias) → `task done`
- `drain` → `batch drain`
- `next` → `task next`
- `rank` → `task rank`
- `promote` → `task promote`
- `batch` → internalize routing into `exec`/`loop`; keep `batch` only as plumbing if needed for drain

### Dependencies
- **Blocked by TASK-175** (`IDEA-migrate-arch-sh-routing-to-typescript`): `batch`/`drain` internalization and removal of the post-`task done` govern side effect require routing to live in TypeScript first.

### Gaps
- `next` and `rank` are read-only operations used by humans during planning. As `task next` / `task rank` they remain accessible but discoverability changes — needs a clear `task --help`.
- `validate` is used in onboarding/CI contexts where a lightweight check is preferred. If absorbed into `review`, callers need to update. Consider `review --fast` as a migration path.
- `batch`/`drain` internalization: the Batch API has a queue → drain → poll cycle. Internalizing it silently loses operator visibility into batch state. Either keep `batch status` as a read-only subcommand, or add `loop --batch-status`.
- `sandbox` is called by AI agents via `arch exec`. Removing it from the public surface requires exec to invoke the sandbox service directly — possible but needs careful scoping.
- `arch.sh` and `AGENTS.md` reference the removed commands and must be updated atomically.

### Decomposition (required before READY)
This is L and must be split before promotion:
1. Merge read-only subcommands into `task` (`next`, `rank`, `promote`) + drop `status`, `archive` alias
2. Absorb `validate`/`lint` into `review` + clean arch.sh aliases
Each sub-task is M and can ship independently.

### Estimate
L (must decompose first)
