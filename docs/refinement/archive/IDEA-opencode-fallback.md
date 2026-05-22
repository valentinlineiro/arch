# IDEA: Rely on opencode when gemini is exhausted for LLM assistance
**Created:** 2026-05-22
**Source:** Operational observation — Gemini quota exhaustion halts THINK advisory analysis
**Status:** DRAFT
**Meta:** P3 | S | 7-operations | local | cli/src/main/ts/application/commands/analyze-command.ts, arch.config.json

## Problem

`arch analyze` (THINK mode) invokes the Gemini CLI as its LLM advisory channel. When Gemini quota is exhausted (429 rate-limit or capacity errors), the advisory analysis fails silently or with a stack trace. The system has no fallback to another available CLI — opencode is installed and available but never tried.

The root cause: `analyze-command.ts` lines 329–346 iterate over `clis` from config but call `process.exit(0)` immediately after the first CLI runs — regardless of whether it succeeded or failed. If Gemini returns non-zero (quota exhausted), the error is printed but execution never falls through to the next CLI.

## Proposed solution

`analyze-command.ts` line 336 (`spawnSync(...)`) currently ignores the exit status. Change the loop to check `result.status`:
- If 0 (success): keep current behavior (`process.exit(0)`).
- If non-zero (failure): log the failure, continue to the next CLI in the `clis` array.

opencode is already registered in `arch.config.json` (`clis[?].name == "opencode"`, `providers[?].name == "opencode"`) and also has `"template": "opencode \"{prompt}\""`. No config change needed — the template works. The CLI listing will try gemini first, then opencode, then fall through to claude/ollama.

A potential refinement: add `exit 0` to the opencode template so it doesn't fail on non-zero exit from the inner command: `"opencode \"{prompt}\" ; exit 0"`.

## Precedent analysis

**Novelty: LOW** (score ~0.35). Precedent exists in the archive:
- TASK-183: bridge provider fallback mechanism
- TASK-210/211/212/213: exec bridge retry logic and fallback
- TASK-921/922/929: provider fallback strategies (Size M, class 2-code-generation)
- ADR-012: Exec/Bridge Layer Bugfixes — maxBuffer, buildCommand signature, local routing

The concept of "try providers in order, fall through on failure" already exists in the `strategies` schema (arrays of `{provider, model}` fallback entries). This IDEA extends the same pattern to the CLI advisory channel.

## Dependencies

None.

## Estimated size

S — single-file change in `analyze-command.ts` (change loop exit logic, ~5 lines)

## Gaps (THINK evaluation)

1. **Exit code ambiguity** — A quota failure (429) and a genuine CLI error both produce non-zero exit. The proposed solution treats ALL non-zero as "try next," which is acceptable since advisory is non-binding (per ADR-023). False positives (skipping a working CLI due to transient non-zero) are harmless.

2. **Stderr pollution** — The failed CLI's error output (Gemini stack trace) prints to stderr before the next CLI is tried. Mitigation: capture stderr on failure and only print if ALL CLIs fail. Optional refinement, not required for MVP.

3. **Infinite fallback** — If all CLIs fail, the loop exhausts naturally and falls through to line 337's fallback prompt display. This already works — no change needed.

4. **Spawning overhead** — Each CLI `which` check is fast (~1ms). No performance concern.

## Decision
PROMOTE → TASK-996
