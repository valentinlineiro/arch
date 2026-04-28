## TASK-124: arch review validates archived tasks with v0.4 format
**Meta:** P0 | XS | 8 | BACKLOG | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/review-system.ts

## Problem
`arch review` validates all tasks in docs/tasks/ AND docs/archive/, but archived tasks use v0.4 Meta format while reviewer expects v0.5 format. This causes 40+ false violation errors.

## Evidence
- review failed: 40 tasks don't follow v0.5 format
- docs/archive/TASK-001.md: uses older Meta format (e.g., "P0 | S | 5 | DONE | Sprint 1" without Focus field)
- docs/archive/TASK-111.md, TASK-113.md: same pattern

## Impact
Review noise obscures real issues. Users ignore failures or stop running review.

## Acceptance Criteria
- [ ] review-system.ts excludes docs/archive/ from task validation
- [ ] Review passes when only docs/tasks/ are validated
- [ ] Add unit test for archive exclusion