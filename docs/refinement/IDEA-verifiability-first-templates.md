# IDEA: verifiability-first-templates
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

Most human interaction overhead in ARCH is downstream of a single upstream problem: tasks are created with ambiguous or prose-only ACs.

When an AC cannot be verified mechanically, every downstream step costs more:
- The implementing agent must interpret intent
- `arch review` cannot verify it
- The Auditor must reconstruct context to evaluate it
- Hansei is harder to write because outcomes are less legible

The current `arch task capture` command generates ACs but does not enforce verifiability. Prose ACs (`prose:`, `code:`) are structurally identical to verifiable ones at creation time — the difference only surfaces at review.

This is the highest-leverage Phase 1 item. Fixing task ecology upstream eliminates friction across every downstream step simultaneously.

## Proposed direction

**1. Verifiability-first AC templates per task class**

For each task class, define a canonical AC template set where at least one AC per acceptance criterion has a `cmd:` or `file:` predicate. Class-specific examples:

| Class | Default AC template |
|---|---|
| `2-code-generation` | `cmd: npm test --prefix cli; exit: 0` + `file: <changed file>` |
| `7-operations` | `cmd: arch review; exit: 0` + `cmd: <operation command>; exit: 0` |
| `6-writing` | `file: <doc path>` + at least one structural check (e.g., contains section header) |

Templates are suggestions, not requirements — the human can override. But the default is verifiable.

**2. Verifiability score at capture time**

`arch task capture` computes a verifiability score at creation (% of ACs with at least one `cmd:` or `file:` predicate) and displays it. Score below a threshold (e.g., 50%) surfaces a warning: "This task will require an Auditor session. Add cmd: or file: predicates to enable L3 closure."

No blocking — just visibility. The human decides whether prose ACs are appropriate for this task.

**3. `prose:` AC annotation**

When a `prose:` AC is genuinely required (semantic correctness, architectural intent), it should be explicitly annotated as `prose:` to signal that human review is load-bearing. Currently prose ACs are indistinguishable from verifiable ACs that someone forgot to write predicates for.

**Constitutional alignment:**
This changes what governance objects the system produces, not who decides on them. The goal is to stop generating ambiguous governance artifacts upstream rather than compensating for them downstream.

## Governance class

Class: I (template and tooling change) + II (task ecology shift)
Evaluates: Whether ACs are structurally verifiable at creation time.
Does NOT evaluate: Whether verifiable ACs adequately capture task intent — that remains human judgment at AC authoring time.
Boundary risk: If the verifiability score is treated as a quality score ("high verifiability = well-scoped task"), the system conflates structural property with semantic adequacy. A task with three trivial `cmd:` ACs and no real coverage is structurally verifiable and substantively shallow. The warning message must be framed as a governance cost signal, not a quality endorsement.
