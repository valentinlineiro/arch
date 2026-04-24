import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { GitRepository } from '../../domain/repositories/git-repository.js';

const execAsync = promisify(exec);

export class GitCli implements GitRepository {
  async getDiff(): Promise<string> {
    const { stdout } = await execAsync('git diff HEAD');
    return stdout;
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
}
