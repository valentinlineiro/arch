# ADR-023: Deterministic Gate Invariant

**Status:** Accepted
**Date:** 2026-05-19
**Deciders:** valentinlineiro

## Context

ARCH is a governing system. Governance gates — checks that produce a pass/fail outcome — must be fully deterministic. A gate whose outcome an LLM can influence is not a law; it is a negotiation. LLM output is probabilistic and non-reproducible: the same input can produce different exit codes across runs, making any gate that depends on it untestable and ungovernable.

Prior to this ADR, `arch reflect hansei` Tier 2 called `process.exit(result.status ?? 0)` after invoking the LLM CLI. A non-zero LLM exit (e.g., API error, rate limit, token limit) would propagate as a non-zero exit from `arch reflect hansei`, allowing an LLM failure to block a workflow.

## Decision

**All governance pass/fail gates are owned by deterministic code. LLM output is advisory-only and never influences exit codes on governance paths.**

### Command classification

| Command | Gate type | LLM role |
|---|---|---|
| `arch review` | Deterministic | None |
| `arch govern` | Deterministic | None |
| `arch reflect hansei` Tier 1 | Deterministic (diff-based) | None |
| `arch reflect hansei` Tier 2 | Advisory | Produces human-readable analysis only |
| `arch reflect` (THINK mode) | Advisory | Produces proposals only |
| `arch exec` | Execution | Implements tasks; does not own gates |

### Enforcement

- `arch reflect hansei` Tier 2 always exits 0 regardless of LLM CLI exit code.
- Tier 2 output begins with: `ADVISORY — output is informational only. This analysis is not a governance gate.`
- No future command may introduce a governance gate whose outcome depends on LLM output. If a new check requires LLM analysis, it must be introduced as an advisory subcommand with `exit 0` semantics.

## Consequences

- `arch reflect hansei` Tier 2 can no longer be used as a blocking CI gate. Any pipeline step calling it must treat its output as informational.
- Tier 1 (deterministic diff-based drift detection) remains the sole blocking hansei check.
- The boundary between enforcement and analysis is now written and enforced by exit code contract, not convention.
