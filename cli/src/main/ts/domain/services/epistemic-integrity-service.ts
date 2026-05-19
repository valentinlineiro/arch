import { EvidenceEvent, ClaimType } from '../models/evidence.js';
import { EpistemicReport, ConflictRecord, CoverageStats } from '../models/epistemic-report.ts';

export class EpistemicIntegrityService {
  /**
   * Analyzes a stream of evidence events to detect conflicts and calculate coverage.
   */
  analyze(rawSubjectIds: string[], events: EvidenceEvent[]): EpistemicReport {
    const stats = this.calculateCoverage(rawSubjectIds, events);
    const conflicts = this.detectConflicts(events);
    
    // Integrity Score Formula: 
    // 0.7 * CoverageRate + 0.3 * (1 - ConflictRate)
    // This is a placeholder for a more robust auditable formula.
    const conflictRate = conflicts.length / Math.max(events.length, 1);
    const integrityScore = Math.round(
      (0.7 * stats.coverageRate + 0.3 * (1 - conflictRate)) * 100
    );

    return {
      timestamp: new Date(),
      stats,
      conflicts,
      integrityScore
    };
  }

  private calculateCoverage(rawSubjectIds: string[], events: EvidenceEvent[]): CoverageStats {
    const subjectsWithClaims = new Set(events.map(e => e.claim.subject));
    const unclassified = rawSubjectIds.filter(id => !subjectsWithClaims.has(id));

    const bySource: any = {};
    const byClaimType: any = {};

    for (const event of events) {
      bySource[event.confidence.source] = (bySource[event.confidence.source] || 0) + 1;
      byClaimType[event.claim.relation] = (byClaimType[event.claim.relation] || 0) + 1;
    }

    return {
      totalRawEvents: rawSubjectIds.length,
      enrichedEvents: subjectsWithClaims.size,
      coverageRate: subjectsWithClaims.size / Math.max(rawSubjectIds.length, 1),
      bySource,
      byClaimType,
      unclassifiedSubjects: unclassified
    };
  }

  private detectConflicts(events: EvidenceEvent[]): ConflictRecord[] {
    const conflicts: ConflictRecord[] = [];
    const grouped = new Map<string, EvidenceEvent[]>();

    // Group by Subject + Relation (e.g., Commit X -> LINKAGE)
    for (const event of events) {
      const key = `${event.claim.subject}:${event.claim.relation}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(event);
    }

    for (const [key, claims] of grouped.entries()) {
      const uniqueObjects = new Set(claims.map(c => c.claim.object));
      
      // If a single subject has multiple different objects for the same relation type, it's a conflict
      // Exception: Some relations like MODIFICATION can naturally have multiple objects (one commit, many files).
      // LINKAGE or IMPLEMENTATION should ideally be 1:1 or 1:N but consistent.
      if (uniqueObjects.size > 1 && this.isExclusiveRelation(claims[0].claim.relation)) {
        const [subject, relation] = key.split(':');
        conflicts.push({
          subject,
          relation: relation as ClaimType,
          conflictingObjects: claims.map(c => ({
            object: c.claim.object,
            source: c.confidence.source,
            confidence: c.confidence.score,
            evidenceRef: c.evidence.ref
          }))
        });
      }
    }

    return conflicts;
  }

  private isExclusiveRelation(relation: ClaimType): boolean {
    // LINKAGE (Commit -> Issue) is often exclusive in strict workflows
    // IMPLEMENTATION (PR -> Issue) is often exclusive
    return ['LINKAGE', 'IMPLEMENTATION'].includes(relation);
  }
}
