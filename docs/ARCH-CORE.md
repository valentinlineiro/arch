# ARCH-CORE
<!-- Minimal execution contract — v0.6.0 -->
<!-- Load this file for execution-only sessions. For governance, kaizen, and protocol evolution, load docs/agents/DO.md + docs/agents/THINK.md instead. -->

## You are an executor. Your job is to close one task.

---

## Step 1 — Verify system integrity

```
arch check
```

Read-only. Always safe. If it fails, stop and write the failure reason to `docs/INBOX.md` as:

```
## [ANDON_HALT] TASK-XXX
Reason: arch check failed — <paste output>
```

Do not proceed until `arch check` passes.

---

## Step 2 — Get your task

```
arch task next
```

This returns the task with `Focus:yes`. Read the task file at `docs/tasks/TASK-XXX.md`.

If no task has `Focus:yes`, halt:

```
## [ANDON_HALT] NO_FOCUS
Reason: No task has Focus:yes. Run arch govern to assign focus.
```

---

## Step 3 — Set status and commit before touching any implementation file

In the task file, change `READY` to `IN_PROGRESS` in the Meta line. Commit:

```
git add docs/tasks/TASK-XXX.md
git commit -m "chore: [TASK-XXX] mark IN_PROGRESS"
```

**This commit must happen before any implementation file is modified.**

---

## Step 4 — Implement against Acceptance Criteria only

Read the `### Acceptance Criteria` section. Implement each AC in order.

Rules:
- No scope additions. Only what the ACs specify.
- If an AC has a `cmd:` predicate, run it and verify it passes.
- If an AC has a `file:` predicate, verify the file exists and contains the expected change.
- If any predicate fails, halt immediately (see Halt section below).

---

## Step 5 — Write Hansei, run review, stop at REVIEW

When all ACs are complete:

1. Fill in the `## Hansei` section at the bottom of the task file:
   - `**Severity:**` — H0 (no issue) / H1 (minor deviation) / H2 (pattern to track) / H3a (reject and rework) / H3b (systemic risk)
   - `**Category:**` — one of: `[no-issue]`, `[ScopeCreep]`, `[SpecDrift]`, `[AuditGap]`, `[ToolFailure]`
   - `**Decision:**` — one sentence describing what happened
   - `**Constraint:**` — any limitation encountered (write "None." if none)
   - `**Cost:**` — any cost or debt introduced (write "None." if none)
   - `**Forward Action:**` — what should happen next (write "None required." if none)

2. Change `IN_PROGRESS` to `REVIEW` in the Meta line.

3. Append to `docs/INBOX.md`:
   ```
   ## [REVIEW_REQUEST] TASK-XXX
   ACs: <list each AC title>
   Changed files: <list files modified>
   ```

4. Commit everything. Stop.

---

## Halt conditions — stop immediately if any of these occur

- `arch check` fails 3 consecutive times on the same task
- You modify a file in `docs/adr/`, `arch.config.json`, or any path listed in `governance.protectedPaths` without a prior ADR
- The task requires a decision you cannot make from the ACs alone
- Turn count exceeds the Muri threshold for the task size (XS: 5, S: 15, M: 40, L: 100)

On halt, write to `docs/INBOX.md`:

```
## [ANDON_HALT] TASK-XXX
Reason: <one sentence>
```

Commit and stop. Do not attempt recovery.

---

## What you must NOT do in Core mode

- Create tasks, promote IDEAs, or modify the refinement queue
- Run `arch analyze` or `arch govern`
- Modify `docs/guidelines/` directly
- Archive your own task (an Auditor session does that)
- Select a different task than the one with `Focus:yes`
