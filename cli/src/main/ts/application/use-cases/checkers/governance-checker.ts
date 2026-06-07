import { FileSystem } from '../../../domain/repositories/file-system.js';
import { GitRepository } from '../../../domain/repositories/git-repository.js';
import { HanseiAuditor } from '../../../domain/services/hansei-auditor.js';
import semver from 'semver';
import { FocusLevel, ConflictSeverity, FocusConflict, TaskStatus, Hansei, Task } from '../../../domain/models/task.js';
import { PathResolver } from '../../../domain/services/path-resolver.js';
import { ConfigLoader } from '../../../domain/services/config-loader.js';
import type { DriftResult } from './checker-types.js';

const CLI_COMMANDS = new Set([
  'check', 'review', 'init', 'version', 'status', 'sentinel', 'task', 'govern',
  'memory', 'corpus', 'capture', 'inbox', 'reflect', 'report', 'ask', 'causal',
  'index', 'audit', 'analyze', 'resume', 'explain', 'fix', 'triage', 'upgrade',
]);


export class GovernanceChecker {
  private readonly pr: PathResolver;
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string,
    private cliVersion: string,
    pathResolver?: PathResolver
  ) {
    this.pr = pathResolver ?? PathResolver.from({});
  }

  async check(): Promise<DriftResult[]> {
    return Promise.all([
      this.checkEscalationMaturity(),
      this.checkExcisionStructuralCheck(),
      this.checkHaltPolicy(),
      this.checkMergeCommits(),
      this.checkCommandDrift(),
      this.checkVersionDrift(),
      this.checkSentinelCoverage(),
      this.checkVersionCompat(),
      this.checkStaleEscalations(),
      this.checkIdeaMissionClass(),
    ]);
  }

  async checkEscalationMaturity(): Promise<DriftResult> {
    const details: string[] = [];
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const protectedPaths = config.governance?.protectedPaths || [];

    // 1. Repeated Review Failure Detection
    const activeTasks = await this.getMarkdownFiles(this.pr.tasks);
    for (const file of activeTasks) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
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
    const adrAdded = statusLines.some(line => line.startsWith('A') && line.includes(this.pr.adr + '/'));

    for (const line of statusLines) {
      const filePath = line.slice(3).trim();
      if (protectedPaths.some((p: string) => filePath.startsWith(p) && !filePath.startsWith(this.pr.adr + '/'))) {
        touchedProtectedPaths.push(filePath);
      }
    }

    if (touchedProtectedPaths.length > 0 && !adrAdded) {
      details.push(`Protected path(s) modified without a new ADR in the same change set: ${touchedProtectedPaths.join(', ')}`);
    }

    // 3. Git diff parsing: check last commit for protected path changes without ADR
    const lastCommitFiles = await this.gitRepository.getChangedFilesInLastCommit();
    const commitTouchedProtected = lastCommitFiles.filter(f =>
      protectedPaths.some((p: string) => f.startsWith(p) && !f.startsWith(this.pr.adr + '/'))
    );
    const commitHasAdr = lastCommitFiles.some(f => f.startsWith(this.pr.adr + '/'));

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

  async checkExcisionStructuralCheck(): Promise<DriftResult> {
    try {
      const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
      const config = JSON.parse(configRaw);
      const protectedPaths: string[] = config.governance?.protectedPaths ?? [];

      const lastCommitFiles = await this.gitRepository.getChangedFilesInLastCommit();
      const commitTouchedProtected = lastCommitFiles.filter(f =>
        protectedPaths.some((p: string) => f.startsWith(p) && !f.startsWith(this.pr.adr + '/'))
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

  async checkExcisionStructure(deletedFiles: string[]): Promise<DriftResult> {
    return this.runExcisionGates(deletedFiles);
  }

  async checkHaltPolicy(): Promise<DriftResult> {
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

  async checkMergeCommits(): Promise<DriftResult> {
    const merges = await this.gitRepository.getMergeCommits(20);
    const details: string[] = merges.map(hash => `Merge commit detected: ${hash}`);

    return {
      check: 'MergeCommits',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkCommandDrift(): Promise<DriftResult> {
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

  async checkVersionDrift(): Promise<DriftResult> {
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

  async checkSentinelCoverage(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/${this.pr.tasks}`;
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

  async checkVersionCompat(): Promise<DriftResult> {
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

  async checkStaleEscalations(): Promise<DriftResult> {
    const details: string[] = [];
    let raw: string;
    try {
      raw = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.escalations}`);
    } catch {
      return { check: 'StaleEscalations', status: 'OK', details: [] };
    }

    const openPromotions = raw
      .split('\n')
      .filter(l => l.trim())
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(e => e && e.type === 'AWAITING_PROMOTION' && e.status === 'OPEN');

    for (const entry of openPromotions) {
      const ideaFile = `${this.rootPath}/${this.pr.refinement}/${entry.subject}.md`;
      let content: string;
      try {
        content = await this.fileSystem.readFile(ideaFile);
      } catch {
        continue;
      }
      const decisionMatch = content.match(/^\*\*Decision:\*\*\s*(.*)$/m);
      const decisionValue = decisionMatch?.[1]?.trim() ?? '';
      if (decisionValue) {
        details.push(`${entry.subject} has a populated Decision field but escalation is still OPEN — append RESOLVED to ${this.pr.escalations}`);
      }
    }

    return { check: 'StaleEscalations', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  private async getMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dir}`);
      return files.filter(f => f.endsWith('.md'));
    } catch { return []; }
  }

  private async runExcisionGates(deletedFiles: string[]): Promise<DriftResult> {
    const details: string[] = [];

    for (const file of deletedFiles) {
      const artifactName = file.split('/').pop()?.replace(/\.ts$|\.js$|\.md$/, '') ?? file;
      const fileFailures: string[] = [];

      // Gate 1: Reference-clean
      try {
        const { execSync } = await import('node:child_process');
        const result = execSync(
          `grep -r "${artifactName}" cli/src/ docs/ --include="*.ts" --include="*.md" 2>/dev/null | grep -v "${this.pr.refinementArchive}/" | grep -v "docs/superpowers/" | wc -l`,
          { cwd: this.rootPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        const refCount = parseInt(result, 10);
        if (refCount > 0) {
          fileFailures.push(`Gate 1 FAIL — ${refCount} orphan reference(s) remain in codebase`);
        }
      } catch { /* grep not available */ }

      // Gate 2: Decision-record exists
      let gate2Pass = false;
      try {
        const archiveDir = `${this.rootPath}/${this.pr.refinementArchive}`;
        const adrDir = `${this.rootPath}/${this.pr.adr}`;
        const archiveFiles: string[] = await this.fileSystem.readDirectory(archiveDir).catch((): string[] => []);
        const adrFiles: string[] = await this.fileSystem.readDirectory(adrDir).catch((): string[] => []);
        for (const f of [...archiveFiles, ...adrFiles]) {
          const fPath = archiveFiles.includes(f) ? `${archiveDir}/${f}` : `${adrDir}/${f}`;
          const fc = await this.fileSystem.readFile(fPath).catch(() => '');
          if (fc.toLowerCase().includes(artifactName.toLowerCase())) { gate2Pass = true; break; }
        }
        if (!gate2Pass) {
          fileFailures.push(`Gate 2 FAIL — no decision record in ${this.pr.refinementArchive}/ or ${this.pr.adr}/ referencing '${artifactName}'`);
        }
      } catch {
        fileFailures.push(`Gate 2 WARN — decision record check inconclusive`);
      }

      if (fileFailures.length === 0) {
        details.push(`ExcisionCheck: PASS — ${file}: all gates passed`);
      } else {
        details.push(...fileFailures.map(f => `ExcisionCheck: FAIL — ${file}: ${f}`));
      }
    }

    return {
      check: 'ExcisionStructuralCheck',
      status: details.some(d => d.includes('FAIL')) ? 'WARN' : 'OK',
      details,
    };
  }

  async checkIdeaMissionClass(): Promise<DriftResult> {
    const details: string[] = [];
    try {
      const { readdir, readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');

      // Load mission config
      let autonomousScope: string[] = [];
      let humanGated: string[] = [];
      try {
        const cfg = JSON.parse(await readFile(join(this.rootPath, 'arch.config.json'), 'utf8'));
        autonomousScope = cfg?.mission?.autonomousScope ?? [];
        humanGated = cfg?.mission?.humanGated ?? [];
      } catch { return { check: 'IdeaMissionClass', status: 'OK', details: ['No mission config — check skipped'] }; }

      if (autonomousScope.length === 0 && humanGated.length === 0) {
        return { check: 'IdeaMissionClass', status: 'OK', details: ['No mission classes configured — check skipped'] };
      }

      const refinementDir = join(this.rootPath, 'docs', 'refinement');
      const files = await readdir(refinementDir).catch(() => [] as string[]);

      for (const file of files.filter(f => f.startsWith('IDEA-') && f.endsWith('.md'))) {
        const content = await readFile(join(refinementDir, file), 'utf8').catch(() => '');
        const missionClass = content.match(/\*\*Mission-class:\*\*\s*(\S+)/)?.[1];
        const decision = content.match(/\*\*Decision:\*\*\s*(.+)/)?.[1]?.trim() ?? '';

        if (!missionClass) {
          details.push(`[ADVISORY] ${file}: missing Mission-class field — add a value from arch.config.json mission block`);
          continue;
        }

        const allKnown = [...autonomousScope, ...humanGated];
        if (!allKnown.includes(missionClass)) {
          details.push(`[WARN] ${file}: unknown Mission-class '${missionClass}' — not in arch.config.json mission block`);
          continue;
        }

        if (humanGated.includes(missionClass) && !decision.includes('AWAITING_HUMAN')) {
          details.push(`[WARN] ${file}: Mission-class '${missionClass}' is human-gated but Decision does not contain AWAITING_HUMAN`);
        }
      }
    } catch { /* non-blocking */ }

    const hasWarn = details.some(d => d.includes('[WARN]'));
    const hasAdvisory = details.some(d => d.includes('[ADVISORY]'));
    return {
      check: 'IdeaMissionClass',
      status: hasWarn ? 'WARN' : hasAdvisory ? 'ADVISORY' : 'OK',
      details: details.length > 0 ? details : ['All IDEAs have valid Mission-class'],
    };
  }

}
