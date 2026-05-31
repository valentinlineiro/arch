# ADR-035: Archive Partitioning Strategy — Year-Month Subdirectories

**Date:** 2026-05-31
**Status:** Accepted (execution deferred until archive exceeds 500 files)
**Source:** TASK-1030

## Context

`docs/archive/` is a flat directory. At 454 files (2026-05-31) it is approaching the 500-file threshold where listing latency and cognitive overhead become measurable. No partitioning scheme has been decided; this ADR locks the decision before execution.

Two options were considered:

1. `docs/archive/YYYY/sprint-slug/` — sprint-aligned but sprint names change and aren't stable identifiers
2. `docs/archive/YYYY-MM/` — date-aligned, always deterministic, independent of sprint naming

## Decision

Use `docs/archive/YYYY-MM/` subdirectories. Each task is archived under the year-month of its `Closed-at` field. Tasks without a `Closed-at` field are archived under the year-month of the git commit that moved them.

**Structure:**
```
docs/archive/
  2026-05/
    TASK-001.md
    TASK-002.md
    ...
  2026-06/
    TASK-XXX.md
```

**Trigger:** Execute when `docs/archive/` flat file count exceeds 500.

**Migration:** `scripts/partition-archive.ts` — reads each task's `Closed-at`, moves to `YYYY-MM/` subdirectory, updates any corpus index references.

**Rollback:** `git revert` the migration commit — all files return to flat namespace.

## Consequences

- `arch corpus audit` must be updated to read from subdirectories (`readdir` recursively)
- `arch check` must accept tasks in `docs/archive/YYYY-MM/*.md` as valid archived tasks
- `arch ask` corpus indexer must traverse subdirectories
- No change to task file format — only directory structure changes
- External tools that glob `docs/archive/*.md` will need updating
