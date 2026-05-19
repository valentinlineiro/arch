import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';

interface AuditFinding {
  taskId: string;
  check: 'severity-calibration' | 'decision-entropy' | 'forward-action';
  severity: 'WARN' | 'INFO';
  detail: string;
}

interface AuditResult {
  total: number;
  audited: number;
  findings: AuditFinding[];
  score: number; // 0-100
  breakdown: {
    severityCalibration: { checked: number; understated: number };
    decisionEntropy: { checked: number; suspicious: number };
    forwardActionCompletion: { required: number; missing: number };
  };
}

export class CorpusAuditCommand {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository?: GitRepository,
    private rootPath: string = '.',
  ) {}

  async execute(args: string[]): Promise<void> {
    const verbose = args.includes('--verbose') || args.includes('-v');
    console.log('\n  \x1b[32mARCH\x1b[0m — Corpus Quality Audit\n');
    console.log('  Scanning archive for corpus honesty signals...\n');

    const result = await this.audit(verbose);
    this.render(result, verbose);
  }

  private async audit(verbose: boolean): Promise<AuditResult> {
    const archiveDir = `${this.rootPath}/docs/archive`;
    const refinementDir = `${this.rootPath}/docs/refinement/archive`;

    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(archiveDir); } catch {}
    const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    // Load all IDEA slugs for forward action completion check
    const ideaSlugs = new Set<string>();
    try {
      const ideaFiles = await this.fileSystem.readDirectory(refinementDir);
      ideaFiles.forEach(f => ideaSlugs.add(f.replace('.md', '').toLowerCase()));
    } catch {}
    // Also check active refinement
    try {
      const activeFiles = await this.fileSystem.readDirectory(`${this.rootPath}/docs/refinement`);
      activeFiles.filter(f => f.startsWith('IDEA-')).forEach(f => ideaSlugs.add(f.replace('.md', '').toLowerCase()));
    } catch {}

    const findings: AuditFinding[] = [];
    let audited = 0;

    // Collect all decisions for entropy analysis
    const decisions: Array<{ taskId: string; decision: string; severity: string }> = [];

    const severityCalibration = { checked: 0, understated: 0 };
    const forwardAction = { required: 0, missing: 0 };

    for (const file of taskFiles) {
      const taskId = file.replace('.md', '');
      let content: string;
      try {
        content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
      } catch { continue; }

      const hansei = this.extractHansei(content);
      if (!hansei) continue;
      audited++;

      // ── Check 1: Severity Calibration ─────────────────────────────────────
      if (hansei.severity === 'H0' || hansei.severity === 'H1') {
        const lockedCommitMatch = content.match(/\*\*Locked-commit:\*\*\s*(\S+)/);
        if (lockedCommitMatch && this.gitRepository) {
          severityCalibration.checked++;
          try {
            const { DeterministicHanseiChecker } = await import('../../domain/services/deterministic-hansei-checker.js');
            const task = this.parseTaskMeta(taskId, content);
            const checker = new DeterministicHanseiChecker(this.rootPath);
            const result = await checker.check(task as any);
            const realFindings = result.findings.filter(f => !f.declaredInHansei);

            if (realFindings.length > 0) {
              const understated =
                (hansei.severity === 'H0') ||
                (hansei.severity === 'H1' && realFindings.length >= 2);
              if (understated) {
                severityCalibration.understated++;
                findings.push({
                  taskId,
                  check: 'severity-calibration',
                  severity: 'WARN',
                  detail: `Declared ${hansei.severity} but diff shows: ${realFindings.map(f => f.pattern).join(', ')}`,
                });
              }
            }
          } catch { /* git diff unavailable for this commit */ }
        }
      }

      // ── Check 2: Decision entropy (collect for batch analysis) ────────────
      if (hansei.decision && hansei.decision.length > 5) {
        decisions.push({ taskId, decision: hansei.decision, severity: hansei.severity });
      }

      // ── Check 3: Forward action completion ────────────────────────────────
      const fwd = hansei.forwardAction?.toLowerCase() ?? '';
      const mentionsIdea = fwd.includes('idea') || fwd.includes('file an') || fwd.includes('open ticket');
      const isH2Plus = ['H2', 'H3a', 'H3b'].includes(hansei.severity);

      if (isH2Plus && mentionsIdea) {
        forwardAction.required++;
        // Extract IDEA slug if mentioned
        const ideaMatch = hansei.forwardAction?.match(/IDEA-[\w-]+/i);
        if (ideaMatch) {
          const slug = ideaMatch[0].toLowerCase();
          if (!ideaSlugs.has(slug)) {
            forwardAction.missing++;
            findings.push({
              taskId,
              check: 'forward-action',
              severity: 'WARN',
              detail: `Forward Action referenced ${ideaMatch[0]} but no such IDEA found in refinement`,
            });
          }
        } else {
          // Vague "file an IDEA" with no specific reference
          forwardAction.missing++;
          findings.push({
            taskId,
            check: 'forward-action',
            severity: 'INFO',
            detail: `H2+ Forward Action says "file an IDEA" but no IDEA-XXX slug recorded`,
          });
        }
      }
    }

    // ── Entropy analysis ─────────────────────────────────────────────────────
    const decisionEntropy = { checked: decisions.length, suspicious: 0 };
    const phrases = this.extractPhrases(decisions);
    const highFreqPhrases = phrases.filter(p => p.count >= 3 && p.phrase.length > 20);

    // Deduplicate overlapping ngrams from same task cluster
    const seenTaskSets = new Set<string>();
    for (const { phrase, taskIds } of highFreqPhrases) {
      const key = [...taskIds].sort().join(',');
      if (seenTaskSets.has(key)) continue;
      seenTaskSets.add(key);
      decisionEntropy.suspicious += taskIds.length;
      findings.push({
        taskId: taskIds[0],
        check: 'decision-entropy',
        severity: taskIds.length >= 5 ? 'WARN' : 'INFO',
        detail: `Repeated phrase "${phrase.slice(0, 50)}" in ${taskIds.length} decisions: ${taskIds.slice(0, 4).join(', ')}${taskIds.length > 4 ? ` +${taskIds.length - 4} more` : ''}`,
      });
    }

    // ── Score ────────────────────────────────────────────────────────────────
    const warnCount = findings.filter(f => f.severity === 'WARN').length;
    const score = Math.max(0, Math.round(100 - (warnCount / Math.max(audited, 1)) * 100));

    return {
      total: taskFiles.length,
      audited,
      findings,
      score,
      breakdown: { severityCalibration, decisionEntropy, forwardAction },
    };
  }

  private render(result: AuditResult, verbose: boolean): void {
    const scoreColor = result.score >= 80 ? '\x1b[32m' : result.score >= 60 ? '\x1b[33m' : '\x1b[31m';
    console.log(`  Corpus Quality Score: ${scoreColor}${result.score}/100\x1b[0m`);
    console.log(`  Audited: ${result.audited} / ${result.total} archived tasks\n`);

    const b = result.breakdown;

    // Severity calibration
    const sevPct = b.severityCalibration.checked > 0
      ? Math.round(100 * b.severityCalibration.understated / b.severityCalibration.checked)
      : 0;
    const sevIcon = b.severityCalibration.understated === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
    console.log(`  ${sevIcon} Severity Calibration`);
    console.log(`     ${b.severityCalibration.checked} tasks with commit baseline checked`);
    console.log(`     ${b.severityCalibration.understated} understated (${sevPct}%)`);

    // Decision entropy
    const entIcon = b.decisionEntropy.suspicious === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
    const entPct = b.decisionEntropy.checked > 0
      ? Math.round(100 * b.decisionEntropy.suspicious / b.decisionEntropy.checked)
      : 0;
    console.log(`\n  ${entIcon} Decision Entropy`);
    console.log(`     ${b.decisionEntropy.checked} decisions analysed`);
    console.log(`     ${b.decisionEntropy.suspicious} suspicious (${entPct}% show repeated phrasing)`);

    // Forward action completion
    const fwdIcon = b.forwardAction.missing === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
    const fwdPct = b.forwardAction.required > 0
      ? Math.round(100 * b.forwardAction.missing / b.forwardAction.required)
      : 0;
    console.log(`\n  ${fwdIcon} Forward Action Completion`);
    console.log(`     ${b.forwardAction.required} H2+ tasks required an IDEA`);
    console.log(`     ${b.forwardAction.missing} never produced one (${fwdPct}% gap)`);

    // Findings
    const warns = result.findings.filter(f => f.severity === 'WARN');
    const infos = result.findings.filter(f => f.severity === 'INFO');

    if (warns.length > 0) {
      console.log(`\n  \x1b[31mWARNINGS (${warns.length}):\x1b[0m`);
      const show = verbose ? warns : warns.slice(0, 5);
      for (const f of show) {
        console.log(`    ${f.taskId}  [${f.check}]`);
        console.log(`    → ${f.detail.slice(0, 90)}`);
      }
      if (!verbose && warns.length > 5) console.log(`    ... and ${warns.length - 5} more (run --verbose)`);
    }

    if (verbose && infos.length > 0) {
      console.log(`\n  INFO (${infos.length}):`);
      for (const f of infos.slice(0, 10)) {
        console.log(`    ${f.taskId}  [${f.check}]  ${f.detail.slice(0, 80)}`);
      }
    }

    // Verdict
    console.log('');
    if (result.score >= 80) {
      console.log('  \x1b[32m✔ Corpus is trustworthy enough to govern decisions.\x1b[0m');
    } else if (result.score >= 60) {
      console.log('  \x1b[33m⚠ Corpus has integrity gaps. Governance suggestions will be partially reliable.\x1b[0m');
    } else {
      console.log('  \x1b[31m✖ Corpus integrity is low. Fix WARNINGs before enabling governance features.\x1b[0m');
    }
    console.log('');
  }

  private extractPhrases(
    decisions: Array<{ taskId: string; decision: string }>,
  ): Array<{ phrase: string; count: number; taskIds: string[] }> {
    const ngramMap = new Map<string, Set<string>>();

    for (const { taskId, decision } of decisions) {
      const words = decision.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      for (let j = 0; j <= words.length - 5; j++) {
        const ngram = words.slice(j, j + 5).join(' ');
        if (!ngramMap.has(ngram)) ngramMap.set(ngram, new Set());
        ngramMap.get(ngram)!.add(taskId);
      }
    }

    return Array.from(ngramMap.entries())
      .filter(([, ids]) => ids.size >= 3)
      .map(([phrase, ids]) => ({ phrase, count: ids.size, taskIds: Array.from(ids) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  private extractHansei(content: string) {
    const idx = content.lastIndexOf('## Hansei');
    if (idx < 0) return null;
    const section = content.slice(idx);
    return {
      severity: section.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1] ?? '',
      category: section.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] ?? '',
      decision: section.match(/\*\*Decision:\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)?.[1]?.trim() ?? '',
      constraint: section.match(/\*\*Constraint:\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)?.[1]?.trim() ?? '',
      cost: section.match(/\*\*Cost:\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)?.[1]?.trim() ?? '',
      forwardAction: section.match(/\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)?.[1]?.trim() ?? '',
    };
  }

  private parseTaskMeta(taskId: string, content: string) {
    const metaMatch = content.match(/\*\*Meta:\*\*[^\n]+/);
    const lockedCommit = content.match(/\*\*Locked-commit:\*\*\s*(\S+)/)?.[1];
    const contextMatch = content.match(/\*\*Meta:\*\*[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|\s*([^\n]+)/);
    const context = contextMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    const hansei = this.extractHansei(content);
    return {
      id: taskId,
      content,
      lockedCommit,
      context,
      hansei: hansei ? {
        constraint: hansei.constraint,
        severity: hansei.severity,
      } : undefined,
    };
  }
}
