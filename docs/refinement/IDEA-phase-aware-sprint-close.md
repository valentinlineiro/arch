## IDEA: Phase-aware sprint close trigger

**Status:** DRAFT
**Created:** 2026-05-28
**Source:** smartcart-os pilot — count-based auto-close (sprintCloseAfterN: 15) fired mid-implementation. A feature sprint has definition/implementation/QA phases; the count threshold doesn't respect them. Sprint closed before QA was complete.
**Candidate-class:** 2-code-generation
**Candidate-size:** S
**Depends:** none

---

## Problem

`arch govern` auto-closes a sprint when `archivedThisTick >= sprintCloseAfterN`. This works for protocol projects where tasks are roughly equivalent weight and the sprint has no natural phases. It breaks for product feature sprints where:

1. **Tasks are not equivalent weight.** Closing 15 XS file-deletion tasks is not the same as closing 15 M feature tasks. Count doesn't capture sprint completion.
2. **Sprints have phases.** Definition tasks close first, then implementation, then QA. A count threshold fires during implementation and produces a sprint close with open QA tasks — which is meaningless and generates a confusing RETRO entry.
3. **The threshold is project-specific but not easily tuned.** `sprintCloseAfterN` in `arch.config.json` requires the user to know the right number upfront, which they don't for a first sprint on a new project.

The smartcart-os pilot: sprint closed mid-implementation. The sprint close generated a version bump and RETRO entry while the main feature was unfinished. The human had to work around it.

---

## Proposed Fix

Two changes, one required and one optional:

**Required: add `sprintCloseMode` config field**

```json
{
  "sprintCloseMode": "count" | "explicit" | "phase"
}
```

- `"count"` — current behavior (default, backward-compatible)
- `"explicit"` — sprint only closes when `arch sprint close` is run manually. `sprintCloseAfterN` is ignored. Recommended for product projects.
- `"phase"` — sprint closes when all tasks in the sprint have status DONE or REVIEW, regardless of count. Intended for teams that mark phase completion via task status.

**Optional: warn before auto-close**

When `sprintCloseMode: "count"` and `archivedThisTick` reaches `sprintCloseAfterN - 1`, emit an INBOX entry: `[SPRINT-CLOSE-IMMINENT] Next govern tick will close sprint X. Run arch sprint close --defer to postpone.`

---

## Migration

Existing `arch.config.json` files with `sprintCloseAfterN` continue to use `"count"` mode by default. No breaking change.

New projects initialized with `arch init` should be prompted: "Sprint close mode: count (auto) / explicit (manual) / phase (task-completion)?" — default to `"explicit"` for new installs.

---

## Acceptance Criteria

- [ ] `sprintCloseMode: "explicit"` prevents auto-close on govern tick regardless of archived count  →  prose: verified by seeding archivedThisTick > sprintCloseAfterN with explicit mode
- [ ] `sprintCloseMode: "phase"` closes sprint when all sprint tasks are DONE or REVIEW  →  prose: verified with a sprint where all tasks reach DONE
- [ ] `sprintCloseMode: "count"` preserves existing behavior  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch.config.json` without `sprintCloseMode` defaults to `"count"` (backward-compatible)  →  prose: verified with existing config fixture
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

