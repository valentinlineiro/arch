# IDEA: proportional-protocol
**Created:** 2026-05-18
**Source:** Operator session — post-TASK-934 follow-on; adoption barrier analysis
**Status:** PROMOTED
**Meta:** P1 | M | claude | docs/agents/DO.md, docs/TASK-FORMAT.md, docs/AGENTS.md, cli/src/main/ts/application/commands/capture-command.ts

## Problem

TASK-934 established tiered Hansei and Approval obligations (XS/S: triggered-only; M/L/XL: mandatory). That removed one friction layer. But the underlying adoption problem persists: ARCH's ceremony budget is flat across all task sizes. An XS operational fix — a one-line config correction, a dead link removal, a stale comment — carries the same structural overhead as a complex M code-generation task: a task file, AC checklist, predicate lines, Definition of Done, Focus field management, commit conventions.

This is not a compliance problem. It is a protocol-weight problem. The operator doing ten XS fixes a day will either skip governance or resent it.

Proportional Protocol targets the task creation and execution path directly. The goal is: ceremony proportional to consequence.

## Proposed solution

Three concrete changes, ordered by impact:

**1. Lightweight task template for XS operational work**

`arch task capture` currently applies the same AC template regardless of class and size. For XS tasks in classes `6-writing` and `7-operations`, generate a stripped template:

```markdown
## TASK-XXX: <title>
**Meta:** P2 | XS | READY | Focus:no | 7-operations | claude | <context>

### Acceptance Criteria
- [ ] <single verifiable outcome>  →  file: <path>
```

No Definition of Done section. No Hansei placeholder. One AC. The operator can add more if complexity warrants it; the template does not demand it.

**2. Fast-path task close for XS with single-AC `file:` or `cmd:`**

Currently `arch task done TASK-XXX` runs `DeterministicACVerifier` and requires the full L3 gate check. That's right for S tasks. For XS tasks with a single `file:` predicate, the verification is deterministic and instant. Codify this as an explicit fast-path that skips the Hansei wizard entirely (no TTY prompt, no stub insertion) when size=XS and the only trigger condition is none.

This is a different optimization from the existing L3 gate — the L3 gate skips the Auditor; this skips the interactive Hansei prompt at close time, which currently blocks the automated loop on XS tasks.

**3. Proportional focus on READY gate for XS**

The Definition of Ready currently requires the same fields regardless of size. For XS tasks:
- `Depends:` line: omit if none (already optional but linter warns)
- `Definition of Done:` section: optional (currently triggers a warning in some validators)

These are already semi-optional in the spec but the linter and capture template generate them regardless. Make the XS exemption explicit in the capture template and document it as canonical in TASK-FORMAT.md.

## What this is not

- Not a bypass of the task file requirement. XS tasks still need a file in `docs/tasks/`.
- Not a bypass of the AC requirement. One verifiable AC is still required.
- Not a scope change to L3 gate autonomy. Auditor bypass conditions remain unchanged.

## Dependencies
TASK-934 (tiered Hansei) — DONE. This is a follow-on, not a dependency.

## Estimated size
M

## Gaps
<!-- THINK fills this section — do not edit manually -->

## Decision
PROMOTE → TASK-937
[influenced-by: none]
**Decision:** PROMOTE → TASK-937 (DONE 2026-05-18). Proportional protocol implemented: stripped XS template, size-aware Hansei gate.
