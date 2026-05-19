## TASK-947: Bug: getById reads all 340 tasks+archive files to find a task with a known ID
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts
**Turns:** 1
**Closed-at:** 2026-05-19T10:50:32.827Z
**Locked-commit:** 76db2c9b
**Actor:** unknown
**Created-at:** 2026-05-18T15:07:15.707Z
**Depends:** none

### Acceptance Criteria
- [ ] `getById(id)` reads only `docs/tasks/${id}.md` then `docs/archive/${id}.md` — no full scan
  - `file: cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts`
- [ ] `getNextId()` uses filename-only scan (no file content read) to find max ID
  - `file: cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts`
- [ ] `npm test` passes
  - `cmd: npm test --prefix cli; exit: 0`
- [ ] `arch review` passes
  - `cmd: arch review; exit: 0`

### Context

**Bug:** `getById` calls `getAll()` which reads and parses every file in `docs/tasks/` and `docs/archive/`. With 340+ files, any command that looks up a specific task (`arch task done`, `arch task start`, `arch task capture`) reads 340 files when it needs at most 2. Same problem in `getNextId()` — reads full content of all tasks to extract the max ID from filenames.

**Root cause** (`markdown-task-repository.ts:11-13`):
```ts
async getById(id: string): Promise<Task | null> {
  const tasks = await this.getAll(); // reads 340 files
  return tasks.find(t => t.id === id) || null;
}
```

**Fix:** Try `docs/tasks/${id}.md` directly, fall back to `docs/archive/${id}.md`. For `getNextId()`: `readdir` both dirs, filter `TASK-\d+.md` by filename only, no content read.


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- docs/tasks/TASK-947.md _(utility)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
getById full-scan: reading all 340 archive+tasks files to find a task by known ID — should do direct path lookup docs/tasks/TASK-XXX.md then docs/archive/TASK-XXX.md

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes