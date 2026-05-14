import { FileSystem } from '../../../main/ts/domain/repositories/file-system.js';
import { GitRepository } from '../../../main/ts/domain/repositories/git-repository.js';

export class MockFileSystem implements FileSystem {
  files: Record<string, string> = {};
  dirs: Record<string, string[]> = {};
  written: Record<string, string> = {};

  async readFile(path: string): Promise<string> {
    if (!(path in this.files)) throw new Error(`File not found: ${path}`);
    return this.files[path];
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files[path] = content;
    this.written[path] = content;
  }

  async exists(path: string): Promise<boolean> {
    return path in this.files || path in this.dirs;
  }

  async readDirectory(path: string): Promise<string[]> {
    return this.dirs[path] ?? [];
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (oldPath in this.files) {
      this.files[newPath] = this.files[oldPath];
      delete this.files[oldPath];
    }
  }

  async mkdir(_path: string): Promise<void> {}

  async appendFile(path: string, content: string): Promise<void> {
    this.files[path] = (this.files[path] ?? '') + content;
  }

  async deleteFile(path: string): Promise<void> {
    delete this.files[path];
  }
}

export type CommitRecord = {
  hash: string;
  message: string;
  date: string;
  files: Array<{ path: string; status: string; oldPath?: string }>;
};

export class MockGitRepository implements GitRepository {
  commits: CommitRecord[] = [];
  validHashes = new Set<string>();
  diff = '';
  lastCommitMessage: string | null = null;
  currentBranch = 'main';
  statusLines: string[] = [];
  changedFilesInLastCommit: string[] = [];
  addedFiles: string[] = [];
  repoRoot = '';

  async getDiff(_args?: string[]): Promise<string> { return this.diff; }
  async getLastCommitMessage(): Promise<string | null> { return this.lastCommitMessage; }
  async getCurrentBranch(): Promise<string> { return this.currentBranch; }
  async getStatusLines(): Promise<string[]> { return this.statusLines; }
  async getLog(_limit: number): Promise<string[]> { return []; }
  async add(path: string): Promise<void> { this.addedFiles.push(path); }
  async rm(_path: string): Promise<void> {}
  async mv(_oldPath: string, _newPath: string): Promise<void> {}
  async commit(_message: string): Promise<void> {}
  async getFileLastModifiedDate(_path: string): Promise<Date | null> { return new Date(); }
  async getChangedFilesInLastCommit(): Promise<string[]> { return this.changedFilesInLastCommit; }
  async getMergeCommits(_limit: number): Promise<string[]> { return []; }
  async getStagedFiles(): Promise<string[]> { return []; }
  async getModifiedFiles(): Promise<string[]> { return []; }
  async getRepoRoot(): Promise<string> { return this.repoRoot; }
  async getFileFirstCommitDate(_path: string): Promise<Date | null> { return null; }
  async getLastCommitHash(): Promise<string | null> { return 'abc'; }
  async isValidCommitHash(hash: string): Promise<boolean> { return this.validHashes.has(hash); }
  async getCommitAuthor(_hash: string): Promise<string | null> { return 'test-user'; }
  async getCommitHistory(_limit?: number): Promise<CommitRecord[]> { return this.commits; }
}
