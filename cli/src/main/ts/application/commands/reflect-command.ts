import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ReflectInfluenceReport } from '../use-cases/reflect-influence-report.js';

export class ReflectCommand {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async execute(args: string[]): Promise<void> {
    const sub = args[0];

    if (sub === 'influence') {
      const reporter = new ReflectInfluenceReport(this.fileSystem, this.rootPath);
      const report = await reporter.compute();
      console.log(ReflectInfluenceReport.format(report));
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
