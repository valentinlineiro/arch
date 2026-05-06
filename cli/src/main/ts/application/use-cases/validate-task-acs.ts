import { spawnSync } from 'node:child_process';

export interface AcPredicateResult {
  ac: string;
  command: string;
  expectedExit: number;
  actualExit: number;
  passed: boolean;
  timedOut: boolean;
}

export interface ValidateAcsResult {
  taskId: string;
  results: AcPredicateResult[];
  allPassed: boolean;
}

const PREDICATE_REGEX = /→\s+cmd:\s+(.+?);\s+exit:\s+(\d+)/;

export class ValidateTaskAcs {
  constructor(private rootPath: string, private timeoutMs: number = 30000) {}

  execute(taskContent: string, taskId: string): ValidateAcsResult {
    const results: AcPredicateResult[] = [];

    for (const line of taskContent.split('\n')) {
      if (!line.match(/^- \[.\] /)) continue;
      const predicateMatch = line.match(PREDICATE_REGEX);
      if (!predicateMatch) continue;

      const [, command, exitCodeStr] = predicateMatch;
      const expectedExit = parseInt(exitCodeStr, 10);
      const ac = line.replace(/^- \[.\] /, '').split('→')[0].trim();

      const result = spawnSync('sh', ['-c', command.trim()], {
        cwd: this.rootPath,
        encoding: 'utf8',
        timeout: this.timeoutMs,
        env: { ...process.env, PATH: `${this.rootPath}/scripts:${process.env.PATH ?? ''}` },
      });

      const timedOut = result.error?.code === 'ETIMEDOUT';
      const actualExit = timedOut ? -1 : (result.status ?? 1);

      results.push({
        ac,
        command: command.trim(),
        expectedExit,
        actualExit,
        passed: !timedOut && actualExit === expectedExit,
        timedOut,
      });
    }

    return { taskId, results, allPassed: results.every(r => r.passed) };
  }
}
