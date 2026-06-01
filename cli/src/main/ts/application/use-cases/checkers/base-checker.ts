import type { FileSystem } from '../../../domain/repositories/file-system.js';
import type { GitRepository } from '../../../domain/repositories/git-repository.js';
import type { PathResolver } from '../../../domain/services/path-resolver.js';
import type { DriftResult } from './checker-types.js';

export abstract class BaseChecker {
  protected readonly pr: PathResolver;
  constructor(
    protected fileSystem: FileSystem,
    protected gitRepository: GitRepository,
    protected rootPath: string,
    protected cliVersion: string,
    pathResolver?: PathResolver
  ) {
    const { PathResolver } = require('../../../domain/services/path-resolver.js');
    this.pr = pathResolver ?? PathResolver.from({});
  }

  abstract check(): Promise<DriftResult[]>;

  protected async getMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dir}`);
      return files.filter(f => f.endsWith('.md'));
    } catch { return []; }
  }
}
