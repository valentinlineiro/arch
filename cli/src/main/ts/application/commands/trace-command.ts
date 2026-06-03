// CausalGraph and CausalArbitrator removed (TASK-1103)
// arch trace now returns a deprecation notice
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class TraceCommand {
  async execute(_args: string[]): Promise<number> {
    fmt.log('\n  \x1b[32mARCH\x1b[0m — arch trace\n');
    fmt.log('  The causal graph machinery has been removed (TASK-1103).');
    fmt.log('  Use arch corpus ask to query task relationships.\n');
    return 0;
  }
}
