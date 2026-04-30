import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { GitRepository } from '../../domain/repositories/git-repository.js';

const execAsync = promisify(exec);

export class GitCli implements GitRepository {
  async getDiff(args: string[] = []): Promise<string> {
    try {
      const argsStr = args.length > 0 ? ` ${args.join(' ')}` : ' HEAD';
      const { stdout } = await execAsync(`git diff${argsStr}`);
      return stdout;
    } catch {
      return '';
    }
  }

  async getLastCommitMessage(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git log -1 --pretty=%B');
      return stdout.trim();
    } catch {
      return null;
    }
  }

  async getCurrentBranch(): Promise<string> {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD');
    return stdout.trim();
  }

  async getStatusLines(): Promise<string[]> {
    const { stdout } = await execAsync('git status --short --untracked-files=all');
    return stdout
      .split('\n')
      .map(line => line.trimEnd())
      .filter(Boolean);
  }

  async getLog(limit: number): Promise<string[]> {
    const { stdout: stdoutDelimited } = await execAsync(`git log -n ${limit} --pretty=format:"%B%x00"`);
    return stdoutDelimited.split('\0').filter(msg => msg.trim().length > 0);
  }

  async add(path: string): Promise<void> {
    await execAsync(`git add "${path}"`);
  }

  async rm(path: string): Promise<void> {
    await execAsync(`git rm "${path}"`);
  }

  async mv(oldPath: string, newPath: string): Promise<void> {
    await execAsync(`git mv "${oldPath}" "${newPath}"`);
  }

  async commit(message: string): Promise<void> {
    // Escape single quotes in message
    const escapedMessage = message.replace(/'/g, "'\\''");
    await execAsync(`git commit -m '${escapedMessage}'`);
  }

  async getFileLastModifiedDate(path: string): Promise<Date | null> {
    try {
      const { stdout } = await execAsync(`git log -1 --format=%cI -- ${path}`);
      const dateStr = stdout.trim();
      return dateStr ? new Date(dateStr) : new Date();
    } catch {
      return new Date();
    }
  }
}
