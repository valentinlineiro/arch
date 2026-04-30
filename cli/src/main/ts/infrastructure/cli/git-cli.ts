import { GitRepository } from '../../domain/repositories/git-repository.js';
import { SubprocessRunner } from './subprocess-runner.js';

export class GitCli implements GitRepository {
  async getDiff(args: string[] = []): Promise<string> {
    const finalArgs = ['diff', ...(args.length > 0 ? args : ['HEAD'])];
    const { stdout } = await SubprocessRunner.runWithOutput('git', finalArgs);
    return stdout;
  }

  async getLastCommitMessage(): Promise<string | null> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['log', '-1', '--pretty=%B']);
    return code === 0 ? stdout.trim() : null;
  }

  async getCurrentBranch(): Promise<string> {
    const { stdout } = await SubprocessRunner.runWithOutput('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.trim();
  }

  async getStatusLines(): Promise<string[]> {
    const { stdout } = await SubprocessRunner.runWithOutput('git', ['status', '--short', '--untracked-files=all']);
    return stdout
      .split('\n')
      .map(line => line.trimEnd())
      .filter(Boolean);
  }

  async getLog(limit: number): Promise<string[]> {
    const { stdout } = await SubprocessRunner.runWithOutput('git', ['log', '-n', limit.toString(), '--pretty=format:%B%x00']);
    return stdout.split('\0').filter(msg => msg.trim().length > 0);
  }

  async add(path: string): Promise<void> {
    await SubprocessRunner.runWithOutput('git', ['add', path]);
  }

  async rm(path: string): Promise<void> {
    await SubprocessRunner.runWithOutput('git', ['rm', path]);
  }

  async mv(oldPath: string, newPath: string): Promise<void> {
    await SubprocessRunner.runWithOutput('git', ['mv', oldPath, newPath]);
  }

  async commit(message: string): Promise<void> {
    await SubprocessRunner.runWithOutput('git', ['commit', '-m', message]);
  }

  async getFileLastModifiedDate(path: string): Promise<Date | null> {
    try {
      const { stdout } = await SubprocessRunner.runWithOutput('git', ['log', '-1', '--format=%cI', '--', path]);
      const dateStr = stdout.trim();
      return dateStr ? new Date(dateStr) : new Date();
    } catch {
      return new Date();
    }
  }

  async getChangedFilesInLastCommit(): Promise<string[]> {
    try {
      const { stdout } = await SubprocessRunner.runWithOutput('git', ['diff', '--name-only', 'HEAD~1', 'HEAD']);
      return stdout.split('\n').map(line => line.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
}
