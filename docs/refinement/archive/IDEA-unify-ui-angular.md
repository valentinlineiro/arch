# IDEA: Unify all tools into a single Angular project
**Created:** 2026-04-27
**Source:** Human request — improve maintainability and component reuse across HTML tools
**Status:** PROMOTED → TASK-097, TASK-098, TASK-099, TASK-100, TASK-101
**Meta:** P3 | L | human | docs/*.html, ui/

## Problem
Four single-file HTML tools (`arch-assistant.html`, `arch-initializr.html`, `arch-viewer.html`, `ONBOARDING.html`) share navigation, dark-mode CSS, and GitHub API integration with no reuse. Changes must be made in every file.

## Proposed solution
Migrate all tools into a single Angular project under `ui/`, served via GitHub Pages. Use Angular Router for navigation between sections and a shared GitHub API service.

## Dependencies
None.

## Estimated size
L (must be decomposed before execution)

## Gaps
- Angular is a heavy framework for what are currently simple HTML files — trade-off vs. lighter alternatives (Vite + vanilla, Astro) not analyzed.
- GitHub Pages deployment with an Angular build step adds CI complexity; conflicts with current static-file approach.
- `ui/` directory vs. replacing `docs/` flat files — deployment strategy decision needed first.
- Legacy support: keep single-file fallbacks or cut them? No decision.
- L size requires decomposition into sub-tasks before promotion.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
