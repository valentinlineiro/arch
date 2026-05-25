# IDEA: arch init PLG onboarding flow
**Created:** 2026-05-25
**Source:** Product strategy discussion
**Status:** DRAFT
**Meta:** P0 | M | local | docs/refinement/

## Problem
The current onboarding is documentation-first: users must read to understand why they need governance before they experience it. This is fatal for acquisition. The already-burned user (primary ICP) has elevated skepticism and will not invest reading time before seeing value. The first interaction must deliver value before explanation — not "read these docs," but "here's what's already wrong in your repo."

## Proposed solution
`arch init` in any repo executes a four-step flow without requiring prior ARCH knowledge:
1. Scans the repo for governance signals (uncommitted changes, missing task refs, untracked AI-generated files)
2. Writes a minimal `.arch/` config with reasonable defaults
3. Runs `arch review` and surfaces findings in plain language
4. Exits with a concrete action item: "3 issues found. Run `arch fix` to resolve them."

The user experiences governance as immediate structure — a tool that found problems they didn't know they had — before encountering any ARCH vocabulary. `arch fix` is a required companion: the loop breaks if the action item has no resolution path. The walkthrough must not require understanding Focus fields, meta lines, or document types.

## Dependencies
- `arch fix` command must exist or the exit action item is a dead end
- IDEA-progressive-cli-surface (surface thinning determines what the user sees next)
- IDEA-enforcement-boundary-demo (the init walkthrough should include the enforcement moment)

## Estimated size
M

## Gaps

## Decision
