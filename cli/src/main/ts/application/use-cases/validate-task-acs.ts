import { spawnSync } from 'node:child_process';

export interface AcPredicateResult {
  ac: string;
  command: string;
  expectedExit: number;
  actualExit: number;
  passed: boolean;
}

export interface ValidateAcsResult {
  taskId: string;
  results: AcPredicateResult[];
  allPassed: boolean;
}

const PREDICATE_REGEX = /→\s+cmd:\s+(.+?);\s+exit:\s+(\d+)/;

export class ValidateTaskAcs {
  constructor(private rootPath: string) {}

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
        timeout: 30000,
      });

      results.push({
        ac,
        command: command.trim(),
        expectedExit,
        actualExit: result.status ?? 1,
        passed: (result.status ?? 1) === expectedExit,
      });
    }

    return { taskId, results, allPassed: results.every(r => r.passed) };
  }
}
