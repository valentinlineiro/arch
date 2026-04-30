# Walkthrough Example: From Idea to Done

Let's follow a concrete example of how ARCH operates.

## Step 1: The IDEA
A human wants to add a "Dark Mode" to the system dashboard. They run:
`arch do "idea: add dark mode toggle to viewer"`

**Result:** A new file `docs/refinement/IDEA-dark-mode-toggle.md` is created as a DRAFT.

## Step 2: Refinement
The human (or a THINK-mode agent) fills in the details:
*   **Size:** S
*   **Acceptance Criteria:** CSS variables added, toggle button in header.

## Step 3: Promotion
The human decides to proceed and writes `PROMOTE -> TASK-128` in the Decision section. The agent (or human) moves the file to `docs/tasks/TASK-128.md` and updates the Meta line to `Status: READY`.

## Step 4: Execution (DO)
The agent runs `arch next`, identifies `TASK-128` as the priority, and sets it to `Focus:yes | Status: IN_PROGRESS`. It then implements the CSS changes.

## Step 5: Verification
The agent runs `arch review` and all tests. Once green, it sets the status to `DONE` and adds a `Closed-at` timestamp.

## Step 6: Archival
During the next `arch think` run, the system detects `TASK-128` is `DONE` and automatically moves it to `docs/archive/TASK-128.md`, committing the change.
