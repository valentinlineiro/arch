## IDEA: Milestone-based sprint closure via PROJECT.md predicates

**Status:** PROMOTED
**Created:** 2026-05-28
**Source:** smartcart-os pilot retrospective — count-based auto-close (sprintCloseAfterN: 15) fired mid-implementation. Product sprints have phases (definition → implementation → QA/launch); 15 archived tasks during implementation phase produced a sprint close with open QA tasks. The sprint close generated a version bump and RETRO entry while the main feature was unfinished.
**Candidate-class:** 2-code-generation
**Candidate-size:** S
**Depends:** IDEA for PROJECT.md Core Flows predicates (prerequisite for milestone predicates)

---

## Problem

`arch govern` auto-closes a sprint when `archivedThisTick >= sprintCloseAfterN`. This is a count signal, not a completion signal. For ARCH-building-ARCH, the two are correlated: tasks are bounded and roughly equivalent weight. For product sprints they diverge:

1. **Tasks are not equivalent weight.** Archiving 15 XS file-deletion tasks is not sprint completion. Archiving 3 M feature tasks might be.
2. **Sprints have phases.** Definition tasks close first, then implementation, then QA. The count threshold fires during implementation, not at sprint boundary.
3. **The threshold is a guess.** `sprintCloseAfterN: 15` requires the user to predict how many tasks the sprint will contain upfront. On a first sprint in a new domain, this is impossible.

The count model encodes the assumption that tasks are interchangeable and sprint boundaries are arbitrary. Neither is true for product work.

---

## Proposed Fix

Add `sprintCloseOn` to `arch.config.json` as an alternative to `sprintCloseAfterN`:

```json
{
  "sprintCloseOn": "project_milestone",
  "sprintMilestone": "MVP launch"
}
```

When `sprintCloseOn: "project_milestone"` is set:
- `arch govern` reads `PROJECT.md` and finds the milestone named by `sprintMilestone`
- The milestone has cmd predicates (same format as AC predicates)
- If all milestone predicates pass, govern triggers sprint close
- `sprintCloseAfterN` is ignored

Example `PROJECT.md` milestone block:
```markdown
## Milestones

### MVP launch
- [ ] Core user flow end-to-end  →  cmd: npx playwright test --grep "basket entry"; exit: 0
- [ ] API health  →  cmd: curl -s http://localhost:3001/health | grep ok; exit: 0
- [ ] No open P0 tasks  →  prose: verified by arch review showing no P0 READY/IN_PROGRESS tasks
```

This ties sprint closure to a meaningful completion signal rather than a task count. The sprint closes when the software works, not when N tasks archive.

**Backward compatibility:** `sprintCloseAfterN` continues to work. `sprintCloseOn` is opt-in. Existing configs are unaffected.

**New project default:** `arch init` prompts for sprint close mode. Default for new projects: `sprintCloseOn: "project_milestone"` with a placeholder milestone. `sprintCloseAfterN` as fallback if PROJECT.md has no milestones.

---

## Acceptance Criteria

- [ ] `sprintCloseOn: "project_milestone"` with passing milestone predicates closes the sprint on govern tick  →  prose: verified by seeding a PROJECT.md milestone with passing predicates and running arch govern
- [ ] `sprintCloseOn: "project_milestone"` with failing milestone predicates does not close the sprint  →  prose: verified with a failing milestone predicate
- [ ] Config without `sprintCloseOn` falls back to `sprintCloseAfterN` behavior  →  cmd: npm test --prefix cli; exit: 0
- [ ] `sprintMilestone` referencing a non-existent milestone section emits a warning and falls back to count mode  →  prose: verified by naming a milestone that doesn't exist in PROJECT.md
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

**Decision:** PROMOTE → TASK-1077
