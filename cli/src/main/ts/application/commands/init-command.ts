import fs from 'node:fs/promises';
import path from 'node:path';

type Stack = 'node' | 'python' | 'go' | 'rust' | 'java' | 'unknown';

interface DetectedStack {
  type: Stack;
  label: string;
  devCommands: string;
  testCommand: string;
  buildCommand: string;
}

export class InitCommand {
  private rootPath: string;

  constructor(rootPath: string = '.') {
    this.rootPath = path.resolve(rootPath);
  }

  async execute(args: string[]): Promise<void> {
    const force = args.includes('--force');

    console.log('\n  ARCH — initializing framework\n');

    // Guard: already initialized (check canonical file)
    const alreadyExists = await this.exists('docs/AGENTS.md') || await this.exists('AGENTS.md');
    if (alreadyExists && !force) {
      console.log('  Already initialised. Run arch review to check system state.');
      process.exit(0);
    }

    const stack = await this.detectStack();
    console.log(`  Detected stack: ${stack.label}`);
    console.log('');

    await this.scaffold(stack);

    console.log('');
    console.log('  Done. Next steps:');
    console.log('');
    console.log('  1. Review docs/guidelines/core.md  — adjust stack rules if needed');
    console.log('  2. Create docs/tasks/TASK-001.md   — your first task');
    console.log('  3. Run: arch review                — verify system integrity');
    console.log('  4. Run: arch reflect               — THINK populates INBOX');
    console.log('');
  }

  // ── Stack Detection ────────────────────────────────────────────────────────

  private async detectStack(): Promise<DetectedStack> {
    if (await this.exists('package.json')) {
      const raw = await fs.readFile(path.join(this.rootPath, 'package.json'), 'utf-8').catch(() => '{}');
      const pkg = JSON.parse(raw);
      const hasTs = pkg.devDependencies?.typescript || pkg.dependencies?.typescript;
      return {
        type: 'node',
        label: hasTs ? 'Node.js / TypeScript' : 'Node.js / JavaScript',
        devCommands: 'npm install, npm run build',
        testCommand: 'npm test',
        buildCommand: 'npm run build',
      };
    }
    if (await this.exists('pyproject.toml') || await this.exists('requirements.txt') || await this.exists('setup.py')) {
      return {
        type: 'python',
        label: 'Python',
        devCommands: 'pip install -r requirements.txt',
        testCommand: 'pytest',
        buildCommand: 'python -m build',
      };
    }
    if (await this.exists('go.mod')) {
      return {
        type: 'go',
        label: 'Go',
        devCommands: 'go mod download',
        testCommand: 'go test ./...',
        buildCommand: 'go build ./...',
      };
    }
    if (await this.exists('Cargo.toml')) {
      return {
        type: 'rust',
        label: 'Rust',
        devCommands: 'cargo build',
        testCommand: 'cargo test',
        buildCommand: 'cargo build --release',
      };
    }
    if (await this.exists('pom.xml') || await this.exists('build.gradle')) {
      return {
        type: 'java',
        label: 'Java / Kotlin',
        devCommands: 'mvn install / gradle build',
        testCommand: 'mvn test / gradle test',
        buildCommand: 'mvn package / gradle build',
      };
    }
    return {
      type: 'unknown',
      label: 'Unknown (customize docs/guidelines/core.md)',
      devCommands: '# add your setup commands',
      testCommand: '# add your test command',
      buildCommand: '# add your build command',
    };
  }

  // ── Scaffolding ────────────────────────────────────────────────────────────

  private async scaffold(stack: DetectedStack): Promise<void> {
    const dirs = [
      'docs/agents',
      'docs/guidelines',
      'docs/tasks',
      'docs/archive',
      'docs/refinement',
      'docs/refinement/archive',
      'docs/adr',
      'docs/tensions',
      '.arch',
      '.arch/costs',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.rootPath, dir), { recursive: true });
    }

    const files: Array<{ dest: string; content: string }> = [
      { dest: 'docs/AGENTS.md',                          content: this.agentsMd() },
      { dest: 'arch.config.json',                        content: this.archConfig(stack) },
      { dest: 'docs/agents/DO.md',                       content: this.doMd() },
      { dest: 'docs/agents/THINK.md',                    content: this.thinkMd() },
      { dest: 'docs/guidelines/core.md',                 content: this.coreMd(stack) },
      { dest: 'docs/guidelines/autonomy.md',             content: this.autonomyMd() },
      { dest: 'docs/INBOX.md',                           content: this.inboxMd() },
      { dest: 'docs/KAIZEN-LOG.md',                      content: this.kaizenMd() },
      { dest: 'docs/TASK-FORMAT.md',                     content: this.taskFormatMd() },
      { dest: 'docs/adr/ADR-000-template.md',            content: this.adrTemplate() },
      { dest: 'docs/tasks/.gitkeep',                     content: '' },
      { dest: 'docs/archive/.gitkeep',                   content: '' },
      { dest: 'docs/refinement/.gitkeep',                content: '' },
      { dest: 'docs/refinement/archive/.gitkeep',        content: '' },
      { dest: 'docs/tensions/.gitkeep',                  content: '' },
      { dest: 'docs/tasks/TASK-001.md',                  content: this.seedTaskMd() },
    ];

    for (const { dest, content } of files) {
      const fullPath = path.join(this.rootPath, dest);
      if (!await this.exists(dest)) {
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(`  + ${dest}`);
      } else {
        console.log(`  ~ ${dest} (skipped — already exists)`);
      }
    }

    // Symlinks — canonical file is docs/AGENTS.md; root-level names are aliases
    await this.createSymlink('docs/AGENTS.md', 'AGENTS.md');
    await this.createSymlink('docs/AGENTS.md', 'CLAUDE.md');
    await this.createSymlink('docs/AGENTS.md', 'GEMINI.md');

    // .gitignore entry
    await this.appendGitignore();
  }

  private async createSymlink(target: string, link: string): Promise<void> {
    const linkPath = path.join(this.rootPath, link);
    if (!await this.exists(link)) {
      await fs.symlink(target, linkPath);
      console.log(`  → ${link} → ${target}`);
    } else {
      console.log(`  ~ ${link} (skipped — already exists)`);
    }
  }

  private async appendGitignore(): Promise<void> {
    const gitignorePath = path.join(this.rootPath, '.gitignore');
    const entry = '\n# ARCH — local overrides\n.arch-local\n.arch-local.json\n';
    try {
      const existing = await fs.readFile(gitignorePath, 'utf-8');
      if (!existing.includes('# ARCH')) {
        await fs.appendFile(gitignorePath, entry, 'utf-8');
        console.log('  ~ .gitignore (appended ARCH entries)');
      }
    } catch {
      await fs.writeFile(gitignorePath, `# ARCH — local overrides\n.arch-local\n.arch-local.json\n`, 'utf-8');
      console.log('  + .gitignore');
    }
  }

  private async exists(rel: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.rootPath, rel));
      return true;
    } catch {
      return false;
    }
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  private agentsMd(): string {
    return `# AGENTS.md
<!-- ARCH Framework v0.6.0 | Universal Entry Point -->

## Onboarding
1. Read this file completely before taking any action.
2. Read \`arch.config.json\` for routing and active sprint state.
3. Read \`docs/TASK-FORMAT.md\` — the meta line format is authoritative. Violations fail lint on every commit.
4. Read \`docs/guidelines/core.md\` — commit conventions, git policy, and task lifecycle rules.
5. Run \`arch review\` to verify system integrity. This command is **read-only**.

---

## System Lifecycle

\`\`\`
IDEA → DRAFT (docs/refinement/) → THINK evaluates → human decides → TASK (docs/tasks/)

TASK: READY → IN_PROGRESS → REVIEW → DONE → archived (docs/archive/)
\`\`\`

**The implementing agent cannot archive its own task.** A separate Auditor session verifies each AC against the actual repository state, then moves the file to \`docs/archive/\`.

### Task status transitions

| Status | Location | Agent action |
|--------|----------|--------------|
| \`READY\` | \`docs/tasks/\` | Available for selection. \`Focus:no\`. |
| \`IN_PROGRESS\` | \`docs/tasks/\` | Set \`Focus:yes\`, commit **before** any implementation. |
| \`REVIEW\` | \`docs/tasks/\` | Run predicates, write Hansei, append \`REVIEW_REQUEST\` to \`docs/INBOX.md\`, commit, stop. |
| \`DONE\` | \`docs/tasks/\` → \`docs/archive/\` | Auditor sets DONE + \`Closed-at\`. \`arch govern\` moves the file. |
| \`BLOCKED\` | \`docs/tasks/\` | Halted on missing dependency. |

---

## Modes

### THINK mode
**Invoked by:** \`arch reflect\`
**Full protocol:** \`docs/agents/THINK.md\`

- Output is ephemeral (terminal only). THINK never creates tasks directly — only IDEAs and proposals.
- THINK may autonomously execute IDEA promotion only when the human has already written a Decision field.

### DO mode
**Invoked by:** human instruction to implement a specific task or perform an operation.
**Full protocol:** \`docs/agents/DO.md\`

- Set status to \`IN_PROGRESS\` and commit **before** touching any implementation file.
- Implement against Acceptance Criteria only. No scope additions.
- Stop at REVIEW + \`REVIEW_REQUEST\`. Do not archive.

---

## Refinement flow
- \`idea:\` prefix in DO → draft in \`docs/refinement/\` → THINK evaluates → human promotes → TASK
- Promoting a draft: the **decision** requires explicit human instruction (human writes \`PROMOTE → TASK-XXX\` in the IDEA's Decision field). The **execution** of an already-decided promotion follows the L2 autonomy rule — see \`docs/guidelines/autonomy.md\`.

---

## What \`arch govern\` does vs. what agents do
- \`arch govern\` — deterministic enforcement: archives DONE tasks, assigns Focus, checks thresholds. No LLM.
- \`arch reflect\` — triggers THINK mode (LLM analysis). Proposals only. Never satisfies a governance gate.
- Agents do not archive their own tasks, select their own next task, or run replenishment. \`arch govern\` does those.
`;
  }

  private archConfig(stack: DetectedStack): string {
    const testCmd = stack.testCommand;
    const buildCmd = stack.buildCommand;
    return JSON.stringify({
      version: '0.6.0',
      currentSprint: '',
      strategies: {
        '1-code-reasoning': {
          M: [
            { provider: 'claude-code', model: 'sonnet' },
            { provider: 'gemini', model: 'pro' },
          ],
          L: [
            { provider: 'claude-code', model: 'opus' },
            { provider: 'gemini', model: 'pro' },
          ],
        },
        '2-code-generation': {
          M: [
            { provider: 'claude-code', model: 'sonnet' },
            { provider: 'gemini', model: 'flash' },
            { provider: 'ollama', model: 'qwen2.5-coder:7b' },
          ],
        },
        default: {
          XS: [
            { provider: 'ollama', model: 'qwen2.5-coder:1.5b' },
            { provider: 'gemini', model: 'flash' },
          ],
          S: [
            { provider: 'claude-code', model: 'haiku' },
            { provider: 'gemini', model: 'flash' },
          ],
          M: [
            { provider: 'claude-code', model: 'sonnet' },
            { provider: 'gemini', model: 'pro' },
          ],
          L: [
            { provider: 'claude-code', model: 'opus' },
            { provider: 'gemini', model: 'pro' },
          ],
        },
      },
      governance: {
        conductEveryN: 5,
        batchWritingTasks: false,
        execTimeoutMinutes: 10,
        negativeConstraints: [
          'No new dependencies for tasks smaller than M without explicit justification',
          'No modifying protectedPaths without a preceding ADR',
          'No major architectural changes without an approved ADR',
        ],
        protectedPaths: [
          'docs/adr/',
          'arch.config.json',
        ],
        hanseiSinceTaskId: 1,
      },
      muri: {
        XS: { turns: 5, cost: 0.05 },
        S: { turns: 15, cost: 0.15 },
        M: { turns: 40, cost: 0.50 },
        L: { turns: 100, cost: 2.00 },
      },
      paths: {
        tasks: 'docs/tasks',
        archive: 'docs/archive',
        guidelines: 'docs/guidelines',
        agents: 'docs/agents',
        refinement: 'docs/refinement',
        adr: 'docs/adr',
      },
      clis: [
        {
          name: 'claude',
          bin: 'claude',
          template: 'claude -p "{prompt}" --dangerously-skip-permissions',
        },
        {
          name: 'gemini',
          bin: 'gemini',
          template: 'gemini -p "{prompt}" -y',
        },
      ],
      providers: [
        {
          name: 'claude-code',
          type: 'bridge',
          bin: 'claude',
          template: 'claude -p "{prompt}" --dangerously-skip-permissions',
        },
        {
          name: 'gemini',
          type: 'bridge',
          bin: 'gemini',
          template: 'gemini -p "{prompt}" -y',
        },
        {
          name: 'ollama',
          type: 'native',
          endpoint: 'http://127.0.0.1:11434/v1',
          apiKey: 'ollama',
        },
      ],
      _stackHint: stack.label,
      _testCommand: testCmd,
      _buildCommand: buildCmd,
    }, null, 2);
  }

  private doMd(): string {
    return `# DO.md
<!-- ARCH v0.6.0 — Execution Protocol -->

## Intent: Execute Task
1. \`git fetch\` — sync state safely without merging.
2. Find highest priority \`READY\` task in \`docs/tasks/\` using \`arch task next\`.
3. Verify task ACs against \`negativeConstraints\` in \`arch.config.json\`. Halt if violation detected.
4. Set status to \`IN_PROGRESS\`, add lock in Meta line, and commit immediately before touching any implementation file.
5. Implement against Acceptance Criteria ONLY. No scope additions.
6. On completion:
   - Append \`## Hansei\` section with: \`**Severity:**\`, \`**Category:**\`, \`**Decision:**\`, \`**Constraint:**\`, \`**Cost:**\`, \`**Forward Action:**\`
   - Run \`arch task review TASK-XXX\` to execute all \`cmd:\` predicates and set status to REVIEW.
   - Append \`REVIEW_REQUEST\` to \`docs/INBOX.md\` with Task ID, AC list, changed files.
   - Release lock and stop.
7. **Auditor Step:** A fresh session reads \`docs/INBOX.md\`, runs \`arch review\`, verifies each AC. Pass → \`REVIEW_PASS\` + DONE. Fail → \`REVIEW_FAIL\` + back to READY.

## Intent: Operations
- \`idea:\` prefix → create \`docs/refinement/IDEA-[slug].md\` and commit.
- Mark DONE → add \`Closed-at\` timestamp, set status DONE. Auditor moves to archive.

## Andon Cord (halt immediately)
1. \`arch review\` fails 3 consecutive times on the same task.
2. Turn count exceeds Muri threshold for task size.
3. EXEC phase exceeds \`governance.execTimeoutMinutes\`.
4. Implementation requires touching a \`protectedPath\` without a prior ADR.

**On halt:** append \`ANDON_HALT\` to \`docs/INBOX.md\` and exit.
`;
  }

  private thinkMd(): string {
    return `# THINK.md
<!-- ARCH v0.6.0 — Analysis Protocol (Invoked by arch reflect) -->
<!-- Authority: proposals only. Never mutates task state. Never satisfies a governance gate. -->

## Phase 1: Context & Replenishment
0. Print: \`[THINK] Phase 1 — Context & Replenishment\` to stdout.
1. Note: \`arch reflect\` triggered this session. This is the analysis layer — proposals only.
2. **Health Evaluation:** Identify P0 tasks that are blocked or not focused. If a task is \`IN_PROGRESS\` with a lock > 3 days, create a P1 \`READY\` bug task in \`docs/tasks/\`.
3. **Replenishment check:** Count \`READY\` tasks in \`docs/tasks/\`. If count < 3, propose at least one new IDEA in \`docs/refinement/\` before continuing.
4. **INBOX Regeneration:** Overwrite \`docs/INBOX.md\` with current loop status, active/READY task counts, pending items (\`AWAITING_PROMOTION\`, \`AWAITING_REVIEW\`), and summaries of the last 5 completed tasks. Commit with \`[THINK]\` tag.
5. **Evidence Required:** Every recommendation must cite a concrete signal.

## Phase 2: Kaizen
0. Print: \`[THINK] Phase 2 — Kaizen\` to stdout.
1. Review \`docs/KAIZEN-LOG.md\` for unresolved friction.
2. Identify friction patterns: recurring blocks, escalations, oversized tasks.
3. For each pattern, append to \`docs/KAIZEN-LOG.md\`:
   \`\`\`
   ## [YYYY-MM-DD] <title>
   **Friction:** <what slowed down or broke>
   **Root Cause:** <why it happened>
   **Proposed Fix:** <concrete change to protocol or tooling>
   **Status:** OPEN
   \`\`\`
4. Commit with \`[THINK]\` tag.

## Phase 3: Continuous Kaizen
0. Print: \`[THINK] Phase 3 — Continuous Kaizen\` to stdout.
1. Review guidelines in \`docs/guidelines/\` for stale or missing rules.
2. If a guideline change is needed: create \`docs/refinement/IDEA-guideline-[slug].md\` and append \`AWAITING_PROMOTION\` to \`docs/INBOX.md\`.
3. Never modify \`docs/guidelines/\` directly.

## Hard Rules
- THINK never creates task files directly. It creates IDEA files in \`docs/refinement/\`.
- THINK never sets task status. It never archives. It never governs.
- Every proposal requires a source signal (\`Source:\` field in IDEA files).
`;
  }

  private coreMd(stack: DetectedStack): string {
    return `## CORE
<!-- Always loaded. Max 200 tokens. -->

### 1. Communication
- **English-first:** All documentation, task titles, and commit messages must be written in English.
- **Evidence Required:** Every proposal in refinement must include a \`Source:\` field citing the signal or feedback.

### 2. Git & Commits
- **Conventional Commits:** Use authoritative prefixes (\`feat\`, \`fix\`, \`chore\`, \`docs\`, \`refactor\`, \`idea\`). Every commit must reference a TASK-ID.
- **No-Merge Policy:** ARCH enforces a clean, linear git history. Merge commits are FORBIDDEN.
- **Atomicity:** One task per commit where possible.

### 3. Authority & Governance
- **No Self-Merging:** Agents cannot merge their own PRs.
- **Breaking Changes:** MAJOR changes require an ADR before implementation.

### 4. Task Lifecycle
- **Definition of Ready:** Tasks must meet the criteria in \`docs/TASK-FORMAT.md\` before being set to READY.
- **Decomposition:** Tasks estimated XL must be decomposed before entering READY status.
- **Execution Priority:** Within the same priority level, smaller sizes win (XS → S → M → L).

### 5. Backlog Health
- **Autonomous Replenishment:** Propose at least one new IDEA when READY tasks < 3 (THINK Phase 1).
- **Metrics:** \`Closed-at: <ISO 8601>\` is required when archiving as DONE.

### 6. Stack: ${stack.label}
- **Setup:** \`${stack.devCommands}\`
- **Test:** \`${stack.testCommand}\`
- **Build:** \`${stack.buildCommand}\`
`;
  }

  private autonomyMd(): string {
    return `# Autonomy Levels & Delegation of Authority

## Autonomy Levels

| Level | Name | Description | Human Involvement |
|-------|------|-------------|-------------------|
| **L1** | **Assisted** | Agent implements human-defined tasks. Human approves every commit. | High |
| **L2** | **Collaborative** | Agent can promote low-risk XS tasks autonomously. | Medium (Review only) |
| **L3** | **Authorized** | Agent can approve its own PRs for Safe categories if tests pass. | Low (Async Audit) |
| **L4** | **Autonomous** | System self-heals, detects drift, and fixes without intervention. | Zero |

## Autonomy Pilot (Level 2)
Agents are authorized to self-promote IDEAs to TASKs if they are sized **XS** and belong to class \`7-operations\` or \`6-writing\`. This is an **execution** of a human-written Decision — the human must have already written the \`PROMOTE → TASK-XXX\` Decision field.
`;
  }

  private inboxMd(): string {
    const now = new Date().toISOString().slice(0, 10);
    return `# INBOX
<!-- Generated by arch init — ${now} -->
<!-- Agents write here. Humans read and resolve. -->

## System Status
- READY tasks: 0
- IN_PROGRESS tasks: 0
- Pending review: 0
- Pending promotion: 0

## Pending Items
_No pending items. Run \`arch reflect\` to populate._
`;
  }

  private kaizenMd(): string {
    return `# KAIZEN-LOG
<!-- Friction log — protocol, tool, context issues -->
<!-- Format: ## [YYYY-MM-DD] Title | Friction | Root Cause | Proposed Fix | Status -->

_No entries yet. THINK mode populates this during arch reflect._
`;
  }

  private taskFormatMd(): string {
    return `# TASK-FORMAT
<!-- Authoritative task meta line format -->

## Meta Line Format
\`\`\`
**Meta:** <Priority> | <Size> | <Status> | Focus:<yes|no> | <task-class> | <provider> | <paths>
\`\`\`

### Priority
- \`P0\` — Critical / blocking
- \`P1\` — High
- \`P2\` — Normal
- \`P3\` — Low / nice-to-have

### Size
- \`XS\` — < 1 hour
- \`S\` — 1–4 hours
- \`M\` — 1–2 days
- \`L\` — 3–5 days (decompose if XL)

### Status
- \`READY\` — Available for selection
- \`IN_PROGRESS\` — Being implemented (must have lock)
- \`REVIEW\` — Awaiting Auditor
- \`DONE\` — Verified (Auditor only)
- \`BLOCKED\` — Waiting on dependency

### Task Classes
- \`1-code-reasoning\` — Architecture, ADRs, complex debugging
- \`2-code-generation\` — Boilerplate, CRUD, standard endpoints
- \`3-code-context\` — Cross-repo refactors, large context analysis
- \`6-writing\` — Docs, ADRs, proposals
- \`7-operations\` — ETL, pipelines, config
- \`8-strategy\` — Trade-offs, retrospectives

## Full Task Template
\`\`\`markdown
## TASK-XXX: <title>
**Meta:** P1 | M | READY | Focus:no | 1-code-reasoning | claude-code | src/

**Depends:** (none)

### Acceptance Criteria
- [ ] AC 1
  - \`cmd: npm test\`
- [ ] AC 2
  - \`file: src/feature.ts\`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] \`arch review\` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Straightforward implementation, no deviations.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None required.
\`\`\`

## Hansei Severity Levels
- \`H0\` — No issue, happy path
- \`H1\` — Minor deviation, no action needed
- \`H2\` — Pattern worth tracking (link IDEA in Forward Action)
- \`H3a\` — Task must be rejected and reworked before closing
- \`H3b\` — Systemic risk, requires expiry resource and owner
`;
  }

  private adrTemplate(): string {
    return `# ADR-000: <Title>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
<What is the issue or situation that motivated this decision?>

## Decision
<What is the change that we're proposing or have agreed to implement?>

## Consequences
<What becomes easier or more difficult as a result of this change?>

## Alternatives Considered
<What other options were evaluated and why were they rejected?>
`;
  }
  private seedTaskMd(): string {
    const now = new Date().toISOString().slice(0, 10);
    return `## TASK-001: Define first epic
**Meta:** P1 | M | READY | Focus:no | 1-code-reasoning | claude-code | docs/

**Depends:** none

### Context

This is your first ARCH task. Define the first work stream for this project.
Describe the primary goal, expected deliverables, and how you will decompose it into smaller tasks.

### Acceptance Criteria

- [ ] First epic defined — scope and goal written in this task's Context section
  - \`prose: epic description written in ### Context\`

- [ ] Epic decomposed into at least 2 concrete sub-tasks in docs/tasks/
  - \`prose: TASK-002 and TASK-003 (or higher) exist in docs/tasks/\`

- [ ] \`arch review\` passes after sub-tasks are created
  - \`cmd: arch review\`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] \`arch review\` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
`;
  }

}
