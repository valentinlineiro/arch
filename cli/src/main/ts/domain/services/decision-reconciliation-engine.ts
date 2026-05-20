import { Decision, DecisionStatus } from '../models/decision.js';
import { ReconciledDecision, OrganizationalTruthReport } from '../models/reconciliation.js';
import { EvidenceEvent } from '../models/evidence.js';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'use', 'how', 'its', 'now', 'any',
  'adr', 'doc', 'docs', 'src', 'cli', 'lib', 'api', 'new', 'add', 'fix',
  'feat', 'chore', 'test', 'main', 'this', 'that', 'from', 'with', 'has',
]);

export class DecisionReconciliationEngine {
  /**
   * Fuses Declared Decisions (ADR/Config) with Observed Behavior (Evidence)
   * to detect Organizational Divergence.
   */
  reconcile(
    declaredDecisions: Decision[],
    observedEvidence: EvidenceEvent[]
  ): OrganizationalTruthReport {
    const reconciled: ReconciledDecision[] = [];

    // Build a reusable evidence index for faster matching
    const evidenceIndex = this.buildEvidenceIndex(observedEvidence);

    // 1. Map Evidence to Declared Decisions
    for (const declared of declaredDecisions) {
      const relatedEvidence = this.filterRelatedEvidence(declared, observedEvidence, evidenceIndex);
      const { status, evidenceIds } = this.evaluateDivergence(declared, relatedEvidence);

      reconciled.push({
        ...declared,
        source: { type: 'ADR', confidence: 1.0, ref: declared.metadata.source },
        status,
        reconciliationState: this.mapStatusToState(status, relatedEvidence.length),
        divergenceEvidenceIds: status === 'CONTRADICTED' ? evidenceIds : [],
        evidenceIds,
      });
    }

    // 2. Detect emergent decisions — file paths touched frequently with no covering ADR
    const emergent = this.detectEmergentDecisions(observedEvidence, declaredDecisions);

    return {
      timestamp: new Date(),
      alignmentScore: this.calculateAlignment(reconciled),
      topDivergences: reconciled.filter(r => r.reconciliationState === 'DIVERGENT'),
      unrecordedBehavioralPatterns: emergent,
    };
  }

  // ── Evidence index for O(1) term lookup ─────────────────────────────────

  private buildEvidenceIndex(events: EvidenceEvent[]): Map<string, EvidenceEvent[]> {
    const index = new Map<string, EvidenceEvent[]>();
    for (const event of events) {
      // Index by every meaningful term in subject and object
      for (const term of this.extractTerms(event.claim.subject)
        .concat(this.extractTerms(event.claim.object))) {
        if (!index.has(term)) index.set(term, []);
        index.get(term)!.push(event);
      }
    }
    return index;
  }

  // ── Semantic evidence filtering ──────────────────────────────────────────

  private filterRelatedEvidence(
    decision: Decision,
    _allEvents: EvidenceEvent[],
    index: Map<string, EvidenceEvent[]>,
  ): EvidenceEvent[] {
    // Extract terms from the decision: subject slug, title keywords, description
    const decisionTerms = new Set<string>([
      ...this.extractTerms(decision.subject),
      ...this.extractTerms(decision.title),
      ...this.extractTerms(decision.description?.slice(0, 200) ?? ''),
    ]);

    // For OWNERSHIP decisions, also match by owner identifier
    if (decision.type === 'OWNERSHIP' && decision.intendedState?.owner) {
      decisionTerms.add(decision.intendedState.owner.toLowerCase().replace(/[@/]/g, ''));
    }

    // Score each evidence event by how many decision terms appear in its claims
    const scored = new Map<string, { event: EvidenceEvent; score: number }>();
    for (const term of decisionTerms) {
      if (term.length < 3) continue; // skip noise terms
      const matching = index.get(term) ?? [];
      for (const ev of matching) {
        const key = ev.id;
        if (!scored.has(key)) scored.set(key, { event: ev, score: 0 });
        scored.get(key)!.score++;
      }
    }

    // Keep evidence with score >= 1 (at least one term overlap)
    // Weight by confidence and score
    return Array.from(scored.values())
      .filter(({ score }) => score >= 1)
      .sort((a, b) => (b.score * b.event.confidence.score) - (a.score * a.event.confidence.score))
      .map(({ event }) => event);
  }

  // ── Term extraction ──────────────────────────────────────────────────────

  private extractTerms(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      // Remove common prefixes like commit:, file:, issue:, pr:, owner:
      .replace(/^(commit|file|issue|pr|owner):/g, '')
      // Split on non-alphanumeric (path separators, dashes, underscores, spaces)
      .split(/[^a-z0-9]+/)
      // Filter stop words and very short terms
      .filter(t => t.length >= 3 && !STOP_WORDS.has(t));
  }

  // ── Divergence detection ─────────────────────────────────────────────────

  private evaluateDivergence(
    decision: Decision,
    evidence: EvidenceEvent[],
  ): { status: DecisionStatus; evidenceIds: string[] } {
    if (evidence.length === 0) return { status: 'INSUFFICIENT_EVIDENCE', evidenceIds: [] };

    const contradictions = evidence.filter(e => this.isContradiction(decision, e));
    // Contradicted if >20% of related evidence contradicts the decision
    const status = contradictions.length > evidence.length * 0.2 ? 'CONTRADICTED' : 'SUPPORTED';

    return { status, evidenceIds: contradictions.map(c => c.id) };
  }

  private isContradiction(decision: Decision, evidence: EvidenceEvent): boolean {
    // OWNERSHIP: if codeowners says Team A owns /auth but we see Team B committing
    if (decision.type === 'OWNERSHIP' && evidence.claim.relation === 'OWNERSHIP') {
      const intendedOwner = decision.intendedState?.owner ?? '';
      const observedOwner = evidence.claim.subject.replace('owner:', '');
      if (intendedOwner && observedOwner && intendedOwner !== observedOwner) {
        // Check if both target the same file pattern
        const intendedTarget = decision.intendedState?.path ?? decision.subject;
        const observedTarget = evidence.claim.object.replace('file:', '');
        if (observedTarget.includes(intendedTarget) || intendedTarget.includes(observedTarget.split('/')[0])) {
          return true;
        }
      }
    }

    // ARCHITECTURAL/PROCESS: if decision says "must not use X" and we see X in commits
    if (['ARCHITECTURAL', 'PROCESS'].includes(decision.type)) {
      const forbiddenTerms = this.extractForbiddenTerms(decision.intendedState ?? '');
      if (forbiddenTerms.length > 0) {
        const evidenceText = `${evidence.claim.subject} ${evidence.claim.object} ${evidence.evidence.snippet ?? ''}`.toLowerCase();
        return forbiddenTerms.some(term => evidenceText.includes(term));
      }
    }

    return false;
  }

  private extractForbiddenTerms(intendedState: string): string[] {
    // Look for negations: "must not", "should not", "avoid", "forbidden", "never"
    const text = String(intendedState).toLowerCase();
    const negationPatterns = /(?:must not|should not|never|avoid|forbidden|prohibited)\s+(?:use\s+)?([a-z][\w-]+)/g;
    const terms: string[] = [];
    let match;
    while ((match = negationPatterns.exec(text)) !== null) {
      if (match[1].length >= 3) terms.push(match[1]);
    }
    return terms;
  }

  // ── Emergent pattern detection ───────────────────────────────────────────

  private detectEmergentDecisions(evidence: EvidenceEvent[], declared: Decision[]): Decision[] {
    // Find file paths frequently modified that aren't covered by any ADR subject
    const fileCounts = new Map<string, number>();
    for (const ev of evidence) {
      if (ev.claim.relation === 'MODIFICATION') {
        const file = ev.claim.object.replace('file:', '');
        const topDir = file.split('/')[0];
        if (topDir) fileCounts.set(topDir, (fileCounts.get(topDir) ?? 0) + 1);
      }
    }

    const declaredSubjectTerms = new Set(
      declared.flatMap(d => this.extractTerms(d.subject + ' ' + d.title))
    );

    const emergent: Decision[] = [];
    for (const [dir, count] of fileCounts.entries()) {
      if (count < 10) continue; // Only surface high-activity areas
      if (this.extractTerms(dir).some(t => declaredSubjectTerms.has(t))) continue; // Already covered

      emergent.push({
        id: `emergent:${dir}`,
        type: 'ARCHITECTURAL',
        subject: dir,
        title: `High-activity area without ADR: ${dir}/`,
        description: `${count} commits touch this directory but no ADR addresses it.`,
        intendedState: null,
        status: 'INSUFFICIENT_EVIDENCE',
        impact: count >= 50 ? 'HIGH' : count >= 20 ? 'MEDIUM' : 'LOW',
        evidenceIds: [],
        metadata: { source: 'config', definedAt: new Date() },
      });
    }

    return emergent.sort((a, b) => {
      const weights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return weights[b.impact] - weights[a.impact];
    }).slice(0, 5);
  }

  // ── Scoring ──────────────────────────────────────────────────────────────

  private mapStatusToState(status: DecisionStatus, _evidenceCount: number): 'ALIGNED' | 'DIVERGENT' | 'STALE' {
    if (status === 'INSUFFICIENT_EVIDENCE') return 'STALE';
    if (status === 'CONTRADICTED') return 'DIVERGENT';
    return 'ALIGNED';
  }

  private calculateAlignment(reconciled: ReconciledDecision[]): number {
    if (reconciled.length === 0) return 100;
    const aligned = reconciled.filter(r => r.reconciliationState === 'ALIGNED').length;
    return Math.round((aligned / reconciled.length) * 100);
  }
}
