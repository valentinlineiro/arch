# IDEA: corpus-import — import task archive and ADRs from external ARCH repos
**Created:** 2026-05-24
**Source:** Strategic — enable federated learning across projects
**Status:** PROMOTED
**Meta:** P2 | S | human | cli/src/main/ts/application/commands/corpus-import-command.ts, cli/src/main/ts/application/use-cases/corpus-index.ts

## Problem

ARCH's corpus is siloed per repo. When you run ARCH on a grocery optimizer project, the patterns, Hansei signals, and ADR decisions it generates are invisible to the main ARCH corpus. `arch ask` can't surface "we hit this exact product-matching problem in the grocery project" when working on something new.

The corpus is the memory. Siloed memory doesn't compound.

## Proposed Solution

`arch corpus import <path|url>`

Reads another ARCH repo's:
- `docs/archive/TASK-*.md` → indexed into local corpus with source tag
- `docs/adr/ADR-*.md` → added to local ADR corpus with source tag
- `docs/refinement/archive/IDEA-*.md` → available for pattern queries

Each imported entry tagged with `source: <project-slug>` in the corpus index so:
- `arch ask` can query globally (default) or filtered: `arch ask --project grocer "product matching"`
- `arch corpus audit` scores each project's corpus separately
- No namespace collision — task IDs preserved as `grocer:TASK-001` internally

**What it does NOT do:**
- Does not import task files into `docs/tasks/` — foreign tasks don't become actionable
- Does not merge `.arch/` state (ledger, focus, escalations) — those are per-repo
- Does not sync bidirectionally — import is one-way, read-only

**Import command:**
```
arch corpus import /path/to/grocery-optimizer
arch corpus import https://github.com/you/grocery-optimizer  # git clone + import
arch corpus import /path --as grocer  # explicit project slug
```

## Constraint Axes
- Dependency ordering: Requires stable corpus index (CorpusIndexService — done)
- Temporal validity: Valid now — first external project needs this immediately
- Abstraction layer: New command + corpus index extension. No domain model changes.
- Observability validity: Deterministic — file reads, no LLM in import path
- Priority displacement: P2 S — enables the compounding that justifies ARCH

## Gaps
- `arch ask` currently does full-text search over one corpus. Multi-source querying needs a source filter param — minor extension.
- Remote import via git clone adds ~30s latency. Acceptable for an import operation.

## Decision
PROMOTE → TASK-1025
