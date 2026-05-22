# IDEA: arch init UX — 2-minute project bootstrap
<!-- **Decision-required:** yes -->
<!-- **Session-count:** 1 -->

## Problem
Onboarding to ARCH currently requires reading over 50 markdown files and understanding a complex governance corpus. This "wall of text" prevents rapid adoption by teams who just want deterministic task enforcement.

## Proposed Solution
Implement a streamlined `arch init` command.
1.  **Starter Corpus:** Generate exactly 3 files:
    - `ARCH.md`: A 1-page combined executive protocol.
    - `TASK-FORMAT.md`: The canonical task structure.
    - `INBOX.md`: For human escalations.
2.  **Guided First Task:** Create a `READY` task (e.g., `TASK-001: My first ARCH task`) that walks the user through the `arch task start` -> `arch review` -> `arch task done` loop.
3.  **Zero-Config Review:** Pre-configure `arch review` with a baseline of structural checks that work out-of-the-box.

## Expected Value
- **Immediate Value:** Under 2 minutes from `npm install` to first governed task.
- **Low Cognitive Load:** Protocol is learned incrementally, not upfront.

## Governance Class
**Class:** II
**Evaluates:** Onboarding effectiveness and protocol simplification.
**Boundary risk:** A too-minimal starter protocol might fail to establish the necessary constitutional boundaries (e.g., human ownership of novelty), leading to unintentional authority leakage early in a project's life.

## Decision
**PROMOTE → ROADMAP**
**Source:** ARCH Value Report (2026-05-22)
