# What is ARCH?

ARCH is a **Task-Oriented Framework for Human-AI Collaboration**. It transforms a Git repository into an operating system for engineering teams, where both humans and AI agents follow a strict, shared protocol to deliver software.

## Core Idea: The Repository is the OS

In ARCH, the repository is not just a place for code; it's the environment where management, strategy, and implementation happen. 

*   **Routing:** Every task is routed to the most efficient "CLI" (e.g., `local` for humans/simple scripts, `claude` or `gemini` for complex reasoning).
*   **Agents:** Specialized modes of thinking (`THINK`) and doing (`DO`) that ensure the system remains healthy and moving forward.
*   **Autonomy Levels:** A clear delegation of authority, from "Assisted" (human-led) to "Collaborative" (agent-led for low-risk tasks).

## The ARCH Lifecycle

1.  **IDEA:** A raw thought or proposal. Lives in `docs/refinement/`.
2.  **REFINEMENT:** The process of sizing, valuing, and detailing an IDEA.
3.  **TASK:** A refined IDEA promoted to the backlog. Lives in `docs/tasks/`.
4.  **EXECUTION:** A focused agent (or human) picks a task and implements it.
5.  **ARCHIVE:** Completed tasks are moved to `docs/archive/` for historical context and metrics.

## Why ARCH?

*   **Context Efficiency:** Agents ingest only the context they need to perform specific tasks.
*   **Drift Prevention:** Continuous automated review (`arch review`) ensures documentation and implementation never diverge.
*   **Predictability:** Atomic operations and a shared "Task Format" make collaboration seamless.
