import { Command } from '../../domain/models/command.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { CorpusIndexService, type CorpusEntry } from '../use-cases/corpus-index.js';
import { GovernanceDriftDetector } from '../../domain/services/governance-drift-detector.js';
import { InstitutionalAnomalyTracker } from '../../domain/services/institutional-anomaly-tracker.js';

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
  score: number;
  breakdown: {
    severityCalibration: { checked: number; understated: number };
    decisionEntropy: { checked: number; suspicious: number };
    forwardAction: { required: number; missing: number };
  };
}

export class CorpusAuditCommand implements Command {
  private indexService: CorpusIndexService;

  constructor(
    private fileSystem: FileSystem,
    private gitRepository?: GitRepository,
    private rootPath: string = '.',
  ) {
    this.indexService = new CorpusIndexService(fileSystem, gitRepository);
  }

  async execute(args: string[]): Promise<void> {
    const verbose = args.includes('--verbose') || args.includes('-v');
    const rebuild = args.includes('--rebuild');

    console.log('\n  \x1b[32mARCH\x1b[0m — Corpus Quality Audit\n');

    if (rebuild) {
      process.stdout.write('  Rebuilding corpus index...');
      await this.indexService.rebuild();
      process.stdout.write(' done\n');
    }

    console.log('  Loading corpus index...\n');
    const result = await this.audit(verbose);
    this.render(result, verbose);
    if (args.includes('--layer2')) {
      await this.renderLayer2();
    }
  }

  /** Exposed for testing — parses Hansei section from raw content. */
  static extractHanseiStatic(content: string): { severity: string; category: string; decision: string; constraint: string; cost: string; forwardAction: string } | null {
    const idx = content.lastIndexOf('## Hansei');
    if (idx < 0) return null;
    const section = content.slice(idx);
    const sev = section.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1];
    if (!sev) return null;
    const extract = (field: string) =>
      section.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`))?.[1]?.trim() ?? '';
    return {
      severity: sev,
      category: section.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] ?? '',
      decision: extract('Decision'),
      constraint: extract('Constraint'),
      cost: extract('Cost'),
      forwardAction: extract('Forward Action'),
    };
  }

  // For backward compat with tests that access as instance method
  extractHansei = CorpusAuditCommand.extractHanseiStatic;

  /** Silent version: returns score only. Used by govern tick. */
  async runQuiet(): Promise<number> {
    const result = await this.audit(false);
    return result.score;
  }

  private async audit(_verbose: boolean): Promise<AuditResult> {
    const index = await this.indexService.load();
    const entries = Object.values(index.entries);

    // Load IDEA slugs for forward action check
    const ideaSlugs = await this.loadIdeaSlugs();

    const findings: AuditFinding[] = [];
    const severityCalibration = { checked: 0, understated: 0 };
    const forwardAction = { required: 0, missing: 0 };
    const decisions: Array<{ taskId: string; decision: string }> = [];

    for (const entry of entries) {
      if (!entry.severity) continue;

      // ── Check 1: Severity Calibration ─────────────────────────────────
      if ((entry.severity === 'H0' || entry.severity === 'H1') && entry.lockedCommit) {
        severityCalibration.checked++;
        try {
          const { DeterministicHanseiChecker } = await import('../../domain/services/deterministic-hansei-checker.js');
          const checker = new DeterministicHanseiChecker(this.rootPath);
          const fakeTask = {
            id: entry.id, lockedCommit: entry.lockedCommit,
            context: [], hansei: { constraint: entry.constraint, severity: entry.severity }, content: '',
          };
          const result = await checker.check(fakeTask as any);
          const undeclared = result.findings.filter((f: any) => !f.declaredInHansei);
          if (undeclared.length > 0) {
            severityCalibration.understated++;
            findings.push({
              taskId: entry.id, check: 'severity-calibration', severity: 'WARN',
              detail: `Declared ${entry.severity} but diff shows: ${undeclared.map((f: any) => f.pattern).join(', ')}`,
            });
          }
        } catch { /* git unavailable */ }
      }

      // ── Check 2: Collect decisions for entropy analysis ────────────────
      if (entry.decision && entry.decision.length > 5) {
        decisions.push({ taskId: entry.id, decision: entry.decision });
      }

      // ── Check 3: Forward action completion ────────────────────────────
      const fwd = entry.forwardAction?.toLowerCase() ?? '';
      const isH2Plus = ['H2', 'H3a', 'H3b'].includes(entry.severity);
      if (isH2Plus && (fwd.includes('idea') || fwd.includes('file an') || fwd.includes('open ticket'))) {
        forwardAction.required++;
        const ideaMatch = entry.forwardAction?.match(/IDEA-[\w-]+/i);
        if (ideaMatch) {
          if (!ideaSlugs.has(ideaMatch[0].toLowerCase())) {
            forwardAction.missing++;
            findings.push({
              taskId: entry.id, check: 'forward-action', severity: 'WARN',
              detail: `Forward Action referenced ${ideaMatch[0]} but no such IDEA found in refinement`,
            });
          }
        } else {
          forwardAction.missing++;
          findings.push({
            taskId: entry.id, check: 'forward-action', severity: 'INFO',
            detail: `H2+ Forward Action mentions IDEA but no IDEA-XXX slug recorded`,
          });
        }
      }
    }

    // ── Entropy analysis ─────────────────────────────────────────────────
    const decisionEntropy = { checked: decisions.length, suspicious: 0 };
    const phrases = this.extractPhrases(decisions);
    const highFreq = phrases.filter(p => p.count >= 3 && p.phrase.length > 20);
    const seenSets = new Set<string>();

    for (const { phrase, taskIds } of highFreq) {
      const key = [...taskIds].sort().join(',');
      if (seenSets.has(key)) continue;
      seenSets.add(key);
      decisionEntropy.suspicious += taskIds.length;
      findings.push({
        taskId: taskIds[0], check: 'decision-entropy',
        severity: taskIds.length >= 5 ? 'WARN' : 'INFO',
        detail: `Repeated phrase "${phrase.slice(0, 50)}" in ${taskIds.length} decisions: ${taskIds.slice(0, 4).join(', ')}${taskIds.length > 4 ? ` +${taskIds.length - 4} more` : ''}`,
      });
    }

    // Weighted score: WARN from missed H3b/H2 IDEA = 3pts, severity calibration WARN = 2pts,
    // entropy WARN = 2pts, entropy INFO = 0.5pts, forward-action INFO = 1pt
    const WEIGHTS: Record<string, Record<string, number>> = {
      'severity-calibration': { WARN: 2, INFO: 0.5 },
      'decision-entropy':     { WARN: 2, INFO: 0.5 },
      'forward-action':       { WARN: 3, INFO: 1.0 },
    };
    const weightedPenalty = findings.reduce((sum, f) => {
      return sum + (WEIGHTS[f.check]?.[f.severity] ?? 1);
    }, 0);
    const score = Math.max(0, Math.round(100 - (weightedPenalty / Math.max(entries.length, 1)) * 100));

    return {
      total: index.taskCount,
      audited: entries.length,
      findings,
      score,
      breakdown: { severityCalibration, decisionEntropy, forwardAction },
    };
  }

  private async loadIdeaSlugs(): Promise<Set<string>> {
    const slugs = new Set<string>();
    for (const dir of ['docs/refinement/archive', 'docs/refinement']) {
      try {
        const files = await this.fileSystem.readDirectory(dir);
        files.filter(f => f.startsWith('IDEA-')).forEach(f => slugs.add(f.replace('.md', '').toLowerCase()));
      } catch { /* skip */ }
    }
    return slugs;
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

  private render(result: AuditResult, verbose: boolean): void {
    const scoreColor = result.score >= 80 ? '\x1b[32m' : result.score >= 60 ? '\x1b[33m' : '\x1b[31m';
    console.log(`  Corpus Quality Score: ${scoreColor}${result.score}/100\x1b[0m`);
    console.log(`  Audited: ${result.audited} / ${result.total} archived tasks  (index-backed)\n`);

    const b = result.breakdown;

    const sevIcon = b.severityCalibration.understated === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
    const sevPct = b.severityCalibration.checked > 0 ? Math.round(100 * b.severityCalibration.understated / b.severityCalibration.checked) : 0;
    console.log(`  ${sevIcon} Severity Calibration`);
    console.log(`     ${b.severityCalibration.checked} tasks with commit baseline, ${b.severityCalibration.understated} understated (${sevPct}%)`);

    const entIcon = b.decisionEntropy.suspicious === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
    const entPct = b.decisionEntropy.checked > 0 ? Math.round(100 * b.decisionEntropy.suspicious / b.decisionEntropy.checked) : 0;
    console.log(`\n  ${entIcon} Decision Entropy`);
    console.log(`     ${b.decisionEntropy.checked} decisions, ${b.decisionEntropy.suspicious} suspicious (${entPct}%)`);

    const fwdIcon = b.forwardAction.missing === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
    const fwdPct = b.forwardAction.required > 0 ? Math.round(100 * b.forwardAction.missing / b.forwardAction.required) : 0;
    console.log(`\n  ${fwdIcon} Forward Action Completion`);
    console.log(`     ${b.forwardAction.required} H2+ required IDEA, ${b.forwardAction.missing} gap (${fwdPct}%)`);

    const warns = result.findings.filter(f => f.severity === 'WARN');
    const infos = result.findings.filter(f => f.severity === 'INFO');

    if (warns.length > 0) {
      console.log(`\n  \x1b[31mWARNINGS (${warns.length}):\x1b[0m`);
      for (const f of (verbose ? warns : warns.slice(0, 5))) {
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

    console.log('');
    if (result.score >= 80) console.log('  \x1b[32m✔ Corpus is trustworthy enough to govern decisions.\x1b[0m');
    else if (result.score >= 60) console.log('  \x1b[33m⚠ Corpus has integrity gaps. Governance suggestions partially reliable.\x1b[0m');
    else console.log('  \x1b[31m✖ Corpus integrity low. Fix WARNINGs before enabling governance features.\x1b[0m');
    console.log('');
  }

  private async renderLayer2(): Promise<void> {
    const index = await this.indexService.load();
    const entries = Object.values(index.entries);

    console.log('\n  \x1b[32mARCH\x1b[0m — Layer 2: Governance Drift\n');
    const drift = GovernanceDriftDetector.detect(entries, 10);
    if (drift.signals.length === 0) {
      console.log('  ✔ No drift signals detected\n');
    } else {
      for (const s of drift.signals) {
        console.log(`  ⚠ ${s}`);
      }
      console.log('');
    }

    console.log('  \x1b[32mARCH\x1b[0m — Layer 2: Institutional Anomalies\n');
    const anomalies = InstitutionalAnomalyTracker.analyze(index.entries, 3);
    if (anomalies.recurringCategories.length === 0 && !anomalies.classConcentration) {
      console.log('  ✔ No anomalies detected\n');
    } else {
      for (const cat of anomalies.recurringCategories) {
        console.log(`  ⚠ Recurring category ${cat.category}: ${cat.count} tasks (${cat.taskIds.slice(0, 3).join(', ')}${cat.taskIds.length > 3 ? '…' : ''})`);
      }
      if (anomalies.classConcentration) {
        console.log(`  ⚠ Class concentration: ${anomalies.classConcentration.dominantClass} = ${(anomalies.classConcentration.fraction * 100).toFixed(0)}% of corpus`);
      }
      console.log('');
    }
  }
}


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
    forwardAction: { required: number; missing: number };
  };
}

