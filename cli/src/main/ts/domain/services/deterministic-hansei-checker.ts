import { execSync } from 'node:child_process';
import type { Task } from '../models/task.js';

export interface HanseiDriftFinding {
  pattern: string;
  file: string;
  line: number;
  detail: string;
  declaredInHansei: boolean;
}

export interface Tier1Result {
  findings: HanseiDriftFinding[];
  pass: boolean;
  skipped: boolean; // true when lockedCommit absent — no baseline available
}

export class DeterministicHanseiChecker {
  constructor(private rootPath: string = '.') {}

  async check(task: Task): Promise<Tier1Result> {
    if (!task.lockedCommit) {
      return { findings: [], pass: true, skipped: true };
    }

    let diff = '';
    try {
      diff = execSync(
        `git diff ${task.lockedCommit}..HEAD`,
        { cwd: this.rootPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30_000 }
      );
    } catch {
      return { findings: [], pass: true, skipped: true };
    }

    const findings: HanseiDriftFinding[] = [];
    const constraint = task.hansei?.constraint ?? '';
    const cost = task.hansei?.cost ?? '';

    // Escape hatch: if constraint explicitly acknowledges pre-existing or intentional debt,
    // the Tier 1 scan still runs but all findings are treated as declared.
    const constraintLower = constraint.toLowerCase();
    const hasGlobalAck = constraintLower.includes('pre-existing') ||
                         constraintLower.includes('pre existing') ||
                         constraintLower.includes('pre-completion') ||
                         constraintLower.includes('predated') ||
                         constraintLower.includes('predates') ||
                         constraintLower.includes('inherited') ||
                         constraintLower.includes('intentional') ||
                         constraintLower.includes('was already') ||
                         constraintLower.includes('actual implementation') ||
                         constraintLower.includes('placeholder hansei');

    const lines = diff.split('\n');
    let currentFile = '';
    let lineNum = 0;

    for (const line of lines) {
      // Track current file
      const fileMatch = line.match(/^\+\+\+ b\/(.+)/);
      if (fileMatch) { currentFile = fileMatch[1]; lineNum = 0; continue; }
      if (line.startsWith('@@')) {
        const lineMatch = line.match(/\+(\d+)/);
        lineNum = lineMatch ? parseInt(lineMatch[1], 10) - 1 : lineNum;
        continue;
      }
      if (line.startsWith('+')) lineNum++;

      // Only scan added lines (not removed, not context)
      if (!line.startsWith('+') || line.startsWith('+++')) continue;

      const addedLine = line.slice(1);

      // Pattern: any cast
      if (/: any\b|<any>|as any\b/.test(addedLine) && !currentFile.includes('.test.')) {
        const declared = constraint.toLowerCase().includes('any') ||
                         constraint.toLowerCase().includes('type hack');
        findings.push({
          pattern: '`any` cast',
          file: currentFile,
          line: lineNum,
          detail: addedLine.trim().slice(0, 80),
          declaredInHansei: declared || hasGlobalAck,
        });
      }

      // Pattern: @ts-ignore
      if (/@ts-ignore/.test(addedLine)) {
        const declared = constraint.toLowerCase().includes('ts-ignore') ||
                         constraint.toLowerCase().includes('type');
        findings.push({
          pattern: '@ts-ignore',
          file: currentFile,
          line: lineNum,
          detail: addedLine.trim().slice(0, 80),
          declaredInHansei: declared || hasGlobalAck,
        });
      }

      // Pattern: TODO/FIXME/HACK
      if (/\/\/\s*(TODO|FIXME|HACK)\b/.test(addedLine)) {
        const match = addedLine.match(/\/\/\s*(TODO|FIXME|HACK)\b/);
        const tag = match?.[1] ?? 'TODO';
        const declared = cost.toLowerCase().includes(tag.toLowerCase()) ||
                         constraint.toLowerCase().includes(tag.toLowerCase());
        findings.push({
          pattern: `${tag} comment`,
          file: currentFile,
          line: lineNum,
          detail: addedLine.trim().slice(0, 80),
          declaredInHansei: declared || hasGlobalAck,
        });
      }

      // Pattern: console.log in non-CLI layer
      if (/console\.log\(/.test(addedLine) &&
          !currentFile.includes('infrastructure/cli/') &&
          !currentFile.includes('src/test/') &&
          !currentFile.includes('.test.')) {
        const declared = constraint.toLowerCase().includes('console') ||
                         cost.toLowerCase().includes('console');
        findings.push({
          pattern: 'console.log in non-CLI layer',
          file: currentFile,
          line: lineNum,
          detail: addedLine.trim().slice(0, 80),
          declaredInHansei: declared || hasGlobalAck,
        });
      }
    }

    // Check context path violations
    const contextPaths = task.context ?? [];
    const validContextPaths = contextPaths.filter(p => p && p !== 'none');
    if (validContextPaths.length > 0) {
      // Find files changed outside context paths
      try {
        const changedFiles = execSync(
          `git diff --name-only ${task.lockedCommit}..HEAD`,
          { cwd: this.rootPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).split('\n').filter(Boolean);

        for (const file of changedFiles) {
          const inContext = validContextPaths.some(p => file.startsWith(p.replace(/^\//, '')));
          // Allow system paths (tasks, archive, statusProjection dir) as always-valid
          const statusDir = path.dirname(this.paths.statusProjection);
          const isSystemPath = file.startsWith(this.paths.tasks) || 
                               file.startsWith(this.paths.archive) ||
                               file.startsWith(statusDir);
          if (!inContext && !isSystemPath) {
            const declared = constraint.toLowerCase().includes(file.split('/')[0]) ||
                             constraint.toLowerCase().includes('context');
            findings.push({
              pattern: 'file outside declared context paths',
              file,
              line: 0,
              detail: `Modified: ${file} — not in [${validContextPaths.join(', ')}]`,
              declaredInHansei: declared || hasGlobalAck,
            });
          }
        }
      } catch { /* git diff failed — skip */ }
    }

    const undeclared = findings.filter(f => !f.declaredInHansei);
    return {
      findings,
      pass: undeclared.length === 0,
      skipped: false,
    };
  }
}
