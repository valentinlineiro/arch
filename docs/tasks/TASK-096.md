## TASK-096: Opt-in project registry - aggregation and public endpoint
**Meta:** P3 | S | 5 | DONE | Focus:yes | 7-operations | local | .github/workflows/
**Depends:** TASK-095
**Closed-at:** 2026-04-29T13:40:00Z

### Acceptance Criteria
- [x] A `repository_dispatch` GitHub Actions workflow in the `arch` repo receives registry entries and appends them to `docs/registry/entries/` as individual JSON files (one per UUID).
- [x] A second workflow (scheduled daily) aggregates all entries into `docs/registry/aggregate.json` with shape: `{ totalProjects, byVersion, byRouting }`.
- [x] `aggregate.json` is published to GitHub Pages at a stable URL.
- [x] Duplicate UUIDs are deduplicated on aggregation (last-write wins).
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
