# IDEA: Cross-repository learning network — aggregate Kaizen patterns across ARCH instances
**Created:** 2026-04-30
**Source:** Strategic vision — ORACLE distills lessons within one repo; collective intelligence requires cross-repo aggregation
**Status:** DRAFT
**Meta:** P3 | XL | claude | docs/KAIZEN-LOG.md, docs/guidelines/

## Problem
ARCH learns within a single repository. Lessons discovered in one project never propagate to another. A team starting a new ARCH repo must rediscover sizing patterns, recurring error types, and protocol improvements that hundreds of other repos have already learned. Each instance starts from zero.

## Proposed solution
A human-curated, versioned knowledge base of ARCH protocol improvements derived from aggregated Kaizen patterns across repos. Not training data — a structured, opt-in contribution model:

1. ORACLE (IDEA-oracle-archive-distillation) generates candidate lessons as IDEA drafts.
2. Human promotes the most generalizable ones to a shared registry (e.g. a public ARCH-knowledge repo on GitHub).
3. Any ARCH instance can pull from the registry: `arch knowledge sync` downloads the latest approved patterns and proposes them as local Kaizen tasks.
4. Contributions are attributed, versioned, and human-approved before publication — no automated propagation of lessons.

This is the difference between a personal note-taking system and a wiki: same structure, but the network effect compounds.

## Dependencies
IDEA-oracle-archive-distillation (generates the raw lessons that feed the network).
IDEA-typed-protocol-schema (common schema makes cross-repo patterns comparable).

## Estimated size
XL — must be decomposed before entering READY. Requires external infrastructure.

## Gaps
- Define the contribution model: who can publish, how are lessons reviewed, what prevents low-quality noise?
- Define the privacy model: repos may not want to share their task history publicly.
- Decide the distribution mechanism: Git submodule, npm package, or a dedicated `arch knowledge` CLI command.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
