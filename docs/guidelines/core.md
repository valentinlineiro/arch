## CORE
<!-- Always loaded. Max 200 tokens. -->

### 1. Communication
- **English-first:** All documentation, task titles, and commit messages must be in English.
- **Evidence Required:** Every proposal must citing the signal or feedback in a `Source:` field.

### 2. Git & Commits
- **Conventional Commits:** Use authoritative prefixes (feat, fix, chore, docs, refactor, idea). Every commit must reference a TASK-ID (except `idea:` drafts). System-mode commits tagged `[THINK]` or `[GOVERN]` are exempt — the tag substitutes for the TASK-ID requirement.
- **No-Merge Policy:** ARCH enforces a clean, linear history. Merge commits (2+ parents) and history-changing ops (`pull`, `merge`, `rebase`) are **FORBIDDEN** without explicit human approval. Use `git fetch`.
- **Atomicity:** One task per commit where possible. **Definition of operation:** an *operation* is one status transition — a task moving from READY→IN_PROGRESS, IN_PROGRESS→DONE, or a single governance action (focus assignment, sprint close). One commit = one operation. Multiple task closes in a single commit are acceptable only during batch governance ticks; they must all be referenced in the commit message.
- **Hygiene:** Every new code directory must include a `.gitignore`.
- **Git Hooks:** `arch init` installs git hooks (commit-msg, pre-commit, pre-push) in `.githooks/`. Run `arch init` to install, or manually execute `git config core.hooksPath .githooks`.

### 3. Authority & Governance (The "Never" List)
- **No Direct Guideline Edits:** Propose changes to `docs/guidelines/` via `idea:` (refinement) or THINK mode.
- **No Unauthorized Promotion:** Promotion from IDEA → BACKLOG requires explicit human approval.
- **No Unauthorized Merging:** Agents cannot merge PRs (Exception: L3 Autonomy).
- **Scope Stability:** If a task's implementation model changes fundamentally, return to `READY` unless human authorizes continuation.

### 4. Task Lifecycle
- **Definition of Ready:** Tasks must meet `docs/TASK-FORMAT.md` criteria before entering `READY`.
- **Validation Gate:** Run `arch review` before any move to `REVIEW` or `DONE`. Zero violations permitted.
- **Execution Priority:** Within priority levels (P0-P3), smaller sizes win (XS → S → M → L).
- **Decomposition:** XL tasks must be decomposed before `READY`.

### 5. Backlog Health
- **Autonomous Replenishment:** Propose an IDEA when READY tasks < 3 (THINK Phase 1).
- **Metrics:** `Closed-at: <ISO 8601>` is required for DONE tasks.
- **Decision Integrity:** When promoting an IDEA, cross-check the `Decision: PROMOTE → TASK-XXX` field — the task title must plausibly match the IDEA intent. Flag unmatched pairs as a Data Integrity Alert in INBOX.
