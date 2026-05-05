# ADR-008: Centralize halt conditions in HALT.md

**Date:** 2026-05-05
**Status:** ACCEPTED
**Deciders:** Valentin Lineiro, Gemini CLI

---

## Context
Halt conditions were previously scattered across DO.md prose, making it difficult for models (especially weaker ones) to consistently identify when they should stop execution, leading to undesirable drift.

## Decision
Centralize all halt conditions in a structured table within `docs/HALT.md` and implement a new `HaltPolicy` drift check to ensure its presence and structural integrity.

## Rationale
A centralized, structured table is easier for LLMs to use as a reference than prose documentation. The drift check ensures this safety mechanism is not accidentally removed or corrupted.

## Consequences
**Positive:**
- Improved model reliability and reduced drift.
- Clear, machine-readable reference for halt triggers and exit codes.

**Negative / trade-offs:**
- Adds another documentation file to maintain.
- `arch review` now requires `HALT.md` and `HALT-LOG.md` to exist.

---
