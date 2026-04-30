import { spawn, spawnSync } from 'node:child_process';

export interface SubprocessResult {
  code: number;
  stdout: string;
  stderr: string;
}

export class SubprocessRunner {
  /**
   * Runs a command and inherits stdio (visible to user).
   * Resolves Node.js DEP0190 by using spawn with an array of arguments.
   */
  static async run(command: string, args: string[], options: { cwd?: string; verbose?: boolean } = {}): Promise<number> {
    const stdio = options.verbose ? 'inherit' : 'pipe';
    
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio,
        cwd: options.cwd ?? process.cwd(),
      });

      if (stdio === 'pipe') {
        child.stdout?.on('data', (data) => {
          process.stdout.write(data);
        });
        child.stderr?.on('data', (data) => {
          process.stderr.write(data);
        });
      }

      child.on('close', (code) => {
        resolve(code ?? 0);
      });
    });
  }

  /**
   * Runs a command and captures its output.
   */
  static async runWithOutput(command: string, args: string[], options: { cwd?: string; stream?: boolean } = {}): Promise<SubprocessResult> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        cwd: options.cwd ?? process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (options.stream) {
          process.stdout.write(data);
        }
      });
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (options.stream) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        resolve({
          code: code ?? 0,
          stdout,
          stderr,
        });
      });
    });
  }

  /**
   * Synchronous version for simple commands.
   */
  static runSync(command: string, args: string[], options: { cwd?: string } = {}): number {
    const result = spawnSync(command, args, {
      stdio: 'inherit',
      cwd: options.cwd ?? process.cwd(),
    });
    return result.status ?? 0;
  }
}
