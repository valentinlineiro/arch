import { Command } from '../../domain/models/command.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class VersionCommand implements Command {
  constructor(private version: string) {}

  async execute(): Promise<number> {
    fmt.log(`v${this.version}`);
    return 0;
  }
}
