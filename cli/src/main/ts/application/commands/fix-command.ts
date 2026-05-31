import { execSync } from 'node:child_process';
import type { FileSystem } from '../../domain/repositories/file-system.js';

interface Fix {
  label: string;
  check: () => Promise<boolean>;
  apply: () => Promise<void>;
}

export class FixCommand {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async execute(_args: string[]): Promise<number> {
    console.log('\n  \x1b[32mARCH\x1b[0m — arch fix\n');

    const fixes: Fix[] = [
      {
        label: 'Create docs/INBOX.md if missing',
        check: async () => !(await this.exists('docs/INBOX.md')),
        apply: async () => {
          await this.fileSystem.writeFile('docs/INBOX.md', '# INBOX\n\nGovernance alerts and pending actions.\n');
        },
      },
      {
        label: 'Create docs/EVENTS.md if missing',
        check: async () => !(await this.exists('docs/EVENTS.md')),
        apply: async () => {
          await this.fileSystem.writeFile('docs/EVENTS.md', '# EVENTS\n\nTask lifecycle event log.\n');
        },
      },
      {
        label: 'Create docs/tasks/ directory if missing',
        check: async () => !(await this.exists('docs/tasks')),
        apply: async () => {
          await this.fileSystem.writeFile('docs/tasks/.gitkeep', '');
        },
      },
      {
        label: 'Create docs/archive/ directory if missing',
        check: async () => !(await this.exists('docs/archive')),
        apply: async () => {
          await this.fileSystem.writeFile('docs/archive/.gitkeep', '');
        },
      },
      {
        label: 'Create docs/adr/ directory if missing',
        check: async () => !(await this.exists('docs/adr')),
        apply: async () => {
          await this.fileSystem.writeFile('docs/adr/.gitkeep', '');
        },
      },
      {
        label: 'Make pre-commit hook executable',
        check: async () => {
          try {
            execSync('test -f .githooks/pre-commit && test ! -x .githooks/pre-commit', {
              cwd: this.rootPath, stdio: 'pipe',
            });
            return true;
          } catch { return false; }
        },
        apply: async () => {
          execSync('chmod +x .githooks/pre-commit', { cwd: this.rootPath });
        },
      },
      {
        label: 'Configure git to use .githooks',
        check: async () => {
          try {
            const current = execSync('git config core.hooksPath', {
              cwd: this.rootPath, encoding: 'utf8', stdio: 'pipe',
            }).trim();
            return current !== '.githooks';
          } catch { return false; }
        },
        apply: async () => {
          execSync('git config core.hooksPath .githooks', { cwd: this.rootPath });
        },
      },
    ];

    let applied = 0;
    let skipped = 0;

    for (const fix of fixes) {
      const needed = await fix.check();
      if (needed) {
        try {
          await fix.apply();
          console.log(`  \x1b[32m✔\x1b[0m ${fix.label}`);
          applied++;
        } catch (e: any) {
          console.log(`  \x1b[31m✖\x1b[0m ${fix.label} — ${e.message}`);
        }
      } else {
        skipped++;
      }
    }

    if (applied === 0) {
      console.log('  \x1b[32m✔\x1b[0m Nothing to fix — repository is already in good shape.\n');
    } else {
      console.log(`\n  Fixed ${applied} issue${applied > 1 ? 's' : ''}. Run \x1b[36march review\x1b[0m to verify.\n`);
    }

    return 0;
  }

  private async exists(relPath: string): Promise<boolean> {
    try {
      await this.fileSystem.readFile(`${this.rootPath}/${relPath}`);
      return true;
    } catch {
      try {
        await this.fileSystem.readDirectory(`${this.rootPath}/${relPath}`);
        return true;
      } catch { return false; }
    }
  }
}
