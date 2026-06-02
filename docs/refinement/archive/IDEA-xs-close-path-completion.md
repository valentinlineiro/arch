## IDEA: Size-tiered close path — no mandatory Hansei for XS

**Status:** PROMOTED
**Created:** 2026-05-28
**Source:** smartcart-os pilot retrospective — XS tasks (delete 3 files, change a constant, fix a fallback message) required 5–10 minutes of ceremony for 5 minutes of work. Forward Action required non-empty content; Hansei category had to match a controlled vocabulary; AC format had to be audited manually. The protocol has size-tiered Hansei obligation in principle but not in implementation.
**Candidate-class:** 2-code-generation
**Candidate-size:** M
**Depends:** none

---

## Problem

ADR-009 says XS tasks *may* self-archive when `DeterministicACVerifier` returns pass. In practice the close path still runs the full Hansei validator regardless of size:

1. **Hansei fields are mandatory for XS.** The validator requires non-empty Severity, Category, Decision, Constraint, Cost, Forward Action. For a delete-3-files task where nothing went wrong, every field is invented. The author writes content to satisfy the validator, not to record a genuine learning.
2. **Category controlled vocabulary is not XS-aware.** `[CleanCode]` is a natural description for a rename task. The validator rejects it. The author must look up the vocabulary, find the least-wrong fit (`[AuditGap]`, `[TypeHack]`), and use that instead — defeating the purpose of the Hansei.
3. **Forward Action rejects "None."** For H0 XS tasks there is genuinely no forward action. The validator rejects short strings as placeholders. The author invents a forward action.
4. **Auto-close is opt-in, not the default.** ADR-009 says "agent *may* self-archive" — this reads as an exception rather than the normal path. The human still reviews the Hansei block even when DeterministicACVerifier passes.

Net effect: the ceremony-to-value ratio for XS inverts. Hansei on a delete-3-files task produces noise, not signal. The rigor is proportional to task size in name only.

---

## Proposed Fix

Two changes, one primary and one supporting:

**Primary: No mandatory Hansei for XS**

XS tasks with `DeterministicACVerifier: pass` close without a Hansei block. The close path writes a single-line audit entry: `Closed: XS auto-close; DeterministicACVerifier: pass; no Hansei required.`

Hansei remains *optional* for XS — if something genuinely went wrong (blocker encountered, actual size exceeded estimate, constitutional anomaly), the author may write one and the validator runs normally.

Trigger for optional Hansei on XS: author explicitly adds a `## Hansei` section. If the section is absent, the validator skips it entirely.

**Supporting: Forward Action exemption for H0 + S**

For S tasks where Severity is H0, allow `Forward Action: none` (case-insensitive) without triggering the placeholder error. This handles the "nothing went wrong, S task, minor Hansei required" case where the author has a genuine H0 but is forced to invent a forward action.

---

## Migration

All existing XS tasks in archive were closed before this change — no migration needed. New XS tasks closed after this change skip Hansei by default. Existing S tasks are unaffected unless their Severity is H0.

---

## Acceptance Criteria

- [ ] XS task with passing DeterministicACVerifier closes without Hansei block  →  prose: verified by running arch task review on an XS task with no ## Hansei section; transition succeeds
- [ ] XS task with ## Hansei section present runs full validator on that section  →  prose: verified by adding an intentionally malformed Hansei to an XS task; validator rejects it
- [ ] S task with Severity H0 accepts `Forward Action: none` without error  →  prose: verified by running arch task review on an H0 S task with Forward Action: none
- [ ] S task with Severity H1+ still requires non-empty Forward Action  →  prose: verified with an H1 S task; empty Forward Action is rejected
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

**Decision:** PROMOTE → TASK-1076
