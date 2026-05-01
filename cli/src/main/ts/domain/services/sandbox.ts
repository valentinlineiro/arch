import vm from 'node:vm';
import { execSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

export interface SandboxOptions {
  timeout?: number;
  cwd?: string;
  privileged?: boolean;
}

export interface SandboxResult {
  stdout: string;
  stderr: string;
  status: number | null;
  duration: number;
}

export class SandboxService {
  private static ALLOWLIST = ['test', 'grep', 'jq', 'node', 'git'];
  private static DEFAULT_TIMEOUT = 30000;

  /**
   * Executes JavaScript code in an isolated VM context.
   */
  executeJs(code: string, options: SandboxOptions = {}): any {
    const timeout = options.timeout ?? SandboxService.DEFAULT_TIMEOUT;
    const start = performance.now();
    
    const context = vm.createContext({});
    const script = new vm.Script(code);
    
    try {
      const result = script.runInContext(context, { timeout });
      const duration = performance.now() - start;
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      throw { error, duration };
    }
  }

  /**
   * Executes a shell command with an allowlist and timeout.
   */
  executeCommand(command: string, args: string[], options: SandboxOptions = {}): SandboxResult {
    const start = performance.now();
    const privileged = options.privileged ?? false;
    const timeout = options.timeout ?? SandboxService.DEFAULT_TIMEOUT;
    const cwd = options.cwd ?? os.tmpdir();

    // Sentinel check: Allowlist validation for non-privileged execution
    if (!privileged) {
      if (!SandboxService.ALLOWLIST.includes(command)) {
        throw new Error(`Command '${command}' is not in the sandbox allowlist.`);
      }
      
      if (command === 'git' && args.length > 0 && args[0] !== 'status') {
         throw new Error(`Subcommand 'git ${args[0]}' is not allowed in unprivileged mode.`);
      }
    }

    const result = spawnSync(command, args, {
      cwd,
      timeout,
      encoding: 'utf-8',
      shell: false,
    });

    const duration = performance.now() - start;

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.status,
      duration,
    };
  }
}
