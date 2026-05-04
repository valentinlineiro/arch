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

### Gaps
- `next` and `rank` are read-only operations used by humans during planning. As `task next` / `task rank` they are still accessible but the discoverability changes — needs a clear `task --help`.
- `validate` is used in onboarding/CI contexts where a lightweight check is preferred. If absorbed into `review`, callers need to update.
- `batch`/`drain` internalization: the Batch API flow (queue → drain → result) currently surfaces as explicit commands. Internalizing it means the user loses visibility into batch state. May need `loop --batch-status` or similar.
- `sandbox` is called by AI agents via `arch exec`. Removing it from the surface would require exec to call the sandbox service directly — possible but needs careful scoping.
- `arch.sh` and `AGENTS.md` reference the removed commands and must be updated atomically.

### Estimate
L — touches CLI dispatch, arch.sh, AGENTS.md, README, CHANGELOG, and any CI/hook references. Needs careful migration path for external callers. Should be decomposed into at least two tasks: (1) merge read-only subcommands into `task`, (2) absorb validate/lint into review + remove shell aliases.
