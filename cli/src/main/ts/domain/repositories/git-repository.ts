export interface GitRepository {
  getDiff(): Promise<string>;
  getLastCommitMessage(): Promise<string | null>;
  getCurrentBranch(): Promise<string>;
}
