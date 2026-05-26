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
    // Use range-based rev-list to only check recent history.
    const result = await SubprocessRunner.runWithOutput('git', ['rev-list', '--merges', `HEAD~${limit}..HEAD`]);
    
    if (result.code === 0) {
      return result.stdout.split('\n').map(line => line.trim()).filter(Boolean);
    }

    // Fallback for short history: check everything from root
    const fallback = await SubprocessRunner.runWithOutput('git', ['rev-list', '--merges', 'HEAD']);
    return fallback.stdout.split('\n').map(line => line.trim()).filter(Boolean);
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

  async getLastCommitHash(): Promise<string | null> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['rev-parse', '--short', 'HEAD']);
    return code === 0 ? stdout.trim() : null;
  }

  async getCommitCountBetween(fromHash: string, toRef: string = 'HEAD'): Promise<number | null> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', [
      'rev-list', '--count', `${fromHash}..${toRef}`
    ]);
    if (code !== 0) return null;
    const count = parseInt(stdout.trim(), 10);
    return isNaN(count) ? null : count;
  }

  async isValidCommitHash(hash: string): Promise<boolean> {
    const { code } = await SubprocessRunner.runWithOutput('git', ['rev-parse', '--verify', `${hash}^{commit}`]);
    return code === 0;
  }

  async getCommitAuthor(hash: string): Promise<string | null> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['show', '-s', '--format=%an', hash]);
    return code === 0 ? stdout.trim() : null;
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
    files: Array<{ path: string; status: string; oldPath?: string }>;
  }>> {
    const DELIM = '\x1f';
    const { stdout, stderr, code } = await SubprocessRunner.runWithOutput('git', [
      'log',
      '--no-merges',
      `--format=%h${DELIM}%s${DELIM}%cI`,
      '--name-status',
      '-n', limit.toString(),
    ]);
    if (code !== 0) {
      throw new Error(`git log failed: ${stderr.trim() || `exit code ${code}`}`);
    }
    if (!stdout.trim()) return [];

    const commits: Array<{ hash: string; message: string; date: string; files: Array<{ path: string; status: string; oldPath?: string }> }> = [];
    const lines = stdout.split('\n');
    let currentCommit: { hash: string; message: string; date: string; files: Array<{ path: string; status: string; oldPath?: string }> } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.includes(DELIM)) {
        const parts = trimmed.split(DELIM);
        if (parts.length >= 3) {
          if (currentCommit) commits.push(currentCommit);
          currentCommit = {
            hash: parts[0],
            date: parts[parts.length - 1],
            message: parts.slice(1, -1).join(DELIM),
            files: []
          };
          continue;
        }
      }

      if (currentCommit) {
        const parts = trimmed.split(/\s+/);
        const status = parts[0];
        if (status.startsWith('R') || status.startsWith('C')) {
          currentCommit.files.push({ status, oldPath: parts[1], path: parts[2] });
        } else {
          currentCommit.files.push({ status, path: parts[parts.length - 1] });
        }
      }
    }
    if (currentCommit) commits.push(currentCommit);
    return commits;
  }
}
