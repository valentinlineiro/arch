# IDEA: ARCH-Core — minimal execution contract for weak models
**Created:** 2026-05-05
**Source:** Codex external review — "shrink the live protocol; give a minimal execution contract and keep the rest enforced by tooling"
**Status:** DRAFT
**Sessions:** 1
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
- **Critical unresolved: who selects Core vs Governance?** Three options: (a) human chooses which doc to load into the session, (b) arch.config.json `mode` flag, (c) AGENTS.md branches on a condition. This decision must be written before promotion.
- "Updating arch.config.json routing" is underspecified — Core is a system-prompt selection concern, not a CLI type. Routing by `cli` field doesn't map cleanly.
- DO mode Ops (sprint management, manual task ops) must be explicitly excluded from Core; the contract must state "Ops not permitted in Core mode."
- Dependency chain: IDEA-halt-policy → TASK-193 → this IDEA.

## Decision
<!-- Human writes here after THINK evaluation -->
