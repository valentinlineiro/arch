import { CommandExit, Command } from '../../domain/models/command.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PathResolver } from '../../domain/services/path-resolver.js';

type Stack = 'node' | 'python' | 'go' | 'rust' | 'java' | 'unknown';

interface DetectedStack {
  type: Stack;
  label: string;
  devCommands: string;
  testCommand: string;
  buildCommand: string;
}

export class InitCommand implements Command {
  private rootPath: string;
  private readonly pr = PathResolver.from({});

  constructor(rootPath: string = '.') {
    this.rootPath = path.resolve(rootPath);
  }

  async execute(args: string[]): Promise<number> {
    const dryRun = args.includes('--dry-run');
    if (dryRun) {
      console.log('\n  ARCH — dry-run: no files will be written\n');
      return 0;
    }

    const force = args.includes('--force');
    const minimal = args.includes('--minimal');
    const guided = args.includes('--guided');

    console.log('\n  ARCH — initializing framework' + (minimal ? ' [MINIMAL]' : '') + (guided ? ' [GUIDED]' : '') + '\n');

    // Guided prompts
    let projectName = '';
    let pathsOverride = '';
    let protocolVersion = '';
    if (guided) {
      const rl = await import('node:readline');
      const prompt = (question: string, defaultVal = ''): Promise<string> => {
        const r = rl.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise(resolve => {
          r.question(`  ${question} `, answer => {
            r.close();
            resolve(answer.trim() || defaultVal);
          });
        });
      };
      projectName = await prompt('Project name:', 'arch-project');
      pathsOverride = await prompt('Paths override (comma-separated, e.g. tasks=mytasks):', '');
      protocolVersion = await prompt('Protocol version (1.2.0):', '1.2.0');
      console.log('');
    }

    // Guard: already initialized (check canonical file)
    const canonical = minimal ? 'ARCH.md' : 'docs/AGENTS.md';
    const alreadyExists = await this.exists(canonical) || await this.exists('AGENTS.md');
    if (alreadyExists && !force) {
      console.log(`  Already initialised. Run arch check to check system state.`);
      return 0;
    }

    const stack = await this.detectStack();
    console.log(`  Detected stack: ${stack.label}`);
    console.log('');

    if (minimal) {
      await this.scaffoldMinimal(stack);
    } else {
      await this.scaffold(stack);
    }

    console.log('');
    console.log('  Done. Next steps:');
    console.log('');
    if (minimal) {
      console.log('  1. Review ARCH.md               — your protocol rules');
      console.log(`  2. Create ${this.pr.tasks}/TASK-001.md — your first task`);
      console.log('  3. Run: arch check               — verify system integrity');
    } else {
      console.log('  1. Review docs/guidelines/core.md  — adjust stack rules if needed');
      console.log(`  2. Create ${this.pr.tasks}/TASK-001.md   — your first task`);
      console.log('  3. Run: arch check                — verify system integrity');
      console.log('  4. Run: arch analyze              — THINK populates INBOX');
    }
    console.log('');
    return 0;
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

  private async scaffoldMinimal(stack: DetectedStack): Promise<void> {
    const dirs = [
      this.pr.tasks,
      this.pr.archive,
      this.pr.archDir,
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.rootPath, dir), { recursive: true });
    }

    const pr = this.pr;
    const files: Array<{ dest: string; content: string }> = [
      { dest: 'ARCH.md',                                 content: this.minimalArchMd() },
      { dest: 'arch.config.json',                        content: this.archConfig(stack) },
      { dest: pr.inbox,                                  content: this.inboxMd() },
      { dest: 'docs/TASK-FORMAT.md',                     content: this.taskFormatMd() },
      { dest: `${pr.tasks}/.gitkeep`,                    content: '' },
      { dest: `${pr.archive}/.gitkeep`,                  content: '' },
      { dest: `${pr.tasks}/TASK-001.md`,                 content: this.seedTaskMd() },
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

    await this.appendGitignore();

    // Git hooks
    await this.installGithooks();
  }

  private async scaffold(stack: DetectedStack): Promise<void> {
    const pr = this.pr;
    const dirs = [
      pr.agents,
      pr.guidelines,
      pr.tasks,
      pr.archive,
      pr.refinement,
      pr.refinementArchive,
      pr.adr,
      'docs/tensions',
      pr.archDir,
      `${pr.archDir}/costs`,
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.rootPath, dir), { recursive: true });
    }

    const files: Array<{ dest: string; content: string }> = [
      { dest: 'docs/AGENTS.md',                          content: this.agentsMd() },
      { dest: 'arch.config.json',                        content: this.archConfig(stack) },
      { dest: `${pr.agents}/DO.md`,                      content: this.doMd() },
      { dest: `${pr.agents}/THINK.md`,                   content: this.thinkMd() },
      { dest: `${pr.guidelines}/core.md`,                content: this.coreMd(stack) },
      { dest: `${pr.guidelines}/autonomy.md`,            content: this.autonomyMd() },
      { dest: pr.inbox,                                  content: this.inboxMd() },
      { dest: 'docs/KAIZEN-LOG.md',                      content: this.kaizenMd() },
      { dest: 'docs/TASK-FORMAT.md',                     content: this.taskFormatMd() },
      { dest: `${pr.adr}/ADR-000-template.md`,           content: this.adrTemplate() },
      { dest: `${pr.tasks}/.gitkeep`,                    content: '' },
      { dest: `${pr.archive}/.gitkeep`,                  content: '' },
      { dest: `${pr.refinement}/.gitkeep`,               content: '' },
      { dest: `${pr.refinementArchive}/.gitkeep`,        content: '' },
      { dest: 'docs/tensions/.gitkeep',                  content: '' },
      { dest: `${pr.tasks}/TASK-001.md`,                 content: this.seedTaskMd() },
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

    // Git hooks
    await this.installGithooks();
  }

  private async installGithooks(): Promise<void> {
    const hooksDir = '.githooks';
    if (await this.exists(hooksDir)) {
      console.log(`  ~ ${hooksDir}/ (skipped — already exists)`);
      return;
    }

    await fs.mkdir(path.join(this.rootPath, hooksDir), { recursive: true });

    const hooks: Array<{ name: string; content: string }> = [
      {
        name: 'commit-msg',
        content: `#!/usr/bin/env bash
# ARCH commit-msg hook
# Auto-appends TASK-ID reference to commit messages if missing

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Exemptions
if [[ "$COMMIT_MSG" =~ ^idea: ]] || \\
   [[ "$COMMIT_MSG" =~ ^chore:\\\\ (open|close)\\\\ sprint/ ]] || \\
   [[ "$COMMIT_MSG" =~ \\\\[THINK\\\\] ]]; then
    exit 0
fi

# Check if TASK-ID already present
if [[ "$COMMIT_MSG" =~ \\\\[TASK-[0-9]+\\\\] ]]; then
    exit 0
fi

# Try to extract TASK-ID from branch name
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [[ "$BRANCH_NAME" =~ [Tt][Aa][Ss][Kk]-[0-9]+ ]]; then
    TASK_ID=$(echo "$BRANCH_NAME" | grep -ioE '[Tt][Aa][Ss][Kk]-[0-9]+' | head -1 | tr '[:lower:]' '[:upper:]')
    echo "[$TASK_ID] $COMMIT_MSG" > "$COMMIT_MSG_FILE"
    exit 0
fi

# Warn but don't block
echo "Warning: No TASK-ID found in commit message or branch name."
exit 0
`,
      },
      {
        name: 'pre-commit',
        content: `#!/usr/bin/env bash
# ARCH pre-commit hook
# Runs arch check --scope delta on staged changes

echo "ARCH -- checking staged changes..."
arch check --scope delta
if [ $? -ne 0 ]; then
    echo "Error: Staged changes violate ARCH integrity."
    exit 1
fi
`,
      },
      {
        name: 'pre-push',
        content: `#!/usr/bin/env bash
# ARCH pre-push hook
# Rejects pushes with REVIEW-status tasks in ${this.pr.tasks}/

echo "ARCH -- checking for REVIEW-status tasks..."
REVIEW_TASKS=$(grep -rl "\\\\| REVIEW |" ${this.pr.tasks}/ 2>/dev/null || true)
if [ -n "$REVIEW_TASKS" ]; then
    echo "Error: Push blocked -- REVIEW-status tasks found:"
    echo "$REVIEW_TASKS" | sed 's/^/    - /'
    exit 1
fi

echo "ARCH -- running pre-push integrity review..."
arch check
if [ $? -ne 0 ]; then
    echo "Error: Integrity review failed. Push aborted."
    exit 1
fi

echo "Integrity review passed. Proceeding with push."
`,
      },
    ];

    for (const hook of hooks) {
      const hookPath = path.join(this.rootPath, hooksDir, hook.name);
      await fs.writeFile(hookPath, hook.content, 'utf-8');
      await fs.chmod(hookPath, 0o755);
      console.log(`  + ${hooksDir}/${hook.name}`);
    }
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

  private minimalArchMd(): string {
    return `# ARCH.md
<!-- ARCH Framework v1.0.0 | Minimal Protocol -->

## Core Protocol
1. Read \`docs/TASK-FORMAT.md\` — the meta line format is authoritative.
2. Run \`arch check\` before every commit to verify system integrity.
3. Every commit must reference a TASK-ID and use an authoritative prefix (\`feat:\`, \`fix:\`, \`chore:\`).

## Task Lifecycle
\`\`\`
READY → IN_PROGRESS → REVIEW → DONE → archived (${this.pr.archive}/)
\`\`\`

- **READY:** Available for selection.
- **IN_PROGRESS:** Set \`Focus:yes\` and commit before implementing.
- **REVIEW:** Run predicates, write Hansei, append \`REVIEW_REQUEST\` to \`${this.pr.inbox}\`, commit, stop.
- **DONE:** Auditor verifies, moves to archive.
`;
  }

  private agentsMd(): string {
    return `# AGENTS.md
<!-- ARCH Framework v1.2.0 | Universal Entry Point -->

## Onboarding
1. Read this file completely before taking any action.
2. Read \`arch.config.json\` for routing and active sprint state.
3. Read \`docs/TASK-FORMAT.md\` — the meta line format is authoritative. Violations fail lint on every commit.
4. Read \`docs/guidelines/core.md\` — commit conventions, git policy, and task lifecycle rules.
5. Run \`arch check\` to verify system integrity. This command is **read-only**.

---

## System Lifecycle

\`\`\`
IDEA → DRAFT (${this.pr.refinement}/) → THINK evaluates → human decides → TASK (${this.pr.tasks}/)

TASK: READY → IN_PROGRESS → REVIEW → DONE → archived (${this.pr.archive}/)
\`\`\`

**The implementing agent cannot archive its own task.** A separate Auditor session verifies each AC against the actual repository state, then moves the file to \`${this.pr.archive}/\`.

### Task status transitions

| Status | Location | Agent action |
|--------|----------|--------------|
| \`READY\` | \`${this.pr.tasks}/\` | Available for selection. \`Focus:no\`. |
| \`IN_PROGRESS\` | \`${this.pr.tasks}/\` | Set \`Focus:yes\`, commit **before** any implementation. |
| \`REVIEW\` | \`${this.pr.tasks}/\` | Run predicates, write Hansei, append \`REVIEW_REQUEST\` to \`${this.pr.inbox}\`, commit, stop. |
| \`DONE\` | \`${this.pr.tasks}/\` → \`${this.pr.archive}/\` | Auditor sets DONE + \`Closed-at\`. \`arch govern\` moves the file. |
| \`BLOCKED\` | \`${this.pr.tasks}/\` | Halted on missing dependency. |

---

## Modes

### THINK mode
**Invoked by:** \`arch analyze\`
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
- \`idea:\` prefix in DO → draft in \`${this.pr.refinement}/\` → THINK evaluates → human promotes → TASK
- Promoting a draft: the **decision** requires explicit human instruction (human writes \`PROMOTE → TASK-XXX\` in the IDEA's Decision field). The **execution** of an already-decided promotion follows the L2 autonomy rule — see \`docs/guidelines/autonomy.md\`.

---

## What \`arch govern\` does vs. what agents do
- \`arch govern\` — deterministic enforcement: archives DONE tasks, assigns Focus, checks thresholds. No LLM.
- \`arch analyze\` — triggers THINK mode (LLM analysis). Proposals only. Never satisfies a governance gate.
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
          `${this.pr.adr}/`,
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
        tasks: this.pr.tasks,
        archive: this.pr.archive,
        guidelines: this.pr.guidelines,
        agents: this.pr.agents,
        refinement: this.pr.refinement,
        adr: this.pr.adr,
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
<!-- ARCH v1.2.0 — Execution Protocol -->

## Intent: Execute Task
1. \`git fetch\` — sync state safely without merging.
2. Find highest priority \`READY\` task in \`${this.pr.tasks}/\` using \`arch task next\`.
3. Verify task ACs against \`negativeConstraints\` in \`arch.config.json\`. Halt if violation detected.
4. Set status to \`IN_PROGRESS\`, add lock in Meta line, and commit immediately before touching any implementation file.
5. Implement against Acceptance Criteria ONLY. No scope additions.
6. On completion:
   - Append \`## Hansei\` section with: \`**Severity:**\`, \`**Category:**\`, \`**Decision:**\`, \`**Constraint:**\`, \`**Cost:**\`, \`**Forward Action:**\`
   - Run \`arch task review TASK-XXX\` to execute all \`cmd:\` predicates and set status to REVIEW.
   - Append \`REVIEW_REQUEST\` to \`${this.pr.inbox}\` with Task ID, AC list, changed files.
   - Release lock and stop.
7. **Auditor Step:** A fresh session reads \`${this.pr.inbox}\`, runs \`arch check\`, verifies each AC. Pass → \`REVIEW_PASS\` + DONE. Fail → \`REVIEW_FAIL\` + back to READY.

## Intent: Operations
- \`idea:\` prefix → create \`${this.pr.refinement}/IDEA-[slug].md\` and commit.
- Mark DONE → add \`Closed-at\` timestamp, set status DONE. Auditor moves to archive.

## Andon Cord (halt immediately)
1. \`arch check\` fails 3 consecutive times on the same task.
2. Turn count exceeds Muri threshold for task size.
3. EXEC phase exceeds \`governance.execTimeoutMinutes\`.
4. Implementation requires touching a \`protectedPath\` without a prior ADR.

**On halt:** append \`ANDON_HALT\` to \`${this.pr.inbox}\` and exit.
`;
  }

  private thinkMd(): string {
    return `# THINK.md
<!-- ARCH v1.2.0 — Analysis Protocol (Invoked by arch analyze) -->
<!-- Authority: proposals only. Never mutates task state. Never satisfies a governance gate. -->

## Phase 1: Context & Replenishment
0. Print: \`[THINK] Phase 1 — Context & Replenishment\` to stdout.
1. Note: \`arch analyze\` triggered this session. This is the analysis layer — proposals only.
2. **Health Evaluation:** Identify P0 tasks that are blocked or not focused. If a task is \`IN_PROGRESS\` with a lock > 3 days, create a P1 \`READY\` bug task in \`${this.pr.tasks}/\`.
3. **Replenishment check:** Count \`READY\` tasks in \`${this.pr.tasks}/\`. If count < 3, propose at least one new IDEA in \`${this.pr.refinement}/\` before continuing.
4. **INBOX Regeneration:** Overwrite \`${this.pr.inbox}\` with current loop status, active/READY task counts, pending items (\`AWAITING_PROMOTION\`, \`AWAITING_REVIEW\`), and summaries of the last 5 completed tasks. Commit with \`[THINK]\` tag.
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
2. If a guideline change is needed: create \`${this.pr.refinement}/IDEA-guideline-[slug].md\` and append \`AWAITING_PROMOTION\` to \`${this.pr.inbox}\`.
3. Never modify \`docs/guidelines/\` directly.

## Hard Rules
- THINK never creates task files directly. It creates IDEA files in \`${this.pr.refinement}/\`.
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
- **Git Hooks:** \`arch init\` installs git hooks (commit-msg, pre-commit, pre-push) in \`.githooks/\`. Run \`git config core.hooksPath .githooks\` to activate.

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
- [ ] \`arch check\` passes

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
    return `## TASK-001: Complete your first governed task
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | claude-code | ${this.pr.tasks}/

**Depends:** none

### Context

Welcome to ARCH. This task walks you through the full governed lifecycle.

1. **Start:** Run \`arch task start TASK-001\` — sets status to IN_PROGRESS and commits.
2. **Implement:** Make any change to your project. Check it with \`arch check\`.
3. **Finish:** Run \`arch task done TASK-001\` (after review predicates pass).

### Acceptance Criteria

- [ ] You have run \`arch task start TASK-001\` and the Meta line shows IN_PROGRESS
  - \`prose: Meta line shows IN_PROGRESS\`

- [ ] \`arch check\` passes with no blocking errors
  - \`cmd: arch check\`

- [ ] You have run \`arch task done TASK-001\` to complete the lifecycle
  - \`prose: task archived to ${this.pr.archive}/\`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] \`arch check\` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Starter task — no implementation performed.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None required.
`;
  }

}
