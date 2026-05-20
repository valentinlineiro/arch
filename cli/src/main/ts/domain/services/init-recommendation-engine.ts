
import type { InitSuggestion, Pattern, InferredArchitecturalPattern } from '../models/audit-inference.js';

export class InitRecommendationEngine {
  recommend(patterns: Pattern[], inferredPatterns: InferredArchitecturalPattern[], alreadyInitialized: boolean): InitSuggestion {
    if (alreadyInitialized) {
      return {
        recommended: false,
        confidence: 1.0,
        rationale: "ARCH is already initialized in this repository.",
        stableDomains: [],
        suggestedConfig: { confidenceThreshold: 0.75, domains: [] },
      };
    }

    const stablePatterns = patterns.filter(p => p.stability === "stable");
    const transitionalPatterns = patterns.filter(p => p.stability === "transitional");
    const highConfidencePatterns = inferredPatterns.filter(a => a.confidence >= 0.8);

    const recommended = (stablePatterns.length + transitionalPatterns.length) >= 2 && highConfidencePatterns.length >= 1;
    
    let rationale = "";
    if (recommended) {
      rationale = `Detected ${stablePatterns.length} stable and ${transitionalPatterns.length} transitional domains with high-confidence patterns. The repository exhibits sufficient maturity for ARCH adoption.`;
    } else if (stablePatterns.length === 0 && transitionalPatterns.length === 0) {
      rationale = "No stable or directed architectural patterns detected yet. Continue developing to establish baseline implementation standards.";
    } else {
      rationale = `Detected ${stablePatterns.length + transitionalPatterns.length} domain(s) with patterns, but maturity threshold not yet met for full recommendation.`;
    }

    const confidence = Math.max(0, Math.min(1, ((stablePatterns.length + transitionalPatterns.length) / 2) * 0.5 + (highConfidencePatterns.length > 0 ? 0.5 : 0)));

    return {
      recommended,
      confidence,
      rationale,
      stableDomains: [...stablePatterns, ...transitionalPatterns].map(p => p.domain),
      suggestedConfig: {
        confidenceThreshold: 0.75,
        domains: [...stablePatterns, ...transitionalPatterns].map(p => p.domain),
      },
    };
  }
}
