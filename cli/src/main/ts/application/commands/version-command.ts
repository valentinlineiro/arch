import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class VersionCommand {
  constructor(private version: string) {}

  async execute(): Promise<void> {
    console.log(`v${this.version}`);
  }
}
