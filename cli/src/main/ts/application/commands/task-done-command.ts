/**
 * TaskDoneCommand — guided close path for arch task done TASK-XXX
 *
 * This file documents the entry point for the guided close path.
 * The implementation lives in task-command.ts (subCommand === 'done').
 *
 * Guided close path flow:
 * 1. Run DeterministicACVerifier — show ✔/✖ per AC with detail on failures
 * 2. If any AC fails: print summary, exit non-zero, no state mutation
 * 3. If all ACs pass: call markDone.execute() — sets DONE, writes Closed-at,
 *    archives task, commits
 * 4. For M+ tasks: markDone triggers HanseiWizard if no Hansei block present
 *
 * The --force flag bypasses AC verification for emergency closes.
 */
export const TASK_DONE_ENTRY = 'task-command.ts#subCommand=done';
