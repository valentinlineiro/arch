# IDEA: Avoid arch command collision
**Created:** 2026-04-27
**Source:** Protocol review finding
**Status:** DRAFT
**Meta:** P0 | S | local | AGENTS.md, docs/, scripts/, README.md

## Problema
The onboarding protocol tells agents to run `arch review`, but on many systems `arch` resolves to GNU coreutils instead of the ARCH CLI. This makes the first verification step unreliable and creates a false impression that the documented command is broken.

## Solución propuesta
Define a collision-safe invocation strategy for onboarding and docs. Options include standardizing on `./scripts/arch.sh review` inside the repo, documenting the required install path for the CLI binary, or renaming/wrapping the command to avoid the global `arch` conflict. Then align AGENTS, onboarding docs, and examples to that decision.

## Dependencias
None. May inform README and onboarding updates if the command contract changes.

## Tamaño estimado
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
