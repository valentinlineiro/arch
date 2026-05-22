## CORE
<!-- Always loaded. Max 200 tokens. -->

### 1. Communication
- **English-first:** All documentation, task titles, and commit messages must be in English.
- **Evidence Required:** Every proposal must citing the signal or feedback in a `Source:` field.

### 2. Git & Commits
- **Conventional Commits:** Use authoritative prefixes (feat, fix, chore, docs, refactor, idea). Every commit must reference a TASK-ID (except `idea:` drafts).
- **No-Merge Policy:** ARCH enforces a clean, linear history. Merge commits (2+ parents) and history-changing ops (`pull`, `merge`, `rebase`) are **FORBIDDEN** without explicit human approval. Use `git fetch`.
- **Atomicity:** One task per commit where possible.
- **Hygiene:** Every new code directory must include a `.gitignore`.

### 3. Authority & Governance (The "Never" List)
- **No Direct Guideline Edits:** Propose changes to `docs/guidelines/` via `idea:` (refinement) or THINK mode.
- **No Unauthorized Promotion:** Promotion from IDEA → BACKLOG requires explicit human approval.
- **No Unauthorized Merging:** Agents cannot merge PRs (Exception: L3 Autonomy).
- **Scope Stability:** If a task's implementation model changes fundamentally, return to `READY` unless human authorizes continuation.

### 4. Task Lifecycle
- **Definition of Ready:** Tasks must meet `docs/TASK-FORMAT.md` criteria before entering `READY`.
- **Validation Gate:** Run `arch check` before any move to `REVIEW` or `DONE`. Zero violations permitted.
- **Execution Priority:** Within priority levels (P0-P3), smaller sizes win (XS → S → M → L).
- **Decomposition:** XL tasks must be decomposed before `READY`.

### 5. Backlog Health
- **Autonomous Replenishment:** Propose an IDEA when READY tasks < 3 (THINK Phase 1).
- **Metrics:** `Closed-at: <ISO 8601>` is required for DONE tasks.
