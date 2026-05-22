# IDEA: deterministic-governance-gates
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem
ARCH is a governing system. Governance gates — checks that produce a pass/fail outcome — must be fully deterministic. LLM output is probabilistic and non-reproducible; a gate that an LLM can influence is not a law, it is a negotiation.

Currently, LLM bleeds into governance in one confirmed place and one latent one:
1. **`arch reflect hansei` Tier 2** — outputs CONCEALMENT / INFLATION / CALIBRATED verdicts that structurally resemble governance outcomes. Exit code is non-zero on findings. An agent or CI pipeline can misread this as a blocking gate.
2. **Principle gap** — no ADR establishes the boundary. Without a written rule, future contributors will continue to reach for LLM where deterministic checks are harder to write.

Context inference (confidence scoring) is intentionally excluded — it affects what is shown, never what passes or fails.

## Proposed direction

**ADR-023: Deterministic Gate Invariant**
All governance pass/fail gates are owned by deterministic code. LLM output is advisory-only and never influences exit codes on governance paths. Concretely:
- `arch review` — already fully deterministic. No change.
- `arch govern` — already fully deterministic. No change.
- `arch reflect hansei` Tier 1 — already deterministic (diff-based). No change.
- `arch reflect hansei` Tier 2 — exit code changed to always `0`. Output header changed from "verdict" framing to explicit "ADVISORY — not a governance gate". Callers cannot block on Tier 2.

**Code change**
`reflect-command.ts` `runHanseiAnalysis()`: remove `process.exit(result.status ?? 0)` after Tier 2 LLM invocation; replace with `process.exit(0)`. Tier 2 output remains visible but cannot produce a non-zero exit.

## Decision
PROMOTE → TASK-950

## Acceptance Criteria
- [ ] `docs/adr/ADR-023-deterministic-gate-invariant.md` exists and documents the principle with explicit per-command classification
  - `file: docs/adr/ADR-023-deterministic-gate-invariant.md`
- [ ] `arch reflect hansei` Tier 2 exit code is always 0 regardless of LLM findings
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`
- [ ] Tier 2 output header explicitly reads "ADVISORY" and states it is not a governance gate
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`
- [ ] `npm test` passes
  - `cmd: npm test --prefix cli; exit: 0`
- [ ] `arch review` passes
  - `cmd: arch review; exit: 0`

## Governance class
Class: I (principle) + II (code enforcement)
Evaluates: Whether governance gate outcomes are deterministic.
Does NOT evaluate: Quality of LLM advisory output.
Boundary risk: Low — the Tier 2 code change is a one-line exit code fix. ADR touches a protected path but is self-authorizing.
