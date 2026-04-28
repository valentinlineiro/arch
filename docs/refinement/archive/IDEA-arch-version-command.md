# IDEA: Implement `arch --version` command
**Created:** 2026-04-28
**Source:** KAIZEN-LOG.md
**Status:** PROMOTED → TASK-072
**Meta:** P3 | XS | cli | src/main/ts/index.ts

## Problem
The `arch review` command compares versions by reading `package.json` directly because the CLI does not implement a standard `--version` or `version` subcommand. This is inconsistent with standard CLI conventions.

## Proposed solution
Implement a `version` command and `--version` / `-v` flag support in the CLI that prints the current version from `package.json`.

## Dependencies
None

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
