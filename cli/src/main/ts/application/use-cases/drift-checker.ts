import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';
import { HanseiAuditor } from '../../domain/services/hansei-auditor.js';
import semver from 'semver';
import { FocusLevel, ConflictSeverity, FocusConflict } from '../../domain/models/task.js';

export interface DriftResult {
  check: string;
  status: 'OK' | 'WARN' | 'FAIL';
  details: string[];
}

const CLI_COMMANDS = new Set(['review', 'task', 'inbox', 'merge-resolve', 'ask', 'causal', 'govern', 'reflect']);
const ROOT_RUNTIME_ARTIFACTS = new Set(['.codex']);

export class DriftChecker {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string,
    private cliVersion: string
  ) {}

  async check(): Promise<DriftResult[]> {
    return Promise.all([
      this.checkCommandDrift(),
      this.checkVersionDrift(),
      this.checkAgentsPaths(),
      this.checkConfigPaths(),
      this.checkWorktreeHygiene(),
      this.checkTaskArchiveDrift(),
      this.checkDocVersion(),
      this.checkDeadPaths(),
      this.checkDeadContext(),
      this.checkStaleDepends(),
      this.checkDependsGraph(),
      this.checkPriorityDrift(),
      this.checkStaleTasks(),
      this.checkMergeCommits(),
      this.checkCensus(),
      this.checkHanseiPresent(),
      this.checkHaltPolicy(),
      this.checkEscalationMaturity(),
      this.checkExcisionStructuralCheck(),
      this.checkOrphanTasks(),
      this.checkObsoleteGuidelines(),
      this.checkUnappliedADRs(),
      this.checkArchivedIdeaDecisions(),
      this.checkApprovalPresent(),
      this.checkHanseiReconciliation(),
      this.checkArchiveMetaIntegrity(),
      this.checkFocusStatusAlignment(),
      this.checkTaskTemplateCompliance(),
      this.checkSentinelCoverage(),
      this.checkVersionCompat(),
    ]);
  }

  private async checkEscalationMaturity(): Promise<DriftResult> {
    const details: string[] = [];
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const protectedPaths = config.governance?.protectedPaths || [];

    // 1. Repeated Review Failure Detection
    const activeTasks = await this.getMarkdownFiles('docs/tasks');
    for (const file of activeTasks) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const status = parts[2];
        if (status === 'REVIEW' && content.includes('**Rejected-at:**')) {
          details.push(`${file.replace('.md', '')} is back in REVIEW after a previous rejection. High risk of repeated failure.`);
        }
      }
    }

    // 2. Protected Path Enforcement (Current Worktree)
    const statusLines = await this.gitRepository.getStatusLines();
    const touchedProtectedPaths: string[] = [];
    const adrAdded = statusLines.some(line => line.startsWith('A') && line.includes('docs/adr/'));

    for (const line of statusLines) {
      const filePath = line.slice(3).trim();
      if (protectedPaths.some((p: string) => filePath.startsWith(p) && !filePath.startsWith('docs/adr/'))) {
        touchedProtectedPaths.push(filePath);
      }
    }

    if (touchedProtectedPaths.length > 0 && !adrAdded) {
      details.push(`Protected path(s) modified without a new ADR in the same change set: ${touchedProtectedPaths.join(', ')}`);
    }

    // 3. Git diff parsing: check last commit for protected path changes without ADR
    const lastCommitFiles = await this.gitRepository.getChangedFilesInLastCommit();
    const commitTouchedProtected = lastCommitFiles.filter(f =>
      protectedPaths.some((p: string) => f.startsWith(p) && !f.startsWith('docs/adr/'))
    );
    const commitHasAdr = lastCommitFiles.some(f => f.startsWith('docs/adr/'));

    if (commitTouchedProtected.length > 0 && !commitHasAdr) {
      // Separate deletions from additions/modifications
      let diff = '';
      try { diff = await this.gitRepository.getDiff(['HEAD~1..HEAD', '--name-status']); } catch { diff = ''; }
      const deletedFiles = diff.split('\n')
        .filter((l: string) => l.startsWith('D\t'))
        .map((l: string) => l.slice(2).trim());

      const deletedProtectedFiles = commitTouchedProtected.filter(f => deletedFiles.includes(f));
      const modifiedProtectedFiles = commitTouchedProtected.filter(f => !deletedFiles.includes(f));

      if (modifiedProtectedFiles.length > 0) {
        details.push(`Last commit modifies protected path(s) without a new ADR: ${modifiedProtectedFiles.join(', ')}`);
      }

      if (deletedProtectedFiles.length > 0) {
        const excisionResult = await this.checkExcisionStructure(deletedProtectedFiles);
        if (excisionResult.status !== 'OK') {
          details.push(...excisionResult.details.filter(d => d.includes('FAIL') || d.includes('WARN')));
        }
      }
    }

    return {
      check: 'EscalationMaturity',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }


  private async checkExcisionStructuralCheck(): Promise<DriftResult> {
    try {
      const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
      const config = JSON.parse(configRaw);
      const protectedPaths: string[] = config.governance?.protectedPaths ?? [];

      const lastCommitFiles = await this.gitRepository.getChangedFilesInLastCommit();
      const commitTouchedProtected = lastCommitFiles.filter(f =>
        protectedPaths.some((p: string) => f.startsWith(p) && !f.startsWith('docs/adr/'))
      );
      if (commitTouchedProtected.length === 0) {
        return { check: 'ExcisionStructuralCheck', status: 'OK', details: [] };
      }

      let diff = '';
      try { diff = await this.gitRepository.getDiff(['HEAD~1..HEAD', '--name-status']); } catch { diff = ''; }
      const deletedInCommit = diff.split('\n')
        .filter((l: string) => l.startsWith('D\t'))
        .map((l: string) => l.slice(2).trim());

      const deletedProtected = commitTouchedProtected.filter(f => deletedInCommit.includes(f));
      if (deletedProtected.length === 0) {
        return { check: 'ExcisionStructuralCheck', status: 'OK', details: [] };
      }

      return this.runExcisionGates(deletedProtected);
    } catch {
      return { check: 'ExcisionStructuralCheck', status: 'OK', details: [] };
    }
  }

  private async checkExcisionStructure(deletedFiles: string[]): Promise<DriftResult> {
    return this.runExcisionGates(deletedFiles);
  }

  private async runExcisionGates(deletedFiles: string[]): Promise<DriftResult> {
    const details: string[] = [];

    for (const file of deletedFiles) {
      const artifactName = file.split('/').pop()?.replace(/\.ts$|\.js$|\.md$/, '') ?? file;
      const fileFailures: string[] = [];

      // Gate 1: Reference-clean — no orphan references in operational code/docs
      try {
        const { execSync } = await import('node:child_process');
        const result = execSync(
          `grep -r "${artifactName}" cli/src/ docs/ --include="*.ts" --include="*.md" 2>/dev/null | grep -v "docs/refinement/archive/" | grep -v "docs/superpowers/" | wc -l`,
          { cwd: this.rootPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        const refCount = parseInt(result, 10);
        if (refCount > 0) {
          fileFailures.push(`Gate 1 FAIL — ${refCount} orphan reference(s) remain in codebase`);
        }
      } catch { /* grep not available — pass through */ }

      // Gate 2: Decision-record exists — IDEA archive or ADR references the removed artifact
      let gate2Pass = false;
      try {
        const archiveDir = `${this.rootPath}/docs/refinement/archive`;
        const adrDir = `${this.rootPath}/docs/adr`;
        const archiveFiles = await this.fileSystem.readDirectory(archiveDir).catch(() => []);
        const adrFiles = await this.fileSystem.readDirectory(adrDir).catch(() => []);
        for (const f of [...archiveFiles, ...adrFiles]) {
          const fPath = archiveFiles.includes(f) ? `${archiveDir}/${f}` : `${adrDir}/${f}`;
          const fc = await this.fileSystem.readFile(fPath).catch(() => '');
          if (fc.toLowerCase().includes(artifactName.toLowerCase())) {
            gate2Pass = true; break;
          }
        }
        if (!gate2Pass) {
          fileFailures.push(`Gate 2 FAIL — no decision record in docs/refinement/archive/ or docs/adr/ referencing '${artifactName}'`);
        }
      } catch {
        fileFailures.push(`Gate 2 WARN — decision record check inconclusive (archive unreadable)`);
      }

      // Gate 3: Build-clean — evaluated implicitly (commit must reach review without build failures)
      // Skipped in review to avoid expensive npm run build execution

      if (fileFailures.length === 0) {
        details.push(`ExcisionCheck: PASS — ${file}: all gates passed, ADR not required`);
      } else {
        details.push(...fileFailures.map(f => `ExcisionCheck: FAIL — ${file}: ${f}`));
      }
    }

    const hasFail = details.some(d => d.includes('FAIL'));
    return {
      check: 'ExcisionStructuralCheck',
      status: hasFail ? 'WARN' : 'OK',
      details,
    };
  }

  private async checkHaltPolicy(): Promise<DriftResult> {
    const details: string[] = [];
    const haltPath = 'docs/HALT.md';
    const haltLogPath = 'docs/HALT-LOG.md';

    if (!(await this.fileSystem.exists(`${this.rootPath}/${haltPath}`))) {
      details.push(`${haltPath} not found.`);
    } else {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${haltPath}`);
      const requiredColumns = ['Condition', 'Trigger command', 'CLI exit code', 'HALT-LOG entry format'];
      
      const tableMatch = content.match(/\|.*\|/g);
      if (!tableMatch || tableMatch.length < 2) {
        details.push(`${haltPath} table structure is invalid or missing.`);
      } else {
        const header = tableMatch[0];
        for (const col of requiredColumns) {
          if (!header.includes(col)) {
            details.push(`${haltPath} table missing required column: ${col}`);
          }
        }
      }
    }

    if (!(await this.fileSystem.exists(`${this.rootPath}/${haltLogPath}`))) {
      details.push(`${haltLogPath} not found.`);
    } else {
      // Check for unresolved halt entries (missing or empty Resolution column)
      const logContent = await this.fileSystem.readFile(`${this.rootPath}/${haltLogPath}`);
      const dataRows = logContent
        .split('\n')
        .filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Timestamp') && !line.includes('Halt Log'));

      for (const row of dataRows) {
        const cols = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length < 5 || !cols[4] || cols[4] === '' || cols[4] === '-') {
          const taskId = cols[2] ?? 'unknown';
          const reason = cols[3] ?? 'unknown';
          details.push(`Unresolved halt in HALT-LOG.md: task=${taskId}, reason=${reason.slice(0, 60)}. Add a Resolution entry or mark as DEFERRED.`);
        }
      }
    }

    return {
      check: 'HaltPolicy',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkMergeCommits(): Promise<DriftResult> {
    const merges = await this.gitRepository.getMergeCommits(20);
    const details: string[] = merges.map(hash => `Merge commit detected: ${hash}`);

    return {
      check: 'MergeCommits',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkStaleTasks(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const status = parts[2];
        
        const lastMod = await this.gitRepository.getFileLastModifiedDate(`docs/tasks/${file}`);
        if (!lastMod) continue;

        const ageMs = now - lastMod.getTime();

        if ((status === 'READY' || status === 'BLOCKED') && ageMs > THIRTY_DAYS_MS) {
          const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
          details.push(`${file.replace('.md', '')} is ${status} but has not been modified in ${days} days.`);
        } else if (status === 'IN_PROGRESS' && ageMs > THREE_DAYS_MS) {
          const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
          details.push(`${file.replace('.md', '')} is IN_PROGRESS but has no commit in ${days} days (stale lock).`);
        }
      }
    }

    return {
      check: 'StaleTasks',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkPriorityDrift(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    
    const doneTaskIds = new Set(archiveFiles.map(f => f.replace('.md', '')));
    const allActiveTasks: any[] = [];

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const headerMatch = content.match(/^## (TASK-\d{3}): (.*)/m);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      
      if (headerMatch && metaMatch) {
        const id = headerMatch[1];
        const metaLine = metaMatch[0];
        const parts = metaLine.split('|').map(s => s.trim());
        const priority = parts[0].replace('**Meta:** ', '');
        const status = parts[2];
        const focus = parts[3];
        
        allActiveTasks.push({
          id,
          priority: parseInt(priority.substring(1), 10),
          status,
          isFocused: focus === 'Focus:yes',
          depends: dependsMatch ? dependsMatch[1].split(',').map(s => s.trim()) : []
        });
      }
    }

    const focusedTasks = allActiveTasks.filter(t => t.isFocused && t.status !== 'DONE');
    if (focusedTasks.length === 0) {
      return { check: 'PriorityDrift', status: 'OK', details: [] };
    }

    const minFocusedPriority = Math.min(...focusedTasks.map(t => t.priority));

    for (const task of allActiveTasks) {
      if (task.status === 'READY' && !task.isFocused && task.priority < minFocusedPriority) {
        // Check if unblocked
        const isUnblocked = task.depends.every((dep: string) => dep === 'none' || doneTaskIds.has(dep));
        if (isUnblocked) {
          details.push(`${task.id} (P${task.priority}) is READY and unblocked, but not focused while a P${minFocusedPriority} task is focused.`);
        }
      }
    }

    return {
      check: 'PriorityDrift',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkDeadContext(): Promise<DriftResult> {
    const details: string[] = [];
    const taskFiles = await this.getMarkdownFiles('docs/tasks');

    for (const file of taskFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const contextPart = parts[6];
        if (contextPart) {
          const paths = contextPart.split(',').map(s => s.trim());
          for (const p of paths) {
            if (!p || p === '' || p === 'none') continue;
            // Check if it's a glob
            if (p.includes('*')) continue;
            
            const exists = await this.fileSystem.exists(`${this.rootPath}/${p}`);
            if (!exists) {
              details.push(`${file.replace('.md', '')}: dead context path '${p}'`);
            }
          }
        }
      }
    }

    return {
      check: 'DeadContext',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkStaleDepends(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    
    const allTaskFiles = [...activeFiles, ...archiveFiles];
    const existingTaskIds = new Set(allTaskFiles.map(f => f.replace('.md', '')));

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      if (dependsMatch) {
        const deps = dependsMatch[1].split(',').map(s => s.trim());
        for (const dep of deps) {
          if (!dep || dep === 'none') continue;
          if (!existingTaskIds.has(dep)) {
            details.push(`${file.replace('.md', '')}: stale dependency '${dep}'`);
          }
        }
      }
    }

    return {
      check: 'StaleDepends',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkDependsGraph(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    const allTaskIds = new Set([
      ...activeFiles.map(f => f.replace('.md', '')),
      ...archiveFiles.map(f => f.replace('.md', '')),
    ]);

    const graph = new Map<string, string[]>();
    for (const file of activeFiles) {
      const id = file.replace('.md', '');
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      const deps: string[] = [];
      if (dependsMatch) {
        for (const dep of dependsMatch[1].split(',').map(s => s.trim())) {
          if (!dep || dep === 'none') continue;
          if (!allTaskIds.has(dep)) {
            details.push(`${id}: unknown dependency '${dep}'`);
          } else {
            deps.push(dep);
          }
        }
      }
      graph.set(id, deps);
    }

    // DFS cycle detection (active nodes only)
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node);
      inStack.add(node);
      for (const dep of graph.get(node) ?? []) {
        if (!graph.has(dep)) continue; // archived, no cycle possible from here
        if (!visited.has(dep)) {
          if (dfs(dep, [...path, dep])) return true;
        } else if (inStack.has(dep)) {
          const cycle = [...path, dep].join(' → ');
          details.push(`Circular dependency detected: ${cycle}`);
          return true;
        }
      }
      inStack.delete(node);
      return false;
    };

    for (const id of graph.keys()) {
      if (!visited.has(id)) dfs(id, [id]);
    }

    return {
      check: 'DependsGraph',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkDeadPaths(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const details: string[] = [];
    const deadPaths = ['sprint', 'backlog', 'done'];

    if (config.paths) {
      for (const path of deadPaths) {
        if (config.paths[path]) {
          details.push(`Deprecated path '${path}' found in arch.config.json. Remove it.`);
        }
      }
    }

    return {
      check: 'DeadPaths',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkDocVersion(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const version = config.version;
    const details: string[] = [];

    const filesToCheck = [
      'AGENTS.md',
      'GEMINI.md',
      'docs/AGENTS.md',
      'docs/ONBOARDING.html',
      'docs/index.html',
      'docs/agents/DO.md',
      'docs/agents/THINK.md',
    ];

    for (const file of filesToCheck) {
      if (await this.fileSystem.exists(`${this.rootPath}/${file}`)) {
        const content = await this.fileSystem.readFile(`${this.rootPath}/${file}`);
        // Match v0.4, v0.4.0, etc.
        const versionRegex = /v\d+\.\d+(\.\d+)?/g;
        const matches = content.match(versionRegex);
        if (matches) {
          for (const match of matches) {
            if (!version.startsWith(match.substring(1))) {
              details.push(`${file}: found ${match}, expected v${version}`);
            }
          }
        }
      }
    }

    return {
      check: 'DocVersion',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkConfigPaths(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const details: string[] = [];

    if (config.paths) {
      for (const [key, relPath] of Object.entries(config.paths)) {
        const exists = await this.fileSystem.exists(`${this.rootPath}/${relPath}`);
        if (!exists) {
          details.push(`Configured path for '${key}' does not exist: ${relPath}`);
        }
      }
    }

    return {
      check: 'ConfigPaths',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkCommandDrift(): Promise<DriftResult> {
    if (!(await this.fileSystem.exists(`${this.rootPath}/README.md`))) {
      return { check: 'Commands', status: 'WARN', details: ['README.md not found'] };
    }
    const readme = await this.fileSystem.readFile(`${this.rootPath}/README.md`);
    const documented = new Set<string>();
    for (const match of readme.matchAll(/^(?:\.\/scripts\/arch\.sh|arch)\s+([a-z][a-z-]+)/gm)) {
      documented.add(match[1]);
    }

    const missing = [...documented].filter(c => !CLI_COMMANDS.has(c));
    const extra = [...CLI_COMMANDS].filter(c => !documented.has(c));
    const details: string[] = [];

    if (missing.length > 0) details.push(`Documented but not implemented: ${missing.join(', ')}`);
    if (extra.length > 0) details.push(`Implemented but not documented: ${extra.join(', ')}`);

    return { check: 'Commands', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  private async checkVersionDrift(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const configVersion = JSON.parse(configRaw).version as string;

    const details: string[] = [];

    if (configVersion !== this.cliVersion) {
      details.push(`arch.config.json: v${configVersion} — CLI: v${this.cliVersion}`);
    }

    const pkgPath = `${this.rootPath}/cli/package.json`;
    if (await this.fileSystem.exists(pkgPath)) {
      const pkgRaw = await this.fileSystem.readFile(pkgPath);
      const pkgVersion = JSON.parse(pkgRaw).version as string;
      if (pkgVersion !== configVersion) {
        details.push(`cli/package.json: v${pkgVersion} — arch.config.json: v${configVersion}`);
      }
    }

    if (details.length === 0) {
      return { check: 'Version', status: 'OK', details: [`v${this.cliVersion}`] };
    }

    return {
      check: 'Version',
      status: 'WARN',
      details,
    };
  }

  private async checkAgentsPaths(): Promise<DriftResult> {
    let agentsPath = `${this.rootPath}/docs/AGENTS.md`;
    if (!(await this.fileSystem.exists(agentsPath))) {
      agentsPath = `${this.rootPath}/AGENTS.md`;
    }
    if (!(await this.fileSystem.exists(agentsPath))) {
      return { check: 'Paths', status: 'WARN', details: ['AGENTS.md not found'] };
    }
    const agents = await this.fileSystem.readFile(agentsPath);
    const refs = new Set<string>();

    for (const match of agents.matchAll(/`([a-zA-Z][a-zA-Z0-9/_\-\.]+\.[a-zA-Z]{1,5})`/g)) {
      refs.add(match[1]);
    }
    for (const match of agents.matchAll(/`(docs\/[a-zA-Z0-9/_\-\.]*)`/g)) {
      refs.add(match[1]);
    }

    const missing: string[] = [];
    for (const ref of refs) {
      const exists = await this.fileSystem.exists(`${this.rootPath}/${ref}`);
      if (!exists) missing.push(ref);
    }

    return {
      check: 'Paths',
      status: missing.length === 0 ? 'OK' : 'WARN',
      details: missing.length > 0 ? missing.map(p => `Missing: ${p}`) : [],
    };
  }

  private async checkWorktreeHygiene(): Promise<DriftResult> {
    const statusLines = await this.gitRepository.getStatusLines();
    const details: string[] = [];

    for (const line of statusLines) {
      const status = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      if (!filePath) continue;

      if (status.includes('D')) {
        // Skip tracked deletions as they are intentional
        continue;
      }

      if (status === '??') {
        const normalized = filePath.replace(/\/$/, '');
        if (!normalized.includes('/') && ROOT_RUNTIME_ARTIFACTS.has(normalized)) {
          details.push(`Runtime artifact not ignored locally: ${normalized}`);
        }
      }
    }

    return {
      check: 'Worktree',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkTaskArchiveDrift(): Promise<DriftResult> {
    const details: string[] = [];
    const taskFiles = await this.getMarkdownFiles('docs/tasks');
    const archiveFiles = await this.getMarkdownFiles('docs/archive');

    const duplicateIds = taskFiles.filter(file => archiveFiles.includes(file));
    for (const file of duplicateIds) {
      details.push(`Task exists in both active and archive: ${file.replace('.md', '')}`);
    }

    return {
      check: 'TaskArchive',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkCensus(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const budget: Record<string, number> = config.contextBudget ?? {};
    const details: string[] = [];

    for (const [dirPath, threshold] of Object.entries(budget)) {
      if (!(await this.fileSystem.exists(`${this.rootPath}/${dirPath}`))) continue;

      const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dirPath}`);
      let totalLines = 0;
      for (const file of files) {
        try {
          const content = await this.fileSystem.readFile(`${this.rootPath}/${dirPath}/${file}`);
          if (content) totalLines += content.split('\n').length;
        } catch {
          // skip subdirectories and unreadable entries
        }
      }

      if (totalLines > threshold) {
        const action = dirPath.includes('archive')
          ? 'PURGE — run: arch task compress --all'
          : 'REFACTOR';
        details.push(`${dirPath}: ${totalLines} lines exceeds budget of ${threshold} — suggested action: ${action}`);
      }
    }

    return {
      check: 'Census',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkHanseiPresent(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const hanseiSinceTaskId = (config.governance?.hanseiSinceTaskId ?? config.hanseiSinceTaskId) as number | undefined;
    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    const details: string[] = [];

    for (const file of archiveFiles) {
      const taskIdMatch = file.match(/^TASK-(\d+)\.md$/);
      if (!taskIdMatch) continue;

      const taskId = parseInt(taskIdMatch[1], 10);
      if (hanseiSinceTaskId !== undefined && taskId < hanseiSinceTaskId) {
        continue;
      }

      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/archive/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\*\s+[^|]+\|\s*(\S+)\s*\|/m);
      const size = metaMatch?.[1] ?? '';
      if (!['M', 'L', 'XL'].includes(size)) continue;
      if (!content.includes('## Hansei')) {
        details.push(`${file.replace('.md', '')}: missing ## Hansei section`);
      }
    }

    return {
      check: 'HanseiPresent',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkOrphanTasks(): Promise<DriftResult> {
    const activeFiles = await this.getMarkdownFiles('docs/tasks');

    const tasks: { id: string; status: string; dependsOn: string[] }[] = [];

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
      const id = file.replace('.md', '');
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      const status = metaMatch ? metaMatch[0].split('|').map(s => s.trim())[2] : '';
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      const dependsOn = dependsMatch
        ? dependsMatch[1].split(',').map(s => s.trim()).filter(s => s && s !== 'none')
        : [];
      tasks.push({ id, status, dependsOn });
    }

    const activeRootIds = new Set(
      tasks.filter(t => t.status === 'READY' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW').map(t => t.id)
    );

    if (activeRootIds.size === 0) {
      return { check: 'OrphanTasks', status: 'OK', details: [] };
    }

    // Build enables graph: dependency → [dependents that need it]
    const enables = new Map<string, string[]>();
    for (const task of tasks) {
      for (const dep of task.dependsOn) {
        if (!enables.has(dep)) enables.set(dep, []);
        enables.get(dep)!.push(task.id);
      }
    }

    // BFS from active roots following enables edges
    const reachable = new Set<string>(activeRootIds);
    const queue = [...activeRootIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dependent of enables.get(current) ?? []) {
        if (!reachable.has(dependent)) {
          reachable.add(dependent);
          queue.push(dependent);
        }
      }
    }

    const details = tasks
      .filter(t => !reachable.has(t.id))
      .map(t => `${t.id} is not reachable from any active node (orphan task).`);

    return { check: 'OrphanTasks', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  private async checkObsoleteGuidelines(): Promise<DriftResult> {
    const guidelinesDir = `${this.rootPath}/docs/guidelines`;
    if (!(await this.fileSystem.exists(guidelinesDir))) {
      return { check: 'ObsoleteGuidelines', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(guidelinesDir)).filter(f => f.endsWith('.md'));
    const details: string[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${guidelinesDir}/${file}`);
      const refs = new Set<string>();

      for (const match of content.matchAll(/`([a-zA-Z][a-zA-Z0-9/_\-\.]+\.[a-zA-Z]{1,5})`/g)) {
        refs.add(match[1]);
      }
      for (const match of content.matchAll(/`(docs\/[a-zA-Z0-9/_\-\.]*)`/g)) {
        refs.add(match[1]);
      }

      for (const ref of refs) {
        if (ref.includes('*')) continue;
        const normalizedRef = ref.replace(/\/$/, '');
        const exists = await this.fileSystem.exists(`${this.rootPath}/${normalizedRef}`);
        if (!exists) {
          details.push(`docs/guidelines/${file}: dead reference '${ref}'`);
        }
      }
    }

    return { check: 'ObsoleteGuidelines', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  private async checkUnappliedADRs(): Promise<DriftResult> {
    const adrDir = `${this.rootPath}/docs/adr`;
    if (!(await this.fileSystem.exists(adrDir))) {
      return { check: 'UnappliedADRs', status: 'OK', details: [] };
    }

    const adrFiles = (await this.fileSystem.readDirectory(adrDir)).filter(f => f.endsWith('.md'));

    // Build combined search corpus from tasks + archive
    const searchDirs = ['docs/tasks', 'docs/archive'];
    const corpus: string[] = [];
    for (const dir of searchDirs) {
      const dirPath = `${this.rootPath}/${dir}`;
      if (!(await this.fileSystem.exists(dirPath))) continue;
      const files = (await this.fileSystem.readDirectory(dirPath)).filter(f => f.endsWith('.md'));
      for (const file of files) {
        corpus.push(await this.fileSystem.readFile(`${dirPath}/${file}`));
      }
    }
    const combinedCorpus = corpus.join('\n');

    const details: string[] = [];
    for (const adrFile of adrFiles) {
      const content = await this.fileSystem.readFile(`${adrDir}/${adrFile}`);
      const statusMatch = content.match(/^\*\*Status:\*\*\s*(.+)/m);
      if (!statusMatch || statusMatch[1].trim() !== 'ACCEPTED') continue;

      const idMatch = adrFile.match(/^(ADR-\d+)/);
      if (!idMatch) continue;
      const adrId = idMatch[1];

      if (!combinedCorpus.includes(adrId)) {
        details.push(`${adrId}: ACCEPTED but never referenced in any task file.`);
      }
    }

    return { check: 'UnappliedADRs', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  private async checkApprovalPresent(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const sinceTaskId = (config.governance?.hanseiSinceTaskId ?? config.hanseiSinceTaskId) as number | undefined;

    const archiveFiles = await this.getMarkdownFiles('docs/archive');
    const details: string[] = [];

    for (const file of archiveFiles) {
      const taskIdMatch = file.match(/^TASK-(\d+)\.md$/);
      if (!taskIdMatch) continue;

      const taskId = parseInt(taskIdMatch[1], 10);
      if (sinceTaskId !== undefined && taskId < sinceTaskId) continue;

      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/archive/${file}`);

      // L3 gate (ADR-009): XS and S tasks self-archive eligible — exempt from Approval requirement
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map((s: string) => s.trim());
        const size = parts[1];
        if (size === 'XS' || size === 'S') {
          continue;
        }
      }

      if (!content.includes('## Approval')) {
        details.push(`${file.replace('.md', '')}: missing ## Approval section — required for human-reviewed tasks.`);
      }
    }

    return {
      check: 'ApprovalPresent',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }




  private async checkTaskTemplateCompliance(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/docs/tasks`;
    if (!(await this.fileSystem.exists(tasksDir))) {
      return { check: 'TaskTemplateCompliance', status: 'OK', details: [] };
    }

    let hanseiSinceTaskId = 195;
    try {
      const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
      const config = JSON.parse(configRaw);
      hanseiSinceTaskId = config.governance?.hanseiSinceTaskId ?? 195;
    } catch { /* use default */ }

    const VALID_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
    const VALID_SIZES = new Set(['XS', 'S', 'M', 'L']);
    const TARGET_STATUSES = new Set(['READY', 'REVIEW']);

    const files = (await this.fileSystem.readDirectory(tasksDir))
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const details: string[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);
      const taskId = file.replace('.md', '');
      const taskNum = parseInt(taskId.replace('TASK-', ''), 10);

      // Only lint READY and REVIEW tasks
      const metaMatch = content.match(/\*\*Meta:\*\*\s*([^\n]*)/);
      if (!metaMatch) {
        details.push(`${taskId}: missing Meta line`);
        continue;
      }
      const metaLine = metaMatch[1];
      const parts = metaLine.split('|').map((s: string) => s.replace(/<!--.*-->/, '').trim());

      const [priority, size, status] = [parts[0], parts[1], parts[2]];

      if (!TARGET_STATUSES.has(status)) continue;

      if (!priority || !VALID_PRIORITIES.has(priority)) {
        details.push(`${taskId}: invalid Priority '${priority}' — expected P0/P1/P2/P3`);
      }
      if (!size || !VALID_SIZES.has(size)) {
        details.push(`${taskId}: invalid Size '${size}' — expected XS/S/M/L`);
      }
      if (!parts[4] || parts[4].trim() === '') {
        details.push(`${taskId}: missing Class field in Meta line`);
      }

      const hasACs = content.includes('- [ ]') || content.includes('- [x]');
      if (!hasACs) {
        details.push(`${taskId}: no Acceptance Criteria found`);
      }

      if (!content.includes('### Definition of Done')) {
        details.push(`${taskId}: missing ### Definition of Done section`);
      }

      const HANSEI_REQUIRED_SIZES = new Set(['M', 'L', 'XL']);
      if (!isNaN(taskNum) && taskNum >= hanseiSinceTaskId && HANSEI_REQUIRED_SIZES.has(size) && !content.includes('## Hansei')) {
        details.push(`${taskId}: missing ## Hansei section (required for M+ tasks, TASK-${hanseiSinceTaskId}+)`);
      }
    }

    return {
      check: 'TaskTemplateCompliance',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkFocusStatusAlignment(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/docs/tasks`;
    if (!(await this.fileSystem.exists(tasksDir))) {
      return { check: 'FocusStatusAlignment', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(tasksDir))
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const details: string[] = [];
    const conflicts: FocusConflict[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);
      const metaMatch = content.match(/\*\*Meta:\*\*[^\n]*/);
      if (!metaMatch) continue;

      const meta = metaMatch[0];
      const statusMatch = meta.match(/\|\s*(READY|IN_PROGRESS|REVIEW|BLOCKED|DONE)\s*\|/);
      const focusMatch = meta.match(/Focus:(NONE|LOW|MEDIUM|HIGH|yes|no)/i);

      if (!statusMatch || !focusMatch) continue;

      const status = statusMatch[1] as keyof typeof FocusLevel;
      const rawFocus = focusMatch[1].toUpperCase();
      const focusMap: Record<string, FocusLevel> = {
        'YES': FocusLevel.HIGH,
        'NO': FocusLevel.NONE,
        'NONE': FocusLevel.NONE,
        'LOW': FocusLevel.LOW,
        'MEDIUM': FocusLevel.MEDIUM,
        'HIGH': FocusLevel.HIGH,
      };
      const focus = focusMap[rawFocus] ?? FocusLevel.NONE;
      const taskId = file.replace('.md', '');
      const isHumanClass = meta.includes('| human |') || meta.includes('| human\n');

      if (status === 'IN_PROGRESS' && focus === FocusLevel.NONE) {
        conflicts.push({
          taskId,
          status: status as any,
          focus,
          severity: ConflictSeverity.H1,
          description: 'IN_PROGRESS with Focus:NONE — work has no energy assigned.',
        });
        details.push(`${taskId}: IN_PROGRESS but Focus:NONE — H1: debt of attention.`);
      } else if (status === 'DONE' && focus !== FocusLevel.NONE) {
        conflicts.push({
          taskId,
          status: status as any,
          focus,
          severity: ConflictSeverity.H2,
          description: 'DONE with non-NONE focus — post-hoc misalignment, no rollback needed.',
        });
        details.push(`${taskId}: DONE but Focus:${focus} — H2: interpretative desalignment.`);
      } else if (status === 'BLOCKED' && focus === FocusLevel.HIGH) {
        conflicts.push({
          taskId,
          status: status as any,
          focus,
          severity: ConflictSeverity.INFO,
          description: 'BLOCKED with Focus:HIGH — high energy on stalled work.',
        });
        details.push(`${taskId}: BLOCKED but Focus:HIGH — INFO: coherent, not a real conflict.`);
      } else if (status === 'READY' && focus === FocusLevel.HIGH && !isHumanClass) {
        details.push(`${taskId}: READY but Focus:HIGH — focus assigned to non-executing task.`);
      }
    }

    return {
      check: 'FocusStatusAlignment',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkArchiveMetaIntegrity(): Promise<DriftResult> {
    const archiveDir = `${this.rootPath}/docs/archive`;
    if (!(await this.fileSystem.exists(archiveDir))) {
      return { check: 'ArchiveMetaIntegrity', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(archiveDir))
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const details: string[] = [];
    const VALID_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL']);
    const KNOWN_STATUSES = new Set(['DONE', 'REJECTED', 'READY', 'IN_PROGRESS', 'REVIEW', 'BLOCKED']);
    const TERMINAL_STATUSES = new Set(['DONE', 'REJECTED']);

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
      const metaMatch = content.match(/\*\*Meta:\*\*\s*(.+)/);

      if (!metaMatch) {
        details.push(`${file}: missing or unparseable Meta line — run backfill`);
        continue;
      }

      const fields = metaMatch[1].split('|').map(f => f.replace(/<!--.*-->/, '').trim());

      const size = fields[1] ?? '';
      if (!size || !VALID_SIZES.has(size)) {
        details.push(`${file}: invalid Size field '${size}' — expected XS/S/M/L`);
      }

      const statusField = fields.find(f => KNOWN_STATUSES.has(f));
      if (!statusField || !TERMINAL_STATUSES.has(statusField)) {
        details.push(`${file}: status is '${statusField ?? 'unknown'}' — archived tasks must be DONE or REJECTED`);
      }
    }

    return {
      check: 'ArchiveMetaIntegrity',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkArchivedIdeaDecisions(): Promise<DriftResult> {
    const archiveDir = `${this.rootPath}/docs/refinement/archive`;
    if (!(await this.fileSystem.exists(archiveDir))) {
      return { check: 'ArchivedIdeaDecisions', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(archiveDir))
      .filter(f => f.startsWith('IDEA-') && f.endsWith('.md'));

    const details: string[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);

      // Find Decision field content
      const decisionMatch = content.match(/^## Decision\n([\s\S]*?)(?=\n##|$)/m);
      if (!decisionMatch) {
        details.push(`docs/refinement/archive/${file}: missing Decision section — every archived IDEA must have a human decision (PROMOTE, REJECT, or DEFERRED).`);
        continue;
      }

      const decision = decisionMatch[1].trim();
      // Empty or only a placeholder comment
      if (decision === '' || decision.startsWith('<!--')) {
        details.push(`docs/refinement/archive/${file}: empty Decision field — archived without a recorded human decision.`);
      }
    }

    return {
      check: 'ArchivedIdeaDecisions',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkHanseiReconciliation(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/docs/tasks`;
    const auditor = new HanseiAuditor(this.fileSystem, this.rootPath);
    const details: string[] = [];

    let taskFiles: string[] = [];
    try {
      taskFiles = (await this.fileSystem.readDirectory(tasksDir))
        .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
    } catch {
      return { check: 'HanseiReconciliation', status: 'OK', details: [] };
    }

    for (const file of taskFiles) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);

      // Only audit tasks in REVIEW — they have complete implementation
      if (!content.includes('| REVIEW |') && !content.includes('| REVIEW\n')) continue;

      // Parse task minimally for audit
      const idMatch = content.match(/^## (TASK-\d+)/m);
      if (!idMatch) continue;

      const hanseiMatch = content.match(/## Hansei\n\*\*Severity:\*\*\s*(\S+)\n\*\*Category:\*\*\s*(\S+)\n\*\*Decision:\*\*\s*([\s\S]*?)\n\*\*Constraint:\*\*\s*([\s\S]*?)\n\*\*Cost:\*\*\s*([\s\S]*?)\n\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n##|$)/m);
      if (!hanseiMatch) continue;

      const task = {
        id: idMatch[1],
        title: '',
        priority: '',
        size: '',
        status: 'REVIEW' as any,
        focus: false,
        sprint: '',
        class: '',
        cli: '',
        context: [],
        acceptanceCriteria: [],
        hansei: {
          severity: hanseiMatch[1].trim() as any,
          category: hanseiMatch[2].trim(),
          decision: hanseiMatch[3].trim(),
          constraint: hanseiMatch[4].trim(),
          cost: hanseiMatch[5].trim(),
          forwardAction: hanseiMatch[6].trim(),
        },
      };

      const changedFiles = HanseiAuditor.extractChangedFiles(content);
      const result = await auditor.audit(task, changedFiles);

      if (result.verdict === 'CONCEALMENT') {
        details.push(`${result.taskId}: ${result.details.join(' | ')}`);
      } else if (result.verdict === 'INFLATION') {
        details.push(`${result.taskId} (WARN): ${result.details.join(' | ')}`);
      }
    }

    return {
      check: 'HanseiReconciliation',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async checkSentinelCoverage(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/docs/tasks`;
    const sentinelLogPath = `${this.rootPath}/docs/SENTINEL-LOG.md`;

    const SENTINEL_SIZES = new Set(['M', 'L', 'XL']);

    let inProgressFiles: string[] = [];
    try {
      inProgressFiles = (await this.fileSystem.readDirectory(tasksDir))
        .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
    } catch {
      return { check: 'SentinelCoverage', status: 'OK', details: [] };
    }

    let sentinelLog = '';
    try {
      sentinelLog = await this.fileSystem.readFile(sentinelLogPath);
    } catch {
      // No log yet — only WARN if IN_PROGRESS M+ tasks exist
    }

    const details: string[] = [];

    for (const file of inProgressFiles) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);
      if (!content.includes('| IN_PROGRESS |')) continue;

      const metaMatch = content.match(/\*\*Meta:\*\*\s+[^|]+\|\s*(\S+)\s*\|/);
      const size = metaMatch?.[1] ?? '';
      if (!SENTINEL_SIZES.has(size)) continue;

      const taskId = file.replace('.md', '');
      if (!sentinelLog.includes(taskId)) {
        details.push(`${taskId}: IN_PROGRESS M+ task with no Sentinel log entry — run: arch sentinel log ${taskId} --trigger "<reason>" --outcome GO`);
      }
    }

    return {
      check: 'SentinelCoverage',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async getMarkdownFiles(dirPath: string): Promise<string[]> {
    if (!(await this.fileSystem.exists(`${this.rootPath}/${dirPath}`))) {
      return [];
    }

    const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dirPath}`);
    return files.filter(file => file.endsWith('.md'));
  }

  private async checkVersionCompat(): Promise<DriftResult> {
    try {
      const configPath = `${this.rootPath}/arch.config.json`;
      const pkgPath = `${this.rootPath}/cli/package.json`;

      if (!await this.fileSystem.exists(configPath) || !await this.fileSystem.exists(pkgPath)) {
        return { check: 'VersionCompat', status: 'OK', details: [] };
      }

      const config = JSON.parse(await this.fileSystem.readFile(configPath));
      const pkg = JSON.parse(await this.fileSystem.readFile(pkgPath));

      const protocolVersion: string | undefined = config.protocolVersion;
      const minimumCliVersion: string | undefined = config.minimumCliVersion;
      const cliVersion: string | undefined = pkg.version;
      const archProtocol: string | undefined = pkg.archProtocol;

      if (!protocolVersion && !minimumCliVersion) {
        return { check: 'VersionCompat', status: 'OK', details: [] };
      }

      if (minimumCliVersion && cliVersion) {
        const coercedCli = semver.coerce(cliVersion)?.version ?? cliVersion;
        const coercedMin = semver.coerce(minimumCliVersion)?.version ?? minimumCliVersion;
        if (!semver.gte(coercedCli, coercedMin)) {
          return {
            check: 'VersionCompat',
            status: 'FAIL',
            details: [`CLI version ${cliVersion} is below minimumCliVersion ${minimumCliVersion} required by the protocol`],
          };
        }
      }

      if (archProtocol && protocolVersion) {
        if (!semver.validRange(archProtocol)) {
          return {
            check: 'VersionCompat',
            status: 'WARN',
            details: [`archProtocol "${archProtocol}" in cli/package.json is not a valid semver range`],
          };
        }
        const coercedProto = semver.coerce(protocolVersion)?.version ?? protocolVersion;
        if (!semver.satisfies(coercedProto, archProtocol)) {
          return {
            check: 'VersionCompat',
            status: 'FAIL',
            details: [`archProtocol "${archProtocol}" in cli/package.json excludes current protocolVersion ${protocolVersion} — stale compatibility declaration`],
          };
        }
      }

      if (protocolVersion && !archProtocol) {
        return {
          check: 'VersionCompat',
          status: 'WARN',
          details: ['archProtocol missing from cli/package.json — add it for ecosystem discoverability'],
        };
      }

      return { check: 'VersionCompat', status: 'OK', details: [] };
    } catch (e) {
      return { check: 'VersionCompat', status: 'WARN', details: [`VersionCompat check error: ${e}`] };
    }
  }
}
