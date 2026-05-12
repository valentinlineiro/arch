import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from '../use-cases/reflect-influence-report.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';

export class ReflectCommand {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async execute(args: string[]): Promise<void> {
    const sub = args[0];

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
      'Usage: arch reflect <subcommand>',
      '',
      'Subcommands:',
      '  influence   Epistemic influence report — engagement, attribution, observability gaps',
    ].join('\n'));
  }
}
