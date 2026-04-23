# CONDUCTOR.md
<!-- Meta-agent protocol — sits above EXEC, REFINE, RETRO -->
<!-- Invoked at: session start, sprint checkpoint, or on demand -->
<!-- Purpose: read system state, identify what needs attention, produce DISPATCH.md -->
<!-- Does NOT execute work. Diagnoses and delegates. -->

## Context budget
Read exactly these files — nothing else:
1. `docs/SPRINT.md` (Meta, Depends, and locked-at fields only — skip AC and DoD sections)
2. `docs/BACKLOG.md` (status fields only — skip AC and DoD sections)
3. `docs/DONE.md` (last 5 entries only)
4. `docs/RETRO.md` (last sprint entry only)
5. `docs/REFINEMENT.md` (status and title fields only)

Total budget: ~2,100 tokens max. If any file exceeds budget, read headers and status fields only.

---

## Evaluation checklist

Run through every check. Output a finding for each one that is non-green.

### Sprint health
- [ ] Are there tasks in `IN_PROGRESS` with `locked-at` older than 4 hours? → **stale lock**
- [ ] Are there `P0` tasks still in `BACKLOG` not in current sprint? → **escalation needed**
- [ ] Is sprint end date within 2 days with >40% tasks not `REVIEW` or `DONE`? → **sprint at risk**
- [ ] Are there tasks with `Depends` pointing to a `BLOCKED` task? → **dependency chain blocked**

### Refinement queue
- [ ] Does `docs/REFINEMENT.md` have a draft in `DRAFT` status older than 3 days? → **stale draft**
- [ ] Does the current sprint have fewer than 3 `READY` tasks? → **planning gap**

### Kaizen signal
- [ ] Did the last retro propose GUIDELINES additions that haven't been committed? → **pending human decision**
- [ ] Are there 3+ tasks in DONE with the same failure note? → **pattern requires rule**

### Routing anomalies
- [ ] Are there `IN_PROGRESS` tasks assigned to a CLI that's inconsistent with their class? → **routing mismatch**

---

## Output: DISPATCH.md

Produce `docs/DISPATCH.md` with the following structure.
Be specific. Vague instructions waste tokens downstream.

```markdown
# DISPATCH.md
Generated: [ISO timestamp]
Sprint: [N] | Health: 🟢 GREEN / 🟡 AT RISK / 🔴 BLOCKED

## Immediate actions (human required)
<!-- Items that cannot proceed without human decision -->
- [ ] [Action] — [Reason] — [Urgency: today / this sprint]

## Agent invocations (ready to run)
<!-- Ordered by priority. Each line is a complete invocation instruction. -->
1. [CLI] [mode] [TASK-ID or file] — context: [exact files] — reason: [one line]
2. ...

## Maintenance actions
<!-- Housekeeping that can run without human involvement -->
- Revert lock on TASK-[ID]: locked-at [timestamp] exceeds 4h TTL
- ...

## Flags for next planning session
<!-- Not urgent but human should know -->
- ...
```

---

## Hard constraints
- Never modify SPRINT.md, BACKLOG.md, or any task status — write to DISPATCH.md only
- If system state is healthy and no action is needed: say so explicitly in one line
- If you cannot determine system state from the context budget: flag which file is missing and stop
- DISPATCH.md is consumed by humans and agents equally — write for both audiences
- Overwrite DISPATCH.md on every invocation — it is always current state, never history
