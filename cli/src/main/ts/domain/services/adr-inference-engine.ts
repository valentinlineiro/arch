
import type { Pattern, InferredArchitecturalPattern } from '../models/audit-inference.js';

export class ADRInferenceEngine {
  infer(patterns: Pattern[]): InferredArchitecturalPattern[] {
    return patterns
      .filter(p => p.stability === "stable" || p.stability === "transitional")
      .map(p => {
        const dominant = p.dominantSignals[0];
        const title = this.generateTitle(p.domain, dominant, p.stability);
        const decision = this.generateDecision(p.domain, dominant, p.stability);

        return {
          id: `inferred-pattern:${p.domain}`,
          title,
          inferredDecision: decision,
          domain: p.domain,
          evidence: {
            dominantPattern: dominant,
            competingPatterns: p.competingSignals,
            affectedFiles: p.files,
            directories: p.directories,
            frequency: p.frequency,
            observedSince: p.firstSeen,
            confidenceFactors: {
              dominance: `${Math.round(p.frequency * 100)}% dominant usage in domain`,
              spread: `Observed in ${p.files.length} files across ${p.directories.length} directories`,
              recency: `Active in last ${Math.round((Date.now() - p.lastSeen) / (24 * 60 * 60 * 1000))} days`,
              consistency: `${Math.round(p.consistency * 100)}% consistency (low contradiction)`,
              trajectory: p.trajectory?.isDirected ? `Clear ${p.trajectory.direction} trajectory detected` : undefined,
            }
          },
          confidence: p.stabilityScore,
          status: "INFERRED",
        };
      });
  }

  private generateTitle(domain: string, signal: string, stability: string): string {
    const capitalized = signal.charAt(0).toUpperCase() + signal.slice(1);
    const prefix = stability === "transitional" ? "[TRANSITIONAL] " : "";
    
    switch (domain) {
      case 'database':
        return `${prefix}Standardize database access through ${capitalized}`;
      case 'network':
        return `${prefix}Standardize HTTP networking through ${capitalized}`;
      case 'logging':
        return `${prefix}Standardize logging through ${capitalized}`;
      case 'auth':
        return `${prefix}Standardize authentication through ${capitalized}`;
      case 'config':
        return `${prefix}Standardize configuration management through ${capitalized}`;
      case 'queue':
        return `${prefix}Standardize background processing through ${capitalized}`;
      default:
        return `${prefix}Standardize ${domain} through ${capitalized}`;
    }
  }

  private generateDecision(domain: string, signal: string, stability: string): string {
    const capitalized = signal.charAt(0).toUpperCase() + signal.slice(1);
    if (stability === "transitional") {
      return `The project is currently transitioning to ${capitalized} for ${domain}. Implementation patterns show a clear increasing trajectory. New work should prefer this pattern unless migration blockers exist.`;
    }
    return `The project uses ${capitalized} as the primary observed standard for ${domain}. All new implementations in this domain should follow this pattern to maintain architectural consistency.`;
  }
}
