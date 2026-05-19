import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export type PredicateType = 'cmd' | 'file' | 'grep' | 'prose' | 'missing';

export interface AcPredicateResult {
  ac: string;
  type: PredicateType;
  command?: string;
  expectedExit?: number;
  actualExit?: number;
  passed: boolean;
  timedOut?: boolean;
  reason?: string;
}

export interface ValidateAcsResult {
  taskId: string;
  results: AcPredicateResult[];
  allPassed: boolean;
}

const CMD_REGEX = /→\s+cmd:\s+(.+?);\s+exit:\s+(\d+)/;
const FILE_REGEX = /→\s+file:\s+(.+)/;
const GREP_REGEX = /→\s+grep:\s+"(.+?)"\s+(.+)/;
const PROSE_REGEX = /→\s+prose:\s+(.+)/;

export class ValidateTaskAcs {
  constructor(private rootPath: string, private timeoutMs: number = 30000) {}

  private extractACSections(content: string): string {
    const sections: string[] = [];
    for (const heading of ['### Acceptance Criteria', '### Definition of Done']) {
      const start = content.indexOf(heading);
      if (start === -1) continue;
      const bodyStart = content.indexOf('\n', start) + 1;
      const end = content.indexOf('\n### ', bodyStart);
      sections.push(end === -1 ? content.slice(bodyStart) : content.slice(bodyStart, end));
    }
    return sections.length > 0 ? sections.join('\n') : content;
  }

  execute(taskContent: string, taskId: string): ValidateAcsResult {
    const results: AcPredicateResult[] = [];
    const acContent = this.extractACSections(taskContent);

    for (const line of acContent.split('\n')) {
      if (!line.match(/^- \[.\] /)) continue;

      const ac = line.replace(/^- \[.\] /, '').split('→')[0].trim();
      
      const cmdMatch = line.match(CMD_REGEX);
      const fileMatch = line.match(FILE_REGEX);
      const grepMatch = line.match(GREP_REGEX);
      const proseMatch = line.match(PROSE_REGEX);

      if (cmdMatch) {
        const [, command, exitCodeStr] = cmdMatch;
        const expectedExit = parseInt(exitCodeStr, 10);
        
        const result = spawnSync('sh', ['-c', command.trim()], {
          cwd: this.rootPath,
          encoding: 'utf8',
          timeout: this.timeoutMs,
          maxBuffer: Infinity,
          env: { ...process.env, PATH: `${this.rootPath}/scripts:${process.env.PATH ?? ''}` },
        });

        const timedOut = result.error?.code === 'ETIMEDOUT';
        const actualExit = timedOut ? -1 : (result.status ?? 1);

        results.push({
          ac,
          type: 'cmd',
          command: command.trim(),
          expectedExit,
          actualExit,
          passed: !timedOut && actualExit === expectedExit,
          timedOut,
        });
      } else if (fileMatch) {
        const filePath = fileMatch[1].trim();
        const fullPath = filePath.startsWith('/') ? filePath : `${this.rootPath}/${filePath}`;
        const exists = fs.existsSync(fullPath);
        results.push({
          ac,
          type: 'file',
          command: `file: ${filePath}`,
          passed: exists,
          reason: exists ? undefined : `File not found: ${filePath}`
        });
      } else if (grepMatch) {
        const [, pattern, filePath] = grepMatch;
        const fullPath = filePath.trim().startsWith('/') ? filePath.trim() : `${this.rootPath}/${filePath.trim()}`;
        let passed = false;
        let reason: string | undefined;
        
        if (!fs.existsSync(fullPath)) {
          passed = false;
          reason = `File not found: ${filePath.trim()}`;
        } else {
          const grepResult = spawnSync('grep', [pattern, fullPath], { encoding: 'utf8' });
          passed = grepResult.status === 0;
          reason = passed ? undefined : `Pattern "${pattern}" not found in ${filePath.trim()}`;
        }
        
        results.push({
          ac,
          type: 'grep',
          command: `grep: "${pattern}" ${filePath.trim()}`,
          passed,
          reason
        });
      } else if (proseMatch) {
        results.push({
          ac,
          type: 'prose',
          command: `prose: ${proseMatch[1].trim()}`,
          passed: true
        });
      } else {
        // Missing predicate or marker
        results.push({
          ac,
          type: 'missing',
          passed: false,
          reason: 'No predicate or prose: marker found'
        });
      }
    }

    return { taskId, results, allPassed: results.every(r => r.passed) };
  }
}
