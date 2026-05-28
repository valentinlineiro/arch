## IDEA: Complete the XS/S lightweight close path

**Status:** DRAFT
**Created:** 2026-05-28
**Source:** smartcart-os pilot retrospective — XS task close required 2-3 extra edits despite ADR-009 Auditor exemption. Forward Action field required non-empty content; cmd predicates failed on lint/review commands outside task scope.
**Candidate-class:** 2-code-generation
**Candidate-size:** M
**Depends:** none

---

## Problem

ADR-009 removed the Auditor gate for XS/S tasks, but the close path still imposes:

1. **Forward Action must be non-empty.** For H0 tasks where nothing went wrong, there is genuinely no forward action. The validator rejects "None." as a placeholder, forcing authors to invent content.
2. **cmd: predicates fail on out-of-scope commands.** Tasks that include `cmd: npm run lint` or `cmd: arch review` as ACs can fail close if those commands exit non-zero for reasons unrelated to the task (e.g., pre-existing lint errors, in-flight tasks failing review). The predicate system has no way to scope "expected failure reasons."
3. **prose: predicates not default-allowed.** For XS/S tasks confirmed by DeterministicACVerifier, prose ACs add no value — the verifier already confirmed the structural AC. But the validator still warns on them.

The net effect: `arch task review TASK-XYZ` for a delete-3-files task required as many edits as a write-PRD task. ADR-009 is half-built. The lighter close path was approved in principle but not completed in implementation.

Evidence: smartcart-os pilot saw ~2-3 extra edits per XS close. The Hansei validator ran the same suite regardless of task size.

---

## Proposed Fix

Three targeted changes:

**1. Forward Action exemption for H0 + XS/S**
When `Severity: H0` and task size is XS or S, allow `Forward Action: none` (case-insensitive) without triggering the placeholder error. The spirit of the forward-action requirement is to prevent paper-over-the-cracks H0s on substantive tasks — it doesn't apply when the severity is genuinely H0 and size confirms bounded scope.

**2. Soft-fail mode for cmd predicates with exit-mismatch**
Add a `; soft: true` qualifier to cmd predicates: `cmd: npm run lint; exit: 0; soft: true`. A soft predicate logs a warning instead of blocking the transition. This allows tasks to include correctness-signal commands without making the close dependent on system-wide lint state.

Alternatively: if a cmd predicate exits non-zero and the error is *identical* across multiple tasks (suggesting a pre-existing failure, not a task regression), auto-promote it to a warning.

**3. prose: default-allowed for XS/S when DeterministicACVerifier passes**
The existing XS close logic (`ADR-009`) already says: size XS + DeterministicACVerifier returns `pass: true` + evidence contains ≥1 `cmd:` or `file:` AC → agent may self-archive. For such tasks, prose ACs should not generate warnings.

---

## Acceptance Criteria

- [ ] H0 + XS/S tasks accept `Forward Action: none` without validation error  →  prose: verified by running arch task review on an H0 XS task with Forward Action: none
- [ ] `; soft: true` qualifier on cmd predicates logs a warning but does not block transition  →  prose: verified with a deliberately failing cmd predicate marked soft
- [ ] XS/S tasks passing DeterministicACVerifier do not warn on prose-only ACs  →  prose: verified by checking a task with only prose predicates at XS size
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

