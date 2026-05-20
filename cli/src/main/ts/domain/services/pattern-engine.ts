
import type { 
  Pattern, 
  SignalMatch, 
  CachedSignalEntry, 
  PatternStability,
  MigrationTrend
} from '../models/audit-inference.js';

export class PatternEngine {
  private readonly RECENT_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

  inferPatterns(entries: CachedSignalEntry[]): Pattern[] {
    const domainBuckets = new Map<string, CachedSignalEntry[]>();

    // Group entries by domain (category)
    for (const entry of entries) {
      const categories = new Set(entry.signals.map(s => s.category));
      for (const cat of categories) {
        if (!domainBuckets.has(cat)) domainBuckets.set(cat, []);
        domainBuckets.get(cat)!.push(entry);
      }
    }

    const patterns: Pattern[] = [];
    const now = Date.now();

    for (const [domain, domainEntries] of domainBuckets.entries()) {
      // Sort entries by timestamp to calculate trajectory
      const sortedEntries = [...domainEntries].sort((a, b) => a.timestamp - b.timestamp);
      
      const signalCounts = new Map<string, number>();
      const fileSet = new Set<string>();
      const directorySet = new Set<string>();
      const commitSet = new Set<string>();
      
      let firstSeen = Infinity;
      let lastSeen = -Infinity;

      for (const entry of sortedEntries) {
        commitSet.add(entry.commit);
        fileSet.add(entry.file);
        
        const dir = entry.file.split('/').slice(0, -1).join('/');
        if (dir) directorySet.add(dir);

        if (entry.timestamp < firstSeen) firstSeen = entry.timestamp;
        if (entry.timestamp > lastSeen) lastSeen = entry.timestamp;

        for (const sig of entry.signals) {
          if (sig.category === domain) {
            const weight = sig.polarity === 'positive' ? 1 : -1;
            signalCounts.set(sig.signal, (signalCounts.get(sig.signal) ?? 0) + weight);
          }
        }
      }

      const activeSignals = Array.from(signalCounts.entries())
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

      if (activeSignals.length === 0) continue;

      const totalActiveCount = activeSignals.reduce((sum, [, count]) => sum + count, 0);
      const dominantSignal = activeSignals[0][0];
      const frequency = activeSignals[0][1] / totalActiveCount;
      
      const consistency = activeSignals.length === 1 ? 1.0 : 1.0 - (activeSignals[1][1] / activeSignals[0][1]);
      const recency = Math.max(0, Math.min(1, 1 - (now - lastSeen) / this.RECENT_WINDOW_MS));

      const spreadFiles = Math.min(1, fileSet.size / 10);
      const spreadDirs = Math.min(1, directorySet.size / 3);
      const spreadCommits = Math.min(1, commitSet.size / 5);
      const spread = (spreadFiles + spreadDirs + spreadCommits) / 3;

      // --- Trajectory Calculation (v1.2+) ---
      const trajectory = this.calculateTrajectory(sortedEntries, domain, dominantSignal);

      const stabilityScore = (frequency * 0.25) + (consistency * 0.25) + (recency * 0.25) + (spread * 0.25);

      let stability: PatternStability = "unstable";
      if (stabilityScore >= 0.75) {
        stability = "stable";
      } else if (trajectory.isDirected && trajectory.direction === "increasing") {
        stability = "transitional";
      } else if (consistency < 0.4 && activeSignals.length >= 2) {
        stability = "schism";
      }

      patterns.push({
        id: `pattern:${domain}:${dominantSignal}`,
        domain,
        dominantSignals: [dominantSignal],
        competingSignals: activeSignals.slice(1).map(([s]) => s),
        frequency,
        consistency,
        recency,
        spread,
        stabilityScore,
        trajectory,
        stability,
        firstSeen,
        lastSeen,
        files: Array.from(fileSet),
        directories: Array.from(directorySet),
      });
    }

    return patterns;
  }

  private calculateTrajectory(entries: CachedSignalEntry[], domain: string, signal: string): MigrationTrend {
    if (entries.length < 4) return { direction: "stable", velocity: 0, isDirected: false };

    // Split entries into two halves: early vs late
    const mid = Math.floor(entries.length / 2);
    const early = entries.slice(0, mid);
    const late = entries.slice(mid);

    const getDominance = (batch: CachedSignalEntry[]) => {
      let signalCount = 0;
      let totalCount = 0;
      for (const entry of batch) {
        for (const sig of entry.signals) {
          if (sig.category === domain) {
            totalCount++;
            if (sig.signal === signal) signalCount++;
          }
        }
      }
      return totalCount === 0 ? 0 : signalCount / totalCount;
    };

    const earlyDom = getDominance(early);
    const lateDom = getDominance(late);
    const diff = lateDom - earlyDom;

    return {
      direction: diff > 0.1 ? "increasing" : diff < -0.1 ? "decreasing" : "stable",
      velocity: Math.abs(diff),
      isDirected: Math.abs(diff) > 0.2,
    };
  }
}
