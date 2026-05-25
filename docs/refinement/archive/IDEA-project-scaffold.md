# IDEA: project-scaffold — arch project init decomposes a spec into ADRs + task graph
**Created:** 2026-05-24
**Source:** Strategic — enable autonomous project bootstrapping from high-level spec
**Status:** PROMOTED
**Meta:** P1 | L | human | cli/src/main/ts/application/commands/project-command.ts

## Problem

`arch init` scaffolds the governance layer — it does not scaffold the project. To build something new with ARCH, a human must manually write the first ADR, decompose the spec into tasks, and establish the dependency graph. This bottleneck prevents autonomous project initialization. "Build a restaurant OS" requires a human to first translate that intent into 30–50 tasks with dependencies.

## Proposed Solution

`arch project init "<spec>"` — a new command that:

1. Calls the configured LLM with the spec + a structured decomposition prompt
2. Generates 3–5 founding ADRs (domain model, tech stack, API design, data schema)
3. Generates an initial task graph: 10–20 tasks with explicit `Depends:` edges
4. Writes all files to `docs/adr/` and `docs/tasks/` for human review before execution
5. Produces a `docs/PROJECT.md` with the project goal, scope, and DoD

**Key invariant:** `arch project init` is advisory — it drafts, it does not execute. Human reviews the generated ADRs and task graph before `arch govern` starts archiving them. The LLM proposes; the human ratifies.

## Constraint Axes
- Dependency ordering: Requires stable `arch init` (done) and `arch task new` (done)
- Temporal validity: Valid now — autonomous project init is the next frontier after task execution
- Abstraction layer: New `project` command, no domain model changes
- Observability validity: Output is markdown files — fully inspectable before any execution
- Priority displacement: P1 — this is the gateway to Reading B

## Gaps
- LLM decomposition quality varies. Need a structured prompt format that produces verifiable AC templates, not prose tasks.
- Dependency graph completeness: LLM may miss hidden dependencies (auth before orders). Human review step is mandatory.
- Scope creep: "restaurant OS" could generate 200 tasks. Need a `--depth` flag (default: 2 levels, ~20 tasks).

## Decision
PROMOTE → TASK-1007
