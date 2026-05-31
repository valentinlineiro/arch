import { existsSync, mkdirSync } from 'node:fs';
import { readdir, readFile, writeFile, unlink, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import type { FileSystem } from '../../domain/repositories/file-system.js';

export class TriageCommand {
  private stagedDir: string;
  private refinementDir: string;
  private inboxPath: string;

  constructor(
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {
    this.stagedDir = join(rootPath, '.arch', 'incoming-ideas');
    this.refinementDir = join(rootPath, 'docs', 'refinement');
    this.inboxPath = join(rootPath, 'docs', 'INBOX.md');
  }

  async execute(args: string[]): Promise<number> {
    const all = args.includes('--all');
    const targetFile = args.find(a => !a.startsWith('-'));

    const staged = await this.getStagedIdeas();

    if (staged.length === 0) {
      console.log('\n  No incoming IDEAs to triage.\n');
      return 0;
    }

    if (targetFile) {
      const match = staged.find(f => f.filename === targetFile || f.filename.includes(targetFile));
      if (!match) {
        console.error(`\n  Not found: ${targetFile}\n  Available: ${staged.map(s => s.filename).join(', ')}\n`);
        return 1;
      }
      return await this.triageOne(match);
    }

    // List mode (default)
    if (!all) {
      console.log(`\n  \x1b[32mARCH\x1b[0m — Incoming IDEAs (${staged.length})\n`);
      for (const idea of staged) {
        const title = await this.getTitle(idea.filename);
        console.log(`  \x1b[36m${idea.filename}\x1b[0m`);
        console.log(`    ${idea.slug} · ${title}`);
        console.log('');
      }
      console.log(`  Run \x1b[36march triage <filename>\x1b[0m to review one, or \x1b[36march triage --all\x1b[0m for all.\n`);
      return 0;
    }

    // --all mode: triage each sequentially
    console.log(`\n  \x1b[32mARCH\x1b[0m — Triaging ${staged.length} incoming IDEA${staged.length > 1 ? 's' : ''}\n`);
    for (const idea of staged) {
      const code = await this.triageOne(idea);
      if (code !== 0) return code;
    }
    return 0;
  }

  private async triageOne(idea: { filename: string; slug: string }): Promise<number> {
    const content = await readFile(join(this.stagedDir, idea.filename), 'utf8').catch(() => null);
    if (!content) {
      console.error(`  Could not read: ${idea.filename}`);
      return 1;
    }

    // Display IDEA content
    console.log(`\n${'─'.repeat(64)}`);
    console.log(`  \x1b[36m${idea.filename}\x1b[0m  (source: ${idea.slug})`);
    console.log(`${'─'.repeat(64)}\n`);
    // Show first 50 lines
    const lines = content.split('\n');
    console.log(lines.slice(0, 50).join('\n'));
    if (lines.length > 50) console.log(`\n  ... (${lines.length - 50} more lines)\n`);
    console.log('');

    // Prompt for decision
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>(resolve => {
      rl.question('  Decision: [P]romote  [N]oise  [D]efer  [S]kip  > ', a => {
        rl.close();
        resolve(a.trim().toLowerCase());
      });
    });

    switch (answer) {
      case 'p': case 'promote':
        return await this.promote(idea, content);
      case 'n': case 'noise':
        return await this.markNoise(idea);
      case 'd': case 'defer':
        return await this.defer(idea, content);
      case 's': case 'skip':
        console.log(`  Skipped.\n`);
        return 0;
      default:
        console.log(`  Unknown choice "${answer}" — skipping.\n`);
        return 0;
    }
  }

  private async promote(idea: { filename: string; slug: string }, content: string): Promise<number> {
    // Strip slug prefix to get clean IDEA filename
    const cleanName = idea.filename.replace(new RegExp(`^${idea.slug}-`), '');
    const destPath = join(this.refinementDir, cleanName);

    if (!existsSync(this.refinementDir)) mkdirSync(this.refinementDir, { recursive: true });

    // Update Status to DRAFT (entering ARCH refinement)
    const updated = content.replace(/\*\*Status:\*\* \S+/, '**Status:** DRAFT');
    await writeFile(destPath, updated);
    await unlink(join(this.stagedDir, idea.filename));
    await this.removeInboxEntry(idea.filename);

    console.log(`  \x1b[32m✔\x1b[0m Promoted → docs/refinement/${cleanName}\n`);
    return 0;
  }

  private async markNoise(idea: { filename: string }): Promise<number> {
    await unlink(join(this.stagedDir, idea.filename));
    await this.removeInboxEntry(idea.filename);
    console.log(`  \x1b[90m✔ Marked as noise — removed.\x1b[0m\n`);
    return 0;
  }

  private async defer(idea: { filename: string }, content: string): Promise<number> {
    const date = new Date().toISOString().slice(0, 10);
    const updated = content.trimEnd() + `\nDeferred: ${date}\n`;
    await writeFile(join(this.stagedDir, idea.filename), updated);
    console.log(`  \x1b[33m✔ Deferred — will appear on next triage.\x1b[0m\n`);
    return 0;
  }

  private async removeInboxEntry(filename: string): Promise<void> {
    try {
      const inbox = await readFile(this.inboxPath, 'utf8');
      const ideaName = filename.replace(/\.md$/, '');
      const cleaned = inbox
        .split('\n')
        .filter(line => !line.includes(ideaName))
        .join('\n');
      await writeFile(this.inboxPath, cleaned);
    } catch { /* non-fatal */ }
  }

  private async getStagedIdeas(): Promise<Array<{ filename: string; slug: string }>> {
    try {
      const files = await readdir(this.stagedDir);
      return files
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const dashIdx = f.indexOf('-IDEA-');
          const slug = dashIdx >= 0 ? f.slice(0, dashIdx) : 'remote';
          return { filename: f, slug };
        });
    } catch { return []; }
  }

  private async getTitle(filename: string): Promise<string> {
    try {
      const content = await readFile(join(this.stagedDir, filename), 'utf8');
      return content.match(/^# IDEA: (.+)/m)?.[1]?.slice(0, 60) ?? filename;
    } catch { return filename; }
  }
}
