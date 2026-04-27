export interface GitRepository {
  getDiff(): Promise<string>;
  getLastCommitMessage(): Promise<string | null>;
  getCurrentBranch(): Promise<string>;
  getStatusLines(): Promise<string[]>;
  add(path: string): Promise<void>;
  commit(message: string): Promise<void>;
}
