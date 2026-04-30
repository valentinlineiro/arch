## CORE
<!-- Always loaded. Max 200 tokens. -->

### 1. Communication
- **English-first:** All documentation, task titles, and commit messages must be written in English. Non-ASCII characters in task titles are a drift signal. Translate legacy content on edit.
- **Evidence Required:** Every proposal in REFINEMENT.md must include a `Source:` field citing the signal or feedback.

### 2. Git & Commits
- **Conventional Commits:** The following table is the authoritative reference:
  | Prefix | When to use |
  |---|---|
  | `feat:` | New feature, task, or agent capability |
  | `fix:` | Bug fix in protocol, CLI, or config |
  | `chore:` | Status changes, maintenance, or lock updates |
  | `docs:` | Changes to README, ADRs, or guides |
  | `refactor:` | Restructuring without behavior change |
  | `idea:` | Committing a draft IDEA to refinement/ |
- **Safety:** Use `git fetch` to sync. History-changing ops (`pull`, `merge`, `rebase`) are FORBIDDEN without explicit human approval.
- **Atomicity:** Every PR/commit must reference a TASK-ID. Use `git commit --amend` for follow-up fixes on unpushed commits.

### 3. Authority & Governance
- **No Self-Merging:** Agents cannot merge their own PRs (Exception: L3 Autonomy in `autonomy.md`).
- **Breaking Changes:** MAJOR changes require an ADR before implementation.

### 4. Task Lifecycle
- **Decomposition:** Tasks estimated XL must be decomposed before entering READY status.
- **Execution Priority:** Within the same priority level (P0-P3), smaller sizes win (XS → S → M → L).

### 5. Backlog Health
- **Autonomous Replenishment:** Propose at least one new IDEA when READY tasks < 3 (THINK Phase 1).
- **Metrics:** `Closed-at: <ISO 8601>` is required when archiving as DONE for cycle-time tracking.

### 6. Implementation
- **Technical Ops:** Rules regarding `npm install` and `npm run build` are relocated to `DEVELOPMENT.md`.
- **Autonomy Pilot:** Details on Level 2 self-promotion are maintained in `docs/guidelines/autonomy.md`.
