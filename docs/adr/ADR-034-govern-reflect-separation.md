# ADR-034: Govern/Reflect Structural Separation

**Date:** 2026-05-24
**Status:** Accepted
**Deciders:** Valen (human)
**Source:** TASK-1005 — enforce structural LLM/governance separation
**Extends:** ADR-026 (Epistemic Layer Separation)

## Context

ADR-026 declared `arch govern` deterministic in principle. This ADR enforces the boundary in code and documents the classification of every INBOX entry type.

An AI governance system that relies on AI to make governance decisions is not a governance system — it is a negotiation. If an LLM can influence whether a governance gate passes or fails, the gate is probabilistic and non-reproducible. ARCH's value is that governance is auditable: the same repo state always produces the same govern result.

## Decision

### Rule 1: The govern tick contains zero LLM invocations

`govern-system.ts execute()` must never call `spawnSync`, `execSync`, or any LLM provider. It may suggest running `arch reflect` in console output (informational only). All subprocess calls in govern are git operations (`gitRepository.commit`, `gitRepository.add`) — not LLM calls.

**Verification:** `grep -n "spawnSync\|execSync" cli/src/main/ts/application/use-cases/govern-system.ts` must return 0 matches.

### Rule 2: `arch govern reflect` is a manual command, not a govern sub-step

`arch govern reflect` invokes `analyze-command.ts` which calls LLM CLIs (`spawnSync` on `config.clis`). This must never be automatically triggered by the govern tick. It is an operator-invoked advisory tool.

### Rule 3: INBOX entry classification

| Prefix | Source | Deterministic? | Blocks governance? |
|--------|--------|---------------|-------------------|
| `[ANDON_HALT]` | govern-system.ts | Yes | Yes — halts task execution |
| `[PATTERN-ALERT]` | hansei-synthesizer.ts | Yes — corpus counts | No |
| `[CORPUS_ALERT]` | govern-system.ts corpus audit | Yes — weighted score | No |
| `[EMERGENT]` | audit-command.ts | Heuristic | No |
| `[ADVISORY]` | analyze-command.ts | No — LLM output | Never |
| `AWAITING_PROMOTION` | escalation-store.ts | Yes | No |

**Rule:** `[ADVISORY]` entries written by `arch analyze` or `arch govern reflect` must be prefixed `[ADVISORY]` so readers and agents can distinguish deterministic signals from advisory suggestions.

### Rule 4: Corpus audit in govern is deterministic

`CorpusAuditCommand.runQuiet()` is called by the govern tick (every N ticks). This is deterministic — it runs three code-based checks against the corpus index (no LLM). The result may write `CORPUS_ALERT` or `ANDON_HALT` to INBOX — these are legitimate governance signals, not advisory output.

## Consequences

- `arch govern` is fully auditable: given the same repo state and `.arch/` state, it always produces the same outcome
- `arch govern reflect` remains available as a manual tool — operators run it deliberately when they want advisory analysis
- CI pipelines that call `arch govern` can trust its exit code: non-zero means a deterministic gate failed, never an LLM opinion
- Agents running `arch govern` cannot be manipulated by crafting LLM output that produces non-zero exits
- INBOX readers filter on prefix to determine whether an entry is actionable (deterministic) or informational (advisory)
