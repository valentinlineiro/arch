# IDEA: deterministic-ac-expansion
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

L3 self-archive (no Auditor session required) currently applies only to XS/S tasks where `DeterministicACVerifier` returns `pass: true` with at least one `cmd:` or `file:` AC. M tasks in low-risk classes (`7-operations`, `6-writing`) still require a human Auditor session even when all ACs are fully machine-verifiable.

This is an asymmetry between what the governance model declares safe and what the eligibility rules encode. If an M `7-operations` task has three `cmd:` ACs that all pass, the Auditor session adds overhead without adding decision quality.

## Proposed direction

**Extend L3 eligibility to M tasks for `6-writing` and `7-operations`** when:
- All ACs have a `cmd:` or `file:` predicate (no `prose:` or `code:` ACs)
- `DeterministicACVerifier` returns `pass: true`
- No protected path was modified

This matches the existing L3 conditions for XS/S — the size boundary is the only change.

**Separately: richer `cmd:` predicate templates**

Current `cmd:` ACs typically assert exit code only. Expand the AC template library to support:
- Coverage threshold: `cmd: npm test --prefix cli; coverage: ≥80`
- Lint score: `cmd: arch review; exit: 0` (already standard)
- File content assertion: `file: path/to/file; contains: "expected string"`
- Negative assertion: `file: path/to/file; absent: "forbidden string"`

Richer predicates mean more ACs become machine-verifiable upstream, reducing the number of tasks that need prose verification.

**What this does not change:**
- M tasks in `2-code-generation` still require explicit `L3:yes` sprint annotation.
- L/XL tasks never qualify for L3 — they route through the Auditor regardless.
- Protected path modifications always escalate regardless of L3 eligibility.

**Constitutional alignment:**
This expands Class I coverage without making Class II claims. Machine-verifiable ACs are verifiable because they have deterministic exit conditions — not because THINK assessed them as probably correct.

## Governance class

Class: I
Evaluates: Whether all ACs for a given task are deterministically verifiable.
Does NOT evaluate: Whether the ACs are the right ones, or whether the implementation is architecturally sound.
Boundary risk: If reviewers treat "L3 passed" as equivalent to "this was a good implementation," the system has made a Class II claim through a Class I gate. Mitigation: L3 archive messages explicitly state "structural AC verification only" and recommend periodic human spot-checks of the archive.

## Decision
PROMOTE → TASK-965
