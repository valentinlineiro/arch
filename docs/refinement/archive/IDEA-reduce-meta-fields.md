# IDEA: Reduce Meta fields to comply with simplification mandate
**Created:** 2026-04-29
**Source:** THINK Phase 3 (Simplification)
**Status:** PROMOTED → TASK-129
**Meta:** P3 | XS | local | docs/tasks/, docs/agents/

## Problem
The task Meta line currently has 8 fields, exceeding the threshold of 7 defined in the THINK Phase 3 protocol. This increases the context "price" of every task file and complicates automated parsing.

## Proposed solution
Audit the Meta fields and eliminate one redundant field. Candidates for removal:
1. **Value (5)**: Currently all tasks have value 5. If value is not being used for prioritization beyond what Priority (P0-P3) provides, it can be removed.
2. **Category (7-operations)**: If this information is redundant with the Scope or Title, it could be merged or removed.
3. **CLI (local)**: If most tasks are handled by the same CLI tool, this could be moved to a default in `arch.config.json`.

Target: 7 fields.

## Dependencies
None

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
PROMOTE → TASK-129. Value field is redundant since Priority (P0-P3) covers the same need. Reducing to 7 fields as per simplification mandate.
