# IDEA: ARCH-Core — minimal execution contract for weak models
**Created:** 2026-05-05
**Source:** Codex external review — "shrink the live protocol; give a minimal execution contract and keep the rest enforced by tooling"
**Status:** DRAFT
**Meta:** P2 | M | local | docs/

## Problem
The full ARCH governance stack (THINK.md, DO.md, PRINCIPLES.md, KAIZEN-LOG.md, plus arch.config.json routing) requires significant synthesis and judgment to follow correctly. Weak models lose state across long instructions, follow local wording instead of system intent, and invent missing structure. The current protocol is tuned for strong models, not for broad executor compatibility.

## Proposed solution
Define a single short doc — `docs/ARCH-CORE.md` — that captures the minimal execution contract:

1. Run `arch next` → get one task or halt
2. Read the task file; execute each AC in order
3. Run `arch task review TASK-XXX` → all predicates must pass
4. On any failure: halt, write reason to INBOX, stop

This doc is the only thing a weak executor loads. It references only CLI commands, never governance prose. The existing THINK.md, DO.md, and PRINCIPLES.md become the ARCH-Governance layer, loaded only by strong models or humans performing kaizen and protocol evolution.

The split requires no code changes — only doc authoring and a decision about which responsibilities belong to each layer.

## Dependencies
- TASK-193 (`arch next`) is a prerequisite: ARCH-Core's step 1 depends on it
- IDEA-halt-policy should be resolved concurrently (halt conditions referenced in step 4)

## Estimated size
M — authoring ARCH-CORE.md, updating AGENTS.md onboarding to distinguish Core vs Governance entry points, updating arch.config.json routing

## Gaps
<!-- THINK fills this section when invoked -->

## Decision
<!-- Human writes here after THINK evaluation -->
