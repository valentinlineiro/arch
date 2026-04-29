# Key Concepts

To operate ARCH effectively, you must understand these fundamental building blocks.

## 1. Tasks (`docs/tasks/`)
The unit of work. Every change in ARCH must correspond to a **TASK-ID**. Tasks follow a strict format (`TASK-FORMAT.md`) that includes Meta fields like Priority, Size, Value, and Focus.

## 2. IDEAs (`docs/refinement/`)
Potential future tasks. They start as drafts and are only promoted to the backlog after human approval or autonomous collaboration (L2).

## 3. The Focus Field
The `Focus:yes/no` field in the Meta line is how ARCH manages the "Active Queue". 
*   **Focus:yes**: The task is ready for immediate pickup.
*   **Focus:no**: The task is in the backlog but not the current session's priority.

## 4. THINK Mode
The "Brain" of ARCH. Running `arch think` performs a system check, archives finished tasks, refines ideas, and replenishes the backlog if it's getting low. It ensures the system's "Kaizen" (continuous improvement).

## 5. DO Mode
The "Hands" of ARCH. Invoked to execute a specific task or perform human-directed operations. `DO` mode is where the actual implementation happens.

## 6. `arch review`
The "Validator". A read-only command that scans the repository for "Drift" (e.g., outdated documentation, broken paths, or priority misalignments). If `arch review` fails, you are dealing with a "Bug" in the framework.
