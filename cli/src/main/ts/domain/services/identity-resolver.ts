import { createHash } from 'crypto';

export type NodeType = 'Commit' | 'Issue' | 'PR' | 'File' | 'Module' | 'Contributor';

export class IdentityResolver {
  /**
   * Generates a stable, canonical ID for any node in the traceability graph.
   * Format: type:sha256(stable_external_id)
   */
  static resolve(type: NodeType, externalId: string, context?: { repoId?: string }): string {
    const normalizedId = externalId.toLowerCase().trim();
    
    // For local-scoped IDs (like local file paths or relative issue numbers), 
    // we must include a repository context to avoid collisions in multi-repo audits.
    const uniqueSource = context?.repoId 
      ? `${context.repoId}:${normalizedId}`
      : normalizedId;

    const hash = createHash('sha256').update(`${type}:${uniqueSource}`).digest('hex').slice(0, 16);
    return `${type.toLowerCase()}:${hash}`;
  }

  /**
   * Specific resolver for Contributors to normalize across Git emails and GitHub usernames.
   */
  static resolveContributor(gitEmail?: string, githubUsername?: string): string {
    const id = githubUsername || gitEmail || 'unknown';
    return this.resolve('Contributor', id);
  }

  /**
   * Normalizes file paths and derives modules deterministically.
   */
  static resolveFile(path: string, repoId: string): string {
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\.\//, '');
    return this.resolve('File', normalizedPath, { repoId });
  }
}
