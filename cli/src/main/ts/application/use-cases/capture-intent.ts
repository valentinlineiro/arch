import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { Intent, IntentStatus } from '../../domain/models/intent.js';

export class CaptureIntent {
  constructor(
    private intentRepository: IntentRepository,
    private gitRepository: Pick<GitRepository, 'getCurrentBranch' | 'getStagedFiles' | 'getModifiedFiles' | 'getRepoRoot'>,
    private getCwd: () => string = () => process.cwd(),
  ) {}

  async execute(rawIntent: string): Promise<string> {
    if (!rawIntent.trim()) throw new Error('rawIntent cannot be empty');

    const id = await this.intentRepository.getNextId();
    const now = new Date().toISOString();

    let branch: string | undefined;
    let recentFiles: string[] = [];
    const absoluteCwd = this.getCwd();
    let cwd: string = absoluteCwd;

    try {
      branch = await this.gitRepository.getCurrentBranch();
    } catch { /* git unavailable */ }

    try {
      const staged = await this.gitRepository.getStagedFiles();
      const modified = await this.gitRepository.getModifiedFiles();
      const seen = new Set<string>();
      for (const f of [...staged, ...modified]) {
        if (!seen.has(f)) {
          seen.add(f);
          recentFiles.push(f);
        }
      }
    } catch { /* git unavailable */ }

    try {
      const repoRoot = await this.gitRepository.getRepoRoot();
      cwd = absoluteCwd.startsWith(repoRoot)
        ? absoluteCwd.slice(repoRoot.length + 1) || '.'
        : absoluteCwd;
    } catch {
      cwd = absoluteCwd;
    }

    const intent: Intent = {
      id,
      schemaVersion: 1,
      status: IntentStatus.CAPTURED,
      createdAt: now,
      updatedAt: now,
      origin: {
        source: 'cli',
        branch,
        cwd,
        triggeredBy: 'capture',
        recentFiles,
      },
      interpretations: [],
      promotedTo: [],
      supersededBy: [],
      rawIntent: rawIntent.trim(),
    };

    await this.intentRepository.save(intent);
    return id;
  }
}
