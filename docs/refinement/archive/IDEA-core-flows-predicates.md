## IDEA: Core Flows predicates in PROJECT.md checked on every govern tick

**Status:** PROMOTED → TASK-1068
**Created:** 2026-05-28
**Source:** smartcart-os pilot retrospective — TASK-008 stubbed POST /api/inventory correctly per the cut list. The main "Add to Cart" CTA called that endpoint. The user discovered the broken flow after close, not ARCH. No govern-level check covered end-to-end flow integrity. Per-AC predicates verify task scope; nothing verifies that primary user flows still work after the task.
**Candidate-class:** 2-code-generation
**Candidate-size:** M
**Depends:** none
**Sessions:** 1

---

## Problem

ARCH verifies task-level correctness (AC predicates pass → task closes). It does not verify system-level correctness (primary user flows still work after N tasks close).

The smartcart-os example:
- PRD defined user flows: basket entry → comparison → recommendation
- TASK-008 stubbed POST /api/inventory as a planned cut
- AC predicate: `cmd: curl ... | grep 404; exit: 0` — passed correctly
- Reality: the main CTA called that endpoint. The stub silently broke basket entry.
- ARCH closed TASK-008. No govern-level check caught the regression.

This is not a coverage gap in TASK-008's ACs — the stub was intentional and correct per scope. The gap is that "does basket entry still work?" was never expressed as a verifiable predicate anywhere in the system. The PRD described the flow in prose; that prose was never translated into a runnable check.

The pattern generalizes: any task that correctly implements its scope can inadvertently break a primary flow that was never encoded as a predicate. Govern doesn't catch it because govern only checks task-level predicates.

---

## Proposed Fix

Add a `## Core Flows` section to `PROJECT.md` (the project's source-of-truth document):

```markdown
## Core Flows

### Basket entry
- [ ] Add to Cart CTA works  →  cmd: npx playwright test --grep "add to cart"; exit: 0

### Price comparison
- [ ] Comparison view loads with ≥2 results  →  cmd: npx playwright test --grep "price comparison"; exit: 0

### Recommendation
- [ ] Recommendation panel renders  →  cmd: npx playwright test --grep "recommendation"; exit: 0
```

`arch govern` checks all `## Core Flows` predicates on every tick (same runner as AC predicates). Results are emitted to `EVENTS.md` as `FLOW_CHECK_PASS` or `FLOW_CHECK_FAIL` events.

**Pre-close warning:** If a task's declared context path overlaps with a failing core flow (heuristic: the flow predicate file path contains a substring of the context path), `arch task review` emits:
```
[FLOW-REGRESSION] Core Flow "Basket entry" is currently failing. 
Verify this task did not introduce the regression before closing.
```
This is advisory, not blocking. The task can still close. The warning surfaces the question.

**Govern summary:** `arch govern` output includes a Core Flows health section:
```
Core Flows: 2/3 passing
  ✓ Price comparison
  ✓ Recommendation
  ✗ Basket entry — last passed: 2026-05-20
```

---

## Scope limits

- Core Flows predicates must be maintained by the project author. ARCH cannot auto-generate them — flows require domain knowledge.
- The overlap heuristic (context path substring match) produces false positives. A task touching `src/server/` might not affect basket entry even if the Playwright test for basket entry lives in `src/server/`. The warning is advisory precisely because of this.
- Requires the project to have Playwright or equivalent e2e tests. Projects without them can use `prose:` predicates in Core Flows — govern logs them as "manual check required" rather than running them.

---

## Acceptance Criteria

- [ ] `arch govern` runs all `## Core Flows` cmd predicates and emits FLOW_CHECK_PASS/FAIL events  →  prose: verified by seeding a PROJECT.md with a passing and failing flow predicate; govern emits both event types
- [ ] `arch task review` emits `[FLOW-REGRESSION]` warning when a core flow is failing and context path overlaps  →  prose: verified with a failing flow and a task whose context path matches
- [ ] `arch govern` output includes Core Flows health summary  →  prose: verified by reading govern output with mixed-pass/fail flows
- [ ] PROJECT.md without `## Core Flows` section runs govern without error (optional section)  →  prose: verified on a project with no Core Flows section
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision
PROMOTE → TASK-1068

