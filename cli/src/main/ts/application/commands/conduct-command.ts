import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export class ConductCommand implements Command {
  async execute(args: string[]): Promise<number> {
    const promptFile = 'docs/agents/THINK.md';
    const extraFlags = args.join(' ');
    
    fmt.log('  ARCH — invoking CONDUCTOR (THINK) mode');
    
    try {
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const clis = config.clis || [];
      
      for (const cli of clis) {
        try {
          // Check if binary exists in PATH
          const which = spawnSync('which', [cli.bin]);
          if (which.status !== 0) continue;
          
          let cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${promptFile})`);
          if (extraFlags) {
            cmd += ` ${extraFlags}`;
          }
          
          const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
          return result.status ?? 0;
        } catch (e) {
          // Try next CLI
        }
      }
      
      fmt.log('  Note: No AI CLI detected or invocation failed. Showing protocol:');
      fmt.log(fs.readFileSync(promptFile, 'utf8'));
      return 1;
    } catch (e: any) {
      fmt.error('Error in ConductCommand:', e.message);
      return 1;
    }
  }
}
