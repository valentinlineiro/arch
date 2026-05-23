# IDEA: automate-govern-metadata-flush — govern should commit its own metadata writes atomically
**Decision-required:** yes
**Created:** 2026-05-16
**Source:** TASK-258 Hansei H3b — govern writes to .arch/ outside of any committed transaction
**Status:** PROMOTED
**Decision-required:** yes
Sessions: 5
**Decision-required:** yes

## Problem

`arch govern` writes multiple files to `.arch/` (focus-ledger, context-index, causal-signal, etc.) as separate operations. If the process is interrupted mid-write, the `.arch/` state is partially updated but the git commit has not happened. On the next govern run, the diff check sees modifications to protected state files that weren't part of any committed transaction. This also causes the append-only check in `loadEvents` to fail when govern's own writes create deletions in the diff.

The H3b severity in TASK-258 flagged this as systemic risk: the govern loop is the integrity guardian, but its own writes are not atomic.

## Proposed Solution

Govern batches all `.arch/` writes into a single transaction: accumulate all mutations in memory, then write all files and commit in one atomic git operation. No partial state. If writing fails, nothing is committed — the previous state is preserved.

Implementation: `GovernTransaction` class that buffers `fileSystem.writeFile` calls during a govern tick, then flushes all at once before the `git commit` that closes the tick. The existing `commitAndPush` call becomes the flush boundary.

## Constraint Axes
- Dependency ordering: None — govern already has a commit step
- Temporal validity: Valid now; risk increases as govern runs more frequently
- Abstraction layer: Correct — infrastructure concern
- Observability validity: Deterministic — write ordering is a file I/O concern
- Priority displacement: P2 — not blocking but systemic risk

## Decision
PROMOTE → TASK-997
