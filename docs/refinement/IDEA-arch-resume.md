# IDEA: arch resume — self-healing for common halts
<!-- **Decision-required:** yes -->
<!-- **Session-count:** 1 -->

## Problem
The "Andon Cord" (ANDON_HALT) is essential for safety but currently creates a high-friction manual recovery process. Humans must find the record in `INBOX.md`, resolve the underlying issue, and then manually update the task state or rerun complex commands.

## Proposed Solution
Implement `arch resume <taskId>` to automate common recovery paths.
1.  **Guided Resolution:** The command analyzes why the task was halted (e.g., Budget Exceeded, Review Failure) and presents specific resolution options.
2.  **Deterministic Healing:**
    - If Budget Exceeded: Prompt human for budget extension -> Update metadata -> Move back to `IN_PROGRESS`.
    - If Review Failure: Prompt human to confirm fixes -> Rerun `arch review` -> Move back to `IN_PROGRESS`.
3.  **Audit Trail:** Log the `arch resume` event as a `FOCUS_RECOVERED` ruling in the ledger to maintain traceability.

## Expected Value
- **Usability:** Lower the "metabolic cost" of failure, encouraging agents to halt safely rather than attempting fragile workarounds.
- **Traceability:** Formalize the recovery path in the system logs.

## Governance Class
**Class:** II
**Evaluates:** Recovery safety and operational efficiency.
**Boundary risk:** `arch resume` could become a "blind override" button if it doesn't require explicit human input for the resolution reason, effectively ratifying a failure without addressing the root cause.

## Decision
**PROMOTE → ROADMAP**
**Source:** ARCH Value Report (2026-05-22)
