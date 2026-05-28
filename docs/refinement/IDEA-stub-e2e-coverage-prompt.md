## IDEA: Prompt for end-to-end flow coverage when AC stubs an endpoint

**Status:** DRAFT
**Created:** 2026-05-28
**Source:** smartcart-os pilot — TASK-008 stubbed POST /api/inventory to 404 per the cut list. DeterministicACVerifier passed (AC predicates all green). The main CTA called that endpoint; the user discovered the broken flow post-close, not ARCH.
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none

---

## Problem

When an AC stubs an endpoint or returns a fixed error response, ARCH's close path verifies that the stub is in place but does not ask whether the stubbed path is called by a primary user flow.

The TASK-008 example:
- AC: `cmd: curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/inventory | grep 404; exit: 0` ✓
- DeterministicACVerifier: pass ✓
- Reality: the main "Add to Cart" CTA called POST /api/inventory. The 404 stub silently broke the core user flow.

This is not an ARCH bug — it's a test coverage gap the task author didn't anticipate. But ARCH has enough signal to prompt for it: the AC contains a stub pattern (`return 404`, `stub`, or a fixed-response command), and the task is in a product codebase. A one-line capture prompt at task-start or review-time would have surfaced the risk.

---

## Proposed Fix

At `arch task review` time, if any AC predicate matches stub heuristics, emit a structured warning:

**Stub heuristics (any of):**
- AC contains `404`, `stub`, `mock`, `return []`, `hardcoded`
- AC command is a static response assertion (e.g., `grep 404`, `grep "\[\]"`)

**Warning text (to INBOX or stderr):**
```
[STUB-COVERAGE] TASK-XXX: AC contains a stub pattern. Verify: does the stubbed path affect a primary user flow? If yes, add an end-to-end AC before closing.
```

This is advisory, not blocking. The author can add a prose AC acknowledging the scope limit, or add an e2e predicate. The warning disappears if the task has at least one AC referencing the same endpoint in a non-stub context (e.g., a Playwright test or curl success assertion).

---

## Scope limits

- No static analysis of which endpoints are "primary" — that requires codebase-specific knowledge ARCH doesn't have.
- Heuristic-based: false positives are acceptable (the warning is cheap); false negatives are the risk we're mitigating.
- Does not require e2e tests to be present — only prompts the author to consider them.

---

## Acceptance Criteria

- [ ] `arch task review` emits `[STUB-COVERAGE]` warning when an AC contains stub heuristic keywords  →  prose: verified manually with a stub-pattern AC
- [ ] Warning is advisory only — does not block REVIEW transition  →  prose: task with stub AC can still transition to REVIEW
- [ ] Warning is suppressed if task has a prose AC explicitly acknowledging scope  →  prose: verified with `prose: endpoint intentionally stubbed; no primary flow affected`
- [ ] No false positive on non-stub cmd predicates (e.g., `cmd: npm test`)  →  prose: verified with a standard test-predicate AC
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

