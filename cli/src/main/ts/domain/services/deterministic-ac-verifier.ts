import { execSync, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import type { Task } from '../models/task.js';

export type VerificationType = 'cmd' | 'file' | 'file-contains' | 'not-file' | 'test' | 'prose' | 'code' | 'unknown';

export interface ACEvidence {
  ac: string;
  type: VerificationType;
  pass: boolean;
  detail: string;
}

export interface VerificationResult {
  pass: boolean;
  evidence: ACEvidence[];
}

// Predicate lines: indented sub-lines starting with `- \`type: ...\``
// We match only lines that are standalone predicate declarations, not inline references
const CMD_PATTERN = /^\s*-\s+`cmd:\s*([^`]+?)(?:;\s*exit:\s*(\d+))?`/im;
const FILE_PATTERN = /^\s*-\s+`file:\s*([^`]+?)`/im;
const FILE_CONTAINS_PATTERN = /^\s*-\s+`file-contains:\s*([^`\s]+)\s+"([^"]+)"`/im;
const NOT_FILE_PATTERN = /^\s*-\s+`not-file:\s*([^`]+?)`/im;
const TEST_PATTERN = /^\s*-\s+`test:\s*([^`]*?)`/im;
const PROSE_PATTERN = /^\s*-\s+`prose:\s*([^`]*?)`/im;
const CODE_PATTERN = /^\s*-\s+`code:\s*([^`]*?)`/im;

export class DeterministicACVerifier {
  constructor(private rootPath: string = '.') {}

  async verify(task: Task): Promise<VerificationResult> {
    const evidence: ACEvidence[] = [];

    const acSection = this.extractACSection(task.content);
    if (!acSection) return { pass: true, evidence: [] };

    const acLines = this.parseACLines(acSection);
    for (const ac of acLines) {
      const ev = await this.verifyAC(ac);
      evidence.push(ev);
    }

    const pass = evidence.every(e => e.pass);
    return { pass, evidence };
  }

  async verifySection(content: string): Promise<VerificationResult> {
    const evidence: ACEvidence[] = [];
    const acLines = this.parseACLines(content);

    for (const ac of acLines) {
      let ev = await this.verifyAC(ac);
      // For prose/unknown predicates, checkbox state is authoritative in section mode
      if (ev.type === 'prose' || ev.type === 'unknown') {
        const checked = ac.startsWith('- [x]');
        ev = { ...ev, pass: checked, detail: checked ? `${ev.type}: checkbox checked` : `${ev.type}: checkbox unchecked` };
      }
      evidence.push(ev);
    }

    const pass = evidence.length > 0 && evidence.every(e => e.pass);
    return { pass, evidence };
  }

  private extractACSection(content: string | undefined): string | null {
    if (!content) return null;
    const start = content.indexOf('### Acceptance Criteria');
    if (start === -1) return null;
    const bodyStart = content.indexOf('\n', start) + 1;
    const end = content.indexOf('\n### ', bodyStart);
    return end === -1 ? content.slice(bodyStart) : content.slice(bodyStart, end);
  }

  private parseACLines(section: string): string[] {
    // Collect AC lines plus their predicate sub-lines (indented `cmd:` etc.)
    const lines = section.split('\n');
    const acs: string[] = [];
    let current = '';

    for (const line of lines) {
      const isAC = /^- \[(x| )\]/.test(line);
      const isPredicate = /^\s+- `(cmd|file|file-contains|not-file|test|prose|code):/.test(line);

      if (isAC) {
        if (current) acs.push(current);
        current = line;
      } else if (isPredicate && current) {
        current += '\n' + line;
      }
    }
    if (current) acs.push(current);
    return acs;
  }

  private async verifyAC(ac: string): Promise<ACEvidence> {
    const label = ac.split('\n')[0].replace(/^- \[(x| )\]\s*/, '').trim();

    // cmd: strategy
    const cmdMatch = ac.match(CMD_PATTERN);
    if (cmdMatch) {
      return this.verifyCmd(label, cmdMatch[1].trim(), parseInt(cmdMatch[2] ?? '0', 10));
    }

    // file: strategy
    const fileMatch = ac.match(FILE_PATTERN);
    if (fileMatch) {
      return this.verifyFile(label, fileMatch[1].trim());
    }

    // file-contains: strategy
    const fileContainsMatch = ac.match(FILE_CONTAINS_PATTERN);
    if (fileContainsMatch) {
      return this.verifyFileContains(label, fileContainsMatch[1].trim(), fileContainsMatch[2].trim());
    }

    // not-file: strategy
    const notFileMatch = ac.match(NOT_FILE_PATTERN);
    if (notFileMatch) {
      return this.verifyNotFile(label, notFileMatch[1].trim());
    }

    // test: strategy
    const testMatch = ac.match(TEST_PATTERN);
    if (testMatch) {
      return this.verifyTest(label, testMatch[1].trim());
    }

    // prose: strategy — checkbox only, non-automated
    const proseMatch = ac.match(PROSE_PATTERN);
    if (proseMatch) {
      return { ac: label, type: 'prose', pass: true, detail: 'prose: human-verified (non-automated)' };
    }

    // code: strategy — reader-verified
    const codeMatch = ac.match(CODE_PATTERN);
    if (codeMatch) {
      return { ac: label, type: 'code', pass: true, detail: `code: reader-verified — ${codeMatch[1].trim()}` };
    }

    // No predicate declared — treat as prose
    return { ac: label, type: 'unknown', pass: true, detail: 'no predicate declared — treated as prose' };
  }

  private verifyCmd(ac: string, command: string, expectedExit: number): ACEvidence {
    // Defense in Depth: Prevent infinite recursion or constitutional violations
    if (command.includes('arch review')) {
      return { ac, type: 'cmd', pass: false, detail: 'Constitutional Violation: arch review cannot be used as a cmd: predicate (infinite recursion risk). Use arch check instead.' };
    }

    try {
      execSync(command, { cwd: this.rootPath, stdio: 'pipe', timeout: 30_000 });
      const actualExit = 0;
      const pass = actualExit === expectedExit;
      return { ac, type: 'cmd', pass, detail: pass ? `exit 0 (expected ${expectedExit})` : `exit 0 but expected ${expectedExit}` };
    } catch (err: any) {
      const actualExit = err.status ?? 1;
      const pass = actualExit === expectedExit;
      const stdout = (err.stdout ?? '').toString().slice(0, 200);
      const stderr = (err.stderr ?? '').toString().slice(0, 200);
      const detail = pass
        ? `exit ${actualExit} (expected ${expectedExit})`
        : `exit ${actualExit} (expected ${expectedExit})\nstdout: ${stdout}\nstderr: ${stderr}`;
      return { ac, type: 'cmd', pass, detail };
    }
  }

  private verifyFile(ac: string, filePath: string): ACEvidence {
    const fullPath = filePath.startsWith('/') ? filePath : `${this.rootPath}/${filePath}`;
    const pass = existsSync(fullPath);
    return { ac, type: 'file', pass, detail: pass ? `exists: ${filePath}` : `missing: ${filePath}` };
  }

  private verifyFileContains(ac: string, filePath: string, pattern: string): ACEvidence {
    const fullPath = filePath.startsWith('/') ? filePath : `${this.rootPath}/${filePath}`;
    if (!existsSync(fullPath)) {
      return { ac, type: 'file-contains', pass: false, detail: `missing: ${filePath}` };
    }
    const content = readFileSync(fullPath, 'utf8');
    const pass = content.includes(pattern);
    return { ac, type: 'file-contains', pass, detail: pass ? `found: "${pattern}" in ${filePath}` : `not found: "${pattern}" in ${filePath}` };
  }

  private verifyNotFile(ac: string, filePath: string): ACEvidence {
    const fullPath = filePath.startsWith('/') ? filePath : `${this.rootPath}/${filePath}`;
    const pass = !existsSync(fullPath);
    return { ac, type: 'not-file', pass, detail: pass ? `absent: ${filePath}` : `exists (expected absent): ${filePath}` };
  }

  private verifyTest(ac: string, dir: string): ACEvidence {
    const cwd = dir ? `${this.rootPath}/${dir}` : this.rootPath;
    try {
      execSync('npm test', { cwd, stdio: 'pipe', timeout: 120_000 });
      return { ac, type: 'test', pass: true, detail: 'npm test passed' };
    } catch (err: any) {
      const stderr = (err.stderr ?? '').toString().slice(0, 300);
      return { ac, type: 'test', pass: false, detail: `npm test failed\n${stderr}` };
    }
  }
}
