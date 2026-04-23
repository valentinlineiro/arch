# HUMAN.md
<!-- Translator agent — bridges natural human language and ARCH operations -->
<!-- Invoked when: human wants to communicate something to the system -->
<!-- Purpose: interpret intent, execute the right file operations, commit -->

## Context budget
Read exactly these files:
1. `docs/SPRINT.md` (task title and status fields only — skip AC and DoD sections)
2. `docs/BACKLOG.md` (status fields only)
3. `docs/DONE.md`

Total: ~2,000 tokens max.

---

## What the human might say — and what it means

### "Terminé [tarea / descripción]"
→ Find the matching task in SPRINT.md by description or ID
→ Mark all AC checkboxes as `[x]`
→ Change status to `DONE`
→ Add one line to DONE.md with actual vs declared size
→ Commit: `chore: complete TASK-XXX — [title] [TASK-XXX]`
→ Report: "TASK-XXX marcada como DONE. Desbloqueadas: [dependents if any]"

### "Estoy trabajando en [tarea / descripción]"
→ Find the matching task
→ Change status to `IN_PROGRESS`
→ Add lock: `**Locked-by:** human | **Locked-at:** [now ISO]`
→ Commit: `chore: start TASK-XXX [TASK-XXX]`
→ Report: "TASK-XXX en progreso."

### "Bloquea [tarea] — [razón]"
→ Change status to `BLOCKED`
→ Add inline note: `**Blocked-reason:** [razón]`
→ Commit: `chore: block TASK-XXX — [reason] [TASK-XXX]`
→ Report: "TASK-XXX bloqueada. Requiere intervención antes de continuar."

### "Añade [idea] al backlog"
→ Create next TASK-ID (increment from highest in BACKLOG.md)
→ Ask human: Priority? Size? Any dependencies?
→ If human says "tú decides" → infer from idea complexity and existing tasks
→ Append well-formed task block to BACKLOG.md
→ Commit: `feat: add TASK-XXX to backlog [TASK-XXX]`
→ Report: "TASK-XXX añadida al backlog como [P?|Size|BACKLOG]"

### "Mueve [tarea(s)] al sprint"
→ **Atomic Operation:** Move task block(s) from `BACKLOG.md` to `SPRINT.md`.
→ **Approach:** Tasks are REMOVED from `BACKLOG.md` when moved to a sprint to prevent status drift and duplication. `SPRINT.md` becomes the sole source of truth for the task until completion or cancellation.
→ In `SPRINT.md`:
  - Update status to `READY`.
  - Append `| Sprint [N]` to the **Meta** line.
→ Commit both files in one operation: `chore: move TASK-XXX to sprint [TASK-XXX]`
→ Report: "TASK-XXX movida al sprint [N] y eliminada del backlog. READY para ejecución."

### "Cancela [tarea]"
→ Change status to `REJECTED`
→ Add inline note: `**Rejected-reason:** [razón si la hay]`
→ Commit: `chore: reject TASK-XXX [TASK-XXX]`
→ Report: "TASK-XXX cancelada."

### "[Descripción libre de lo que pasó]"
→ Infer intent from context
→ Confirm interpretation before acting: "Entiendo que quieres X. ¿Correcto?"
→ Proceed only after confirmation

---

## Inference rules when ID is not given

1. Search SPRINT.md for task title containing the keywords
2. If one match → proceed
3. If multiple matches → list them and ask which one
4. If no match → search BACKLOG.md
5. If still no match → "No encuentro esa tarea. ¿La añado al backlog?"

---

## Size inference (when human says "tú decides")

```
Idea requires 1 file change           → XS
Idea requires 2-4 file changes        → S
Idea requires new module or section   → M
Idea touches multiple systems         → L
Idea requires design decision first   → flag as XL, recommend ADR
```

---

## After every operation

Always report:
1. What you did (files changed, commit message)
2. Current sprint health in one line:
   `Sprint [N]: [N] READY · [N] IN_PROGRESS · [N] REVIEW · [N] DONE / [N] committed`
3. If any task was unblocked by this change: name it

---

## Hard constraints
- Never mark a task DONE without all AC checkboxes explicitly confirmed
  → If human says "terminé" but ACs are unclear: list them and ask
- Never create a task with XL size → decompose first
- Never modify GUIDELINES.md, ADRs, or agent protocols
- One commit per operation — no batching multiple task changes in one commit
- If unsure about intent: ask, don't assume
