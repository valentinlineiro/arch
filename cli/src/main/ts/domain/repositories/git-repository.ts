export interface GitRepository {
  getDiff(args?: string[]): Promise<string>;
  getLastCommitMessage(): Promise<string | null>;
  getCurrentBranch(): Promise<string>;
  getStatusLines(): Promise<string[]>;
  getLog(limit: number): Promise<string[]>;
  add(path: string): Promise<void>;
  rm(path: string): Promise<void>;
  mv(oldPath: string, newPath: string): Promise<void>;
  commit(message: string): Promise<void>;
  getFileLastModifiedDate(path: string): Promise<Date | null>;
  getChangedFilesInLastCommit(): Promise<string[]>;
  getMergeCommits(limit: number): Promise<string[]>;
  getStagedFiles(): Promise<string[]>;
  getModifiedFiles(): Promise<string[]>;
  getRepoRoot(): Promise<string>;
  getFileFirstCommitDate(path: string): Promise<Date | null>;
  getLastCommitHash(): Promise<string | null>;
  isValidCommitHash(hash: string): Promise<boolean>;
  getCommitAuthor(hash: string): Promise<string | null>;
  getCommitHistory(limit?: number): Promise<Array<{
    hash: string;
    message: string;
    date: string;
    files: Array<{ path: string; status: string; oldPath?: string }>;
  }>>;
}
