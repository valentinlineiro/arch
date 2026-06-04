# AGENTS.md
<!-- ARCH Framework v1.3.0 | Universal Entry Point -->

## Onboarding

### Choose your entry point

| Session type | What to load | When to use |
|---|---|---|
| **Core** (execution only) | `AGENTS.md` (Execution Session section) | Weak models, local LLMs, boilerplate tasks, any session where governance prose is unnecessary overhead |
| **Governance** (full protocol) | This file + `docs/agents/DO.md` + `docs/agents/THINK.md` | Strong models, kaizen, protocol evolution, complex reasoning tasks |

**If in doubt, load Core.** It is safe, read-only on review, and cannot corrupt system state.

---

### Full governance onboarding (continue below if applicable)

1. Read this file completely before taking any action.
2. Read `arch.config.json` for routing and active sprint state.
3. Read `docs/TASK-FORMAT.md` — the meta line format is authoritative. Violations fail lint on every commit.
4. Read `docs/guidelines/core.md` — commit conventions, git policy, and task lifecycle rules.
5. Read `docs/guidelines/models.md` for model naming conventions.
6. Run `arch review` to verify system integrity. This command is **read-only**.
   - `HanseiPresent` warnings on pre-TASK-195 archived tasks are pre-existing — ignore them.
   - Any new violation your change introduces is blocking. Fix before committing.

---

## System Lifecycle

**Primary intake command:** `arch task capture "<intent>" [--class <class>] [--size <size>]`
Creates a task from a natural language intent, applies class-appropriate AC templates, auto-fixes mechanical Definition of Ready violations, and moves the task to IN_PROGRESS in one step. Use this instead of `arch task create` + manual editing for new sessions.

Example:
```
arch task capture "add JWT authentication middleware" --class 2-code-generation --size S
```

```
IDEA → DRAFT (docs/refinement/) → THINK evaluates → human decides → TASK (docs/tasks/)

TASK: READY → IN_PROGRESS → REVIEW → DONE → archived (docs/archive/)
```

**The implementing agent cannot archive its own task.** A separate Auditor session verifies each AC against the actual repository state, then moves the file to `docs/archive/`.

### Task status transitions

| Status | Location | Agent action |
|--------|----------|--------------|
| `READY` | `docs/tasks/` | Available for selection. Default `Focus:no`; `arch govern` may assign `Focus:yes` to the highest-priority READY task (see ADR-020). |
| `IN_PROGRESS` | `docs/tasks/` | `Focus:yes` (assigned by govern or set before implementation commit). |
| `REVIEW` | `docs/tasks/` | Run predicates, write Hansei, append `REVIEW_REQUEST` to `docs/INBOX.md`, commit, stop. |
| `DONE` | `docs/tasks/` → `docs/archive/` | Auditor sets DONE + `Closed-at`. `arch govern` moves the file. |
| `BLOCKED` | `docs/tasks/` | Halted on missing dependency. |

### Archiving requirements (TASK-195 onward)
Every task archived as DONE must include:
- `## Hansei` section — **required for M/L/XL tasks; optional for XS/S unless a trigger applies.**
  Triggers for XS/S: blocker encountered, actual size exceeded estimate, constitutional or process anomaly.
  **Format:** Structured diagnostic block per ADR-019. Narrative prose is prohibited and fails review.
  Required fields: `**Severity:** [H0|H1|H2|H3a|H3b]`, `**Category:** [controlled vocabulary]`, `**Decision:**`, `**Constraint:**`, `**Cost:**`, `**Forward Action:**`.
  All fields must be ≥10 characters and free of vague phrases ("temporary workaround", "fix later", etc.).
  H2 requires an `IDEA-XXX` link in Forward Action or repetition evidence in Decision.
  H3a tasks cannot be closed — they require rejection and resolution first.
  H3b requires a `TASK/IDEA-XXX` Expiry Resource and `Owner:` in Decision.
- `## Approval` section — **required for M/L/XL tasks** closed via human Auditor review. XS/S tasks are exempt (L3 gate, ADR-009).
- `Closed-at: <ISO 8601>` in the meta line (added by the Auditor at DONE time).

### What `arch govern` does vs. what agents do
- `arch govern` — deterministic enforcement: archives DONE tasks, assigns Focus, checks thresholds. No LLM. Run it; don't replicate its logic.
- `arch analyze` — triggers THINK mode (LLM analysis). Proposals only. Never satisfies a governance gate.
- Agents do not archive their own tasks, select their own next task, or run replenishment. `arch govern` does those.

---

## Modes

### THINK mode
**Invoked by:** `arch analyze` (or as analysis side-effect of `arch govern`).
**Full protocol:** `docs/agents/THINK.md` — read it before running.

Rules most often broken:
- Output is ephemeral (terminal only). THINK never creates tasks directly — only IDEAs and proposals.
- THINK may autonomously **execute** IDEA promotion only when the human has already written a Decision field. THINK never decides to promote.
- For every IDEA surfaced requiring human decision: append one `AWAITING_PROMOTION` record to `.arch/escalations.jsonl` (schema in THINK.md Phase 1). Do not read the file first — always append.
- All weak signal decay emissions due in a session must surface in that session — no cap.

### DO mode
**Invoked by:** human instruction to implement a specific task or perform an operation.
**Full protocol:** `docs/agents/DO.md` — read it before running.

Rules most often broken:
- Set status to `IN_PROGRESS` and commit **before** touching any implementation file.
- Implement against Acceptance Criteria only. No scope additions.
- Stop at REVIEW + `REVIEW_REQUEST`. Do not archive.
- On 3 consecutive `arch review` failures: append `ANDON_HALT` to `docs/INBOX.md` and `.arch/escalations.jsonl`, halt.

---

## Refinement flow
- `idea:` prefix in DO → draft in `docs/refinement/` → THINK evaluates → human promotes → BACKLOG
- Direct task description (no prefix) → BACKLOG directly, no refinement required
- Promoting a draft: the **decision** requires explicit human instruction (human writes `PROMOTE → TASK-XXX` in the IDEA's Decision field). The **execution** of an already-decided promotion follows the L2 autonomy rule — see `docs/guidelines/autonomy.md` (Autonomy Pilot section).

### Decision cost asymmetry

**REJECT** — may be written by any human at any time, one-line rationale. No THINK evaluation required. Rejection reduces future cognitive load and is never a failure.

**EXTEND** — costs more than REJECT. Must state: what specific gap prevents decision now, and what event would trigger adjudication. "Needs more thought" is not valid. EXTEND consumes future attention; REJECT frees it.

**PROMOTE** — commits to execution. Requires prior THINK evaluation unless trivially scoped.

The gradient is intentional: the system biases toward reducing entropy, not toward generating options.

---

## Invariants

These are non-negotiable and not derivable from the codebase alone.

**`docs/INBOX.md` is human-only.**
Agents write to it; humans read it. Automated processes must never read it. For machine-readable escalation state, use `.arch/escalations.jsonl`.

**`.arch/escalations.jsonl` is the structured escalation store.**
Source of truth for ANDON_HALT and AWAITING_PROMOTION events. Append-only: resolution is a new record with `status: "RESOLVED"` — never mutate the original entry.

**Meta line is the source of truth for task state.**
Format: `**Meta:** P[0-3] | [XS|S|M|L|XL] | [STATUS] | Focus:yes/no | [class] | [cli] | [context]`
Session lock fields (`lockedBy`, `lockedAt`) are in-memory only — never written to any file.
`Locked-commit` is a persisted auxiliary provenance field written below the Meta line (not in it); it round-trips through the parser and is used by `deterministic-hansei-checker` as the diff baseline.

**Every commit must reference a TASK-ID and use an authoritative prefix.**
Prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `idea:`
Exception: `idea:` commits for IDEA drafts do not require a TASK-ID.
Merge commits are strictly forbidden — `arch review` will fail.

---

**XS Auditor exception:** XS tasks bypass the Auditor review stage and close directly to DONE when `arch review` passes. This is an explicit exception to the default Auditor invariant — not a bug or shortcut. The Auditor gate exists to catch spec drift on substantive work; XS tasks are bounded enough that `arch review` structural checks are sufficient.

## Hard limits
- Never merge a PR without human approval.
- One commit per operation. No `git pull`, `git merge`, or `git rebase` without explicit human approval — use `git fetch`.
- One task per file in `docs/tasks/`. No inline task lists.
- **Agent may self-archive XS/S tasks when the L3 gate passes:** size XS or S + `DeterministicACVerifier` returns `pass: true` + evidence contains ≥1 `cmd:` or `file:` AC. See ADR-009 and `docs/agents/DO.md` close step for full conditions.

## Bug protocol
Any ARCH misalignment is a bug. See `docs/guidelines/bugs.md` for the full protocol.
