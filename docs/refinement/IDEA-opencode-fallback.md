# IDEA: Rely on opencode when gemini is exhausted for LLM assistance
**Created:** 2026-05-22
**Source:** Operational observation — Gemini quota exhaustion halts THINK advisory analysis
**Status:** DRAFT
**Meta:** P3 | S | local | docs/refinement/

## Problem

`arch analyze` (THINK mode) invokes the Gemini CLI as its LLM advisory channel. When Gemini quota is exhausted (429 rate-limit or capacity errors), the advisory analysis fails silently or with a stack trace. The system has no fallback to another available CLI — opencode is installed and available but never tried.

## Proposed solution

In the `runAnalysis` method of `analyze-command.ts`, iterate over the `clis` array from `arch.config.json` and try each in order until one succeeds. Currently it stops at the first CLI whose binary exists — if that CLI fails with a quota/429 error, the whole advisory phase fails. Instead, detect quota exhaustion and fall through to the next available CLI (opencode, claude, ollama).

Also add `opencode` to the `clis` array in `arch.config.json` if not already present, so it's a recognized fallback target.

## Dependencies

None.

## Estimated size

S — single-file change in `analyze-command.ts` + config update

## Gaps

- How to reliably detect "quota exhausted" vs other errors in the spawned CLI process? Exit code is not unique.
- `opencode` may not have a `-p` prompt flag — would need to verify its CLI template works.

## Decision
