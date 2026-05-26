// Integration tests for ARCH CLI
// These tests run against a real temporary git repository and real filesystem.
// They catch issues that MockFileSystem-based tests would miss, such as real git operations.
//
// Exclusion: These tests can be excluded by filtering filenames, e.g. 
// node --test $(ls src/test/ts/*.test.ts | grep -v integration)

import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Skip if git is not available
let gitAvailable = true;
try {
  execSync('git --version', { stdio: 'ignore' });
} catch {
  gitAvailable = false;
}

const CLI_ROOT = path.resolve(__dirname, '../../../');
const TSX_BIN = path.join(CLI_ROOT, 'node_modules/.bin/tsx');
const ARCH_CLI = `${TSX_BIN} ${join(CLI_ROOT, 'src/main/ts/index.ts')}`;

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'arch-integration-test-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'ignore' });

  // Minimal ARCH bootstrap
  mkdirSync(join(dir, 'docs/tasks'), { recursive: true });
  mkdirSync(join(dir, 'docs/archive'), { recursive: true });
  mkdirSync(join(dir, 'docs/refinement'), { recursive: true });
  mkdirSync(join(dir, 'docs/adr'), { recursive: true });
  mkdirSync(join(dir, 'docs/guidelines'), { recursive: true });
  mkdirSync(join(dir, '.arch'), { recursive: true });

  writeFileSync(join(dir, 'arch.config.json'), JSON.stringify({
    version: "1.2.0",
    protocolVersion: "1.1.0",
    currentSprint: "sprint/test",
    paths: {
        tasks: "docs/tasks",
        archive: "docs/archive",
        refinement: "docs/refinement",
        adr: "docs/adr",
        guidelines: "docs/guidelines"
    }
  }));

  writeFileSync(join(dir, 'README.md'), '# ARCH Project\n\narch status\narch review\narch govern\n');
  writeFileSync(join(dir, 'GEMINI.md'), '# AGENTS.md\n');
  writeFileSync(join(dir, 'docs/IDENTITY.md'), '# IDENTITY\n');
  writeFileSync(join(dir, 'docs/ROADMAP.md'), '# ROADMAP\n');
  writeFileSync(join(dir, 'docs/METRICS.md'), '# METRICS\n');
  writeFileSync(join(dir, 'docs/INBOX.md'), '# INBOX\n');

  // Create a minimal package.json to satisfy version check
  mkdirSync(join(dir, 'cli'), { recursive: true });
  writeFileSync(join(dir, 'cli/package.json'), JSON.stringify({
    version: "1.2.0",
    archProtocol: ">=1.1.0"
  }));

  execSync('git add . && git commit -m "chore: arch bootstrap"', { cwd: dir, stdio: 'ignore' });

  return dir;
}

function teardown(dir: string) {
  rmSync(dir, { recursive: true, force: true });
}

test('arch review - integration test with real git repo', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    // Create a task that is in REVIEW status but missing a required file AC
    const taskContent = `## TASK-999: test task
**Meta:** P1 | S | REVIEW | Focus:yes | 2-code-generation | local | committed-file.txt

### Acceptance Criteria
- [x] committed file
  - \`file: committed-file.txt\`
- [ ] missing file
  - \`file: missing-file.txt\`

### Definition of Done
- [x] All ACs checked
- [x] arch check passes
`;
    writeFileSync(join(dir, 'docs/tasks/TASK-999.md'), taskContent);
    writeFileSync(join(dir, 'committed-file.txt'), 'present');
    execSync('git add . && git commit -m "feat: [TASK-999] implementation partially complete"', { cwd: dir, stdio: 'ignore' });

    let output;
    try {
      output = execSync(`${ARCH_CLI} review`, { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    } catch (e: any) {
      output = e.stdout + e.stderr;
    }

    try {
      assert.ok(output.includes('Review Queue'), 'Should show review queue header');
      assert.ok(output.includes('TASK-999: test task'), 'Should list the task');
      assert.match(output, /\u2716.*missing file/, 'Should show failed AC with cross icon');
      assert.ok(output.includes('ACs: 1/2 passed'), 'Should show AC summary');
    } catch (e) {
      console.error('Review Output:', output);
      throw e;
    }
  } finally {
    teardown(dir);
  }
});

test('arch govern - integration test with task archival', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    // Create a task that is READY for DONE
    // We add Closed-at manually because arch govern expects it for DONE tasks (metrics)
    const taskContent = `## TASK-888: done task
**Meta:** P1 | S | DONE | Focus:yes | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-26T12:00:00Z

### Acceptance Criteria
- [x] task exists
  - \`file: docs/tasks/TASK-888.md\`

### Definition of Done
- [x] All ACs checked
- [x] arch check passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** All good.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
`;
    writeFileSync(join(dir, 'docs/tasks/TASK-888.md'), taskContent);
    execSync('git add . && git commit -m "feat: [TASK-888] ready for done"', { cwd: dir, stdio: 'ignore' });

    // Run arch govern
    let output;
    try {
        output = execSync(`${ARCH_CLI} govern`, { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    } catch (e: any) {
        output = e.stdout + e.stderr;
    }

    assert.ok(output.includes('Governance Tick'), 'Should show govern header');

    // Check if task was moved to archive
    const archivedPath = join(dir, 'docs/archive/TASK-888.md');
    const taskPath = join(dir, 'docs/tasks/TASK-888.md');

    try {
      assert.ok(!existsSync(taskPath), 'Task should be removed from tasks/');
      assert.ok(existsSync(archivedPath), 'Task should be in archive/');

      const archivedContent = readFileSync(archivedPath, 'utf-8');
      assert.ok(archivedContent.includes('| DONE |'), 'Archived task should have DONE status in meta');
      assert.ok(archivedContent.includes('Closed-at:'), 'Archived task should have Closed-at timestamp');

      // Verify focus assignment (arch govern should assign focus to remaining READY tasks)
      // Create a READY task to see if it gets focus
      const readyTask = `## TASK-777: ready task
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | local | docs/tasks/
`;
      writeFileSync(join(dir, 'docs/tasks/TASK-777.md'), readyTask);
      execSync('git add . && git commit -m "feat: [TASK-777] add ready task"', { cwd: dir, stdio: 'ignore' });

      const output2 = execSync(`${ARCH_CLI} govern`, { cwd: dir, encoding: 'utf-8' });
      assert.ok(output2.includes('FOCUS_ACQUIRED: TASK-777'), 'Should assign focus to TASK-777');
    } catch (e) {
      console.error('Govern Output:', output);
      throw e;
    }

  } finally {
    teardown(dir);
  }
});

// Exercises real git behavior (history traversal) which MockFileSystem would miss.
// Also found a bug in GitCli.ts where HEAD~limit fails if history is too short.
test('arch check - detects real git violation (merge commit)', { skip: !gitAvailable }, async () => {
  const dir = setup();
  try {
    const defaultBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, encoding: 'utf-8' }).trim();

    // Create a merge commit
    execSync('git checkout -b feature-branch', { cwd: dir, stdio: 'ignore' });
    writeFileSync(join(dir, 'feature.txt'), 'feature');
    execSync('git add feature.txt && git commit -m "feat: [TASK-001] add feature"', { cwd: dir, stdio: 'ignore' });
    execSync(`git checkout ${defaultBranch}`, { cwd: dir, stdio: 'ignore' });
    writeFileSync(join(dir, 'main.txt'), 'main');
    execSync('git add main.txt && git commit -m "feat: [TASK-002] add main"', { cwd: dir, stdio: 'ignore' });
    // This creates a real merge commit. Note the valid commit message prefix.
    execSync('git merge feature-branch --no-ff -m "chore: [TASK-003] merge feature"', { cwd: dir, stdio: 'ignore' });

    // arch check detects merge commits
    let output;
    try {
        output = execSync(`${ARCH_CLI} check`, { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    } catch (e: any) {
        output = e.stdout + e.stderr;
    }

    // MergeCommits check returns WARN and details with "Merge commit detected"
    assert.ok(output.includes('Merge commit detected'), 'Should detect the real merge commit in git history');
  } finally {
    teardown(dir);
  }
});
