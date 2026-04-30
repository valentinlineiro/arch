# IDEA: Open standard portability — ARCH as an interoperability protocol for heterogeneous AI tools
**Created:** 2026-04-30
**Source:** Strategic vision — arch.config.json routing is already model-agnostic; the logical ceiling is a standard any AI tool can speak
**Status:** DRAFT
**Meta:** P3 | XL | human | arch.config.json, docs/agents/, docs/TASK-FORMAT.md

## Problem
ARCH is currently a methodology that one AI tool runs at a time. The routing config assigns task classes to different models, but each invocation is a full session that must re-read the entire protocol. There is no standard interface by which heterogeneous AI tools — VS Code Copilot, Claude, Gemini, a local model — could collaborate on the same repository simultaneously, each handling the task classes it's best at.

## Proposed solution
Define an ARCH Protocol Specification (APS): a versioned, open document that specifies:
- The required file layout (`docs/tasks/`, `docs/archive/`, `docs/refinement/`)
- The canonical task format (TASK-FORMAT.md as normative spec)
- The required CLI command surface (`arch review`, `arch govern`, `arch next`)
- The INBOX write/read protocol for HITL gates
- The commit message conventions

Any AI tool that implements APS can participate as a DO agent, THINK conductor, or Auditor in an ARCH repository — regardless of vendor. The `arch.config.json` routing table becomes a tool registry, not a model preference file.

This is the difference between a product and a platform: ARCH becomes an interoperability layer, not just a methodology one team uses.

## Dependencies
IDEA-typed-protocol-schema (the schema is the machine-readable core of the specification).
IDEA-executable-acceptance-criteria (structured ACs make cross-tool task handoffs unambiguous).

## Estimated size
XL — requires external community/documentation work beyond the repository itself.

## Gaps
- Define the governance model for the specification itself: who can propose changes, how are breaking changes ratified?
- Decide the publication format: GitHub repository, RFC-style document, or npm package with TypeScript types.
- Determine minimum viable compliance: what does "ARCH-compatible" mean for a tool that only implements a subset?

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
