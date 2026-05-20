import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EvidenceEvent, ClaimType } from '../models/evidence.js';
import { randomUUID } from 'node:crypto';

export class GitEvidenceCollector {
  constructor(private repoPath: string) {}

  async collect(options: { maxCommits?: number } = {}): Promise<EvidenceEvent[]> {
    const events: EvidenceEvent[] = [];
    const maxCommits = options.maxCommits ?? 200;

    // 1. Commit → File (MODIFICATION)
    // 2. Commit message → Issue/PR (LINKAGE via regex)
    const log = this.git(
      `log --format="%H||%ae||%ai||%s" --name-only -${maxCommits}`
    );

    let currentCommit: { hash: string; author: string; date: string; subject: string } | null = null;

    for (const line of log.split('\n')) {
      if (line.includes('||')) {
        const [hash, author, date, ...subjectParts] = line.split('||');
        currentCommit = { hash: hash.trim(), author: author.trim(), date: date.trim(), subject: subjectParts.join('||').trim() };

        // LINKAGE: commit → issue/PR reference
        const issueRefs = currentCommit.subject.matchAll(/#(\d+)|fixes\s+#(\d+)|closes\s+#(\d+)/gi);
        for (const ref of issueRefs) {
          const issueNum = (ref[1] ?? ref[2] ?? ref[3]);
          events.push(this.makeEvent(
            `commit:${currentCommit.hash}`, 'LINKAGE', `issue:${issueNum}`,
            'regex', ref[0], currentCommit.date,
            `Commit message pattern: "${ref[0]}"`, 0.75
          ));
        }

        // LINKAGE: commit → PR (if subject looks like a merge commit)
        const prRef = currentCommit.subject.match(/Merge pull request #(\d+)/i);
        if (prRef) {
          events.push(this.makeEvent(
            `commit:${currentCommit.hash}`, 'LINKAGE', `pr:${prRef[1]}`,
            'regex', prRef[0], currentCommit.date,
            `Merge commit pattern`, 0.9
          ));
        }
      } else if (line.trim() && currentCommit) {
        // MODIFICATION: commit → file
        const file = line.trim();
        if (file) {
          events.push(this.makeEvent(
            `commit:${currentCommit.hash}`, 'MODIFICATION', `file:${file}`,
            'diff_stat', currentCommit.hash, currentCommit.date,
            `File changed in commit`, 1.0
          ));
        }
      }
    }

    // 3. CODEOWNERS → OWNERSHIP
    const codeownersEvents = this.parseCodeowners();
    events.push(...codeownersEvents);

    return events;
  }

  private parseCodeowners(): EvidenceEvent[] {
    const events: EvidenceEvent[] = [];
    const paths = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

    for (const rel of paths) {
      const full = join(this.repoPath, rel);
      if (!existsSync(full)) continue;

      const lines = readFileSync(full, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split(/\s+/);
        const pattern = parts[0];
        const owners = parts.slice(1);
        for (const owner of owners) {
          events.push(this.makeEvent(
            `owner:${owner}`, 'OWNERSHIP', `file:${pattern}`,
            'codeowners_entry', line, new Date().toISOString(),
            `CODEOWNERS rule: ${pattern} → ${owner}`, 1.0
          ));
        }
      }
      break; // Use first found
    }
    return events;
  }

  private makeEvent(
    subject: string, relation: ClaimType, object: string,
    evidenceType: EvidenceEvent['evidence']['type'], ref: string,
    timestamp: string | Date, rationale: string, confidenceScore: number,
    snippet?: string,
  ): EvidenceEvent {
    return {
      id: randomUUID(),
      timestamp: new Date(timestamp),
      claim: { subject, relation, object },
      evidence: { type: evidenceType, ref, snippet },
      confidence: { score: confidenceScore, source: 'git', rationale },
    };
  }

  private git(cmd: string): string {
    try {
      return execSync(`git -C "${this.repoPath}" ${cmd}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch { return ''; }
  }
}
