# IDEA: Decouple CLI from Repository Protocol
<!-- **Decision-required:** yes -->
<!-- **Session-count:** 1 -->

## Problem
The ARCH CLI is currently "repo-aware" rather than "protocol-aware." Many of its core governance rules, file paths (e.g., `docs/tasks/`), and validation logic are hardcoded to the specific directory structure and file set of this repository. This prevents ARCH from being a portable, standalone tool that can be easily initialized into any project.

## Proposed Solution
Refactor the CLI to operate against a configurable **Protocol Schema**.
1.  **Configurable Paths:** Move hardcoded paths (tasks, archive, inbox, ledger) into `arch.config.json`.
2.  **Protocol Rules Engine:** Abstract `arch review` checks into a plugin or registry model where rules can be enabled/disabled via config.
3.  **Bootstrap Path:** Implement `arch init` to generate a minimal protocol compliant with the schema.
4.  **Distribution:** Ensure the `@valentinlineiro/arch` npm package can run without requiring a full clone of the ARCH framework repo.

## Expected Value
- **Portability:** Use ARCH governance in any repository.
- **Onboarding UX:** Enable "value in 2 minutes" via `arch init`.
- **Productization:** Foundation for ARCH-as-a-Service and enterprise integrations.

## Governance Class
**Class:** II
**Evaluates:** Architectural portability and decoupling effectiveness.
**Boundary risk:** If the decoupling is done poorly, the CLI may still implicitly require certain ARCH-specific prose or files, leading to "ghost dependencies" that break for external users.

## Decision
**PROMOTE → ROADMAP**
**Source:** ARCH Value Report (2026-05-22)
