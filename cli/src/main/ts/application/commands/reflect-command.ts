import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from '../use-cases/reflect-influence-report.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export class ReflectCommand {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async execute(args: string[]): Promise<void> {
    const sub = args[0];

    if (!sub || sub === 'run') {
      await this.runAnalysis();
      return;
    }

    if (sub === 'influence') {
      const config = await ConfigLoader.load(this.fileSystem);
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        ...(config.reflect?.thresholds ?? {}),
      };
      const reporter = new ReflectInfluenceReport(this.fileSystem, this.rootPath);
      const report = await reporter.compute(thresholds);
      console.log(ReflectInfluenceReport.format(report, thresholds));
      return;
    }

    console.log([
      'Usage: arch reflect [subcommand]',
      '',
      'Subcommands:',
      '  (none)      Run THINK analysis: regenerate INBOX, surface Kaizen, refine ideas, detect drift',
      '  run         Same as no subcommand',
      '  influence   Epistemic influence report — engagement, attribution, observability gaps',
    ].join('\n'));
  }

  private async runAnalysis(): Promise<void> {
    const promptFile = 'docs/agents/THINK.md';
    console.log('  ARCH — arch reflect [analysis]: invoking THINK mode');
    console.log('  Purpose: regenerate INBOX, surface Kaizen, refine ideas, detect semantic drift');
    console.log('  Authority: proposals only — never mutates task state, never satisfies policy gates');

    try {
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const clis = config.clis || [];

      for (const cli of clis) {
        const which = spawnSync('which', [cli.bin]);
        if (which.status !== 0) continue;

        const cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${promptFile})`);
        const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
        process.exit(result.status ?? 0);
      }

      console.log('  Note: No AI CLI detected. Showing THINK protocol:');
      console.log(fs.readFileSync(promptFile, 'utf8'));
      process.exit(1);
    } catch (e: any) {
      console.error('Error in arch reflect:', e.message);
      process.exit(1);
    }
  }
}
