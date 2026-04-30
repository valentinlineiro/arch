import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export class ConductCommand {
  async execute(args: string[]): Promise<void> {
    const promptFile = 'docs/agents/THINK.md';
    const extraFlags = args.join(' ');
    
    console.log('  ARCH — invoking CONDUCTOR (THINK) mode');
    
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
          process.exit(result.status ?? 0);
        } catch (e) {
          // Try next CLI
        }
      }
      
      console.log('  Note: No AI CLI detected or invocation failed. Showing protocol:');
      console.log(fs.readFileSync(promptFile, 'utf8'));
      process.exit(1);
    } catch (e: any) {
      console.error('Error in ConductCommand:', e.message);
      process.exit(1);
    }
  }
}
