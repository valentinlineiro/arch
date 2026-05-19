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

This is not a clerical optimization. It is a structural ontology change: it redefines what counts as a valid governance object at origin. Fixing task ecology upstream eliminates representational waste across every downstream step simultaneously — but the deeper effect is architectural.

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

**Hidden coupling — THINK's role shift:**
This change silently redefines THINK's authority adjacency. Currently THINK is an interpreter of IDEAs into structured proposals. After this change, THINK becomes a compiler of governance constraints into executable artifacts — it pre-shapes what the governance system can see and verify. The second-order effects:
- Fewer ambiguous tasks reach humans (intended)
- More decisions become pre-resolved structurally (intended)
- Governance becomes increasingly "pre-shaped" by THINK's compilation choices (requires monitoring)

This is safe only if Phase 2 (semantic compression) exists soon after. Without it: high determinism without semantic compression — everything looks clean, nothing is actually simplified, just pre-formatted. THINK's formatting choices invisibly constrain what the governance system can represent.

This IDEA is therefore also the seed of Phase 2. The novelty scoring, precedent distance functions, and similarity metrics that Phase 2 requires are only meaningful if governance inputs have consistent structure. This IDEA creates that precondition.

**Constitutional alignment:**
This changes what governance objects the system produces, not who decides on them. The goal is to stop generating ambiguous governance artifacts upstream rather than compensating for them downstream. But unlike the other Phase 1 items, this is not amortization — it is input grammar hardening with architectural consequences.

## Governance class

Class: I (template and tooling change) + II (task ecology shift + THINK role redefinition)
Evaluates: Whether ACs are structurally verifiable at creation time.
Does NOT evaluate: Whether verifiable ACs adequately capture task intent — that remains human judgment at AC authoring time.
Boundary risk (primary): If the verifiability score is treated as a quality score ("high verifiability = well-scoped task"), the system conflates structural property with semantic adequacy. A task with three trivial `cmd:` ACs and no real coverage is structurally verifiable and substantively shallow.
Boundary risk (secondary): THINK's compilation choices shape what the governance system can see. If those choices encode assumptions about scope, risk, or precedent, the system has hidden its interpretation inside tooling — the core failure mode identified in GOVERNANCE.md. Mitigation: Phase 2 must make THINK's compilation choices inspectable, not just their outputs.
