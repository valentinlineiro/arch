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

  async getMergeCommits(limit: number): Promise<string[]> {
    const { stdout } = await SubprocessRunner.runWithOutput('git', ['rev-list', '--merges', `HEAD~${limit}..HEAD`]);
    return stdout.split('\n').map(line => line.trim()).filter(Boolean);
  }

  async getStagedFiles(): Promise<string[]> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['diff', '--cached', '--name-only']);
    if (code !== 0) return [];
    return stdout.split('\n').map(s => s.trim()).filter(Boolean);
  }

  async getModifiedFiles(): Promise<string[]> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['diff', '--name-only']);
    if (code !== 0) return [];
    return stdout.split('\n').map(s => s.trim()).filter(Boolean);
  }

  async getRepoRoot(): Promise<string> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['rev-parse', '--show-toplevel']);
    if (code !== 0) throw new Error('git rev-parse --show-toplevel failed');
    return stdout.trim();
  }

  async getFileFirstCommitDate(path: string): Promise<Date | null> {
    try {
      // --diff-filter=A only shows the addition of the file.
      // --follow ensures we find it even if it was moved (archived).
      const { stdout } = await SubprocessRunner.runWithOutput('git', ['log', '--diff-filter=A', '--follow', '--format=%cI', '--', path]);
      const lines = stdout.trim().split('\n').filter(Boolean);
      const dateStr = lines[lines.length - 1]; // Earliest commit is at the bottom of the log
      return dateStr ? new Date(dateStr) : null;
    } catch {
      return null;
    }
  }

  async getCommitHistory(limit = 500): Promise<Array<{
    hash: string;
    message: string;
    date: string;
    files: string[];
  }>> {
    const { stdout, stderr, code } = await SubprocessRunner.runWithOutput('git', [
      'log',
      '--no-merges',
      '--format=%h|%s|%cI',
      '--name-only',
      '-n', limit.toString(),
    ]);
    if (code !== 0) {
      throw new Error(`git log failed: ${stderr.trim() || `exit code ${code}`}`);
    }
    if (!stdout.trim()) return [];

    const commits: Array<{ hash: string; message: string; date: string; files: string[] }> = [];
    const blocks = stdout.split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.trim().split('\n').filter(Boolean);
      if (lines.length === 0) continue;
      const headerLine = lines[0];
      const parts = headerLine.split('|');
      if (parts.length < 3) continue;
      const hash = parts[0].trim();
      const date = parts[parts.length - 1].trim();
      const message = parts.slice(1, -1).join('|').trim();
      const files = lines.slice(1).map(l => l.trim()).filter(Boolean);
      commits.push({ hash, message, date, files });
    }
    return commits;
  }
}
