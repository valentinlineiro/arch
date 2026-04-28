## TASK-096: Opt-in project registry - aggregation and public endpoint
**Meta:** P3 | S | READY | Focus:no | 7-operations | local | .github/workflows/
**Depends:** TASK-095

### Acceptance Criteria
- [ ] A `repository_dispatch` GitHub Actions workflow in the `arch` repo receives registry entries and appends them to `docs/registry/entries/` as individual JSON files (one per UUID).
- [ ] A second workflow (scheduled daily) aggregates all entries into `docs/registry/aggregate.json` with shape: `{ totalProjects, byVersion, byRouting }`.
- [ ] `aggregate.json` is published to GitHub Pages at a stable URL.
- [ ] Duplicate UUIDs are deduplicated on aggregation (last-write wins).
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
