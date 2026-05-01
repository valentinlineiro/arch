## TASK-157: Fix Reviewer rejection of governance tags [THINK] and [KAIZEN]
**Meta:** P1 | XS | READY | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts

### Acceptance Criteria
- [ ] Update `Reviewer.ts` to allow `[THINK]` and `[KAIZEN]` as valid commit message prefixes or permit them alongside conventional prefixes.
- [ ] Ensure `arch review` passes for commits tagged with `[THINK]` or `[KAIZEN]`.

### Definition of Done
- [ ] `arch review` passes.
- [ ] Test coverage for the new allowed prefixes.
