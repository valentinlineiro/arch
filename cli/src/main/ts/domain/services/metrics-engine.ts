import { ArchivedTaskMetrics } from './archive-parser.js';
import { FileSystem } from '../repositories/file-system.js';

export interface CalculatedMetrics {
  cycleTime: {
    [size: string]: {
      p50: number | null;
      p90: number | null;
      count: number;
    };
  };
  costPerTask: {
    average: number;
  };
  reviewFailRate: number | 'pending';
  totalCompleted: number;
  integrityEntropy: number; // Ratio of LOW/MEDIUM data
  integrityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID';
}

export class MetricsEngine {
  constructor(private fileSystem: FileSystem) {}

  async calculate(archivedTasks: ArchivedTaskMetrics[]): Promise<CalculatedMetrics> {
    const cycleTime = this.computeCycleTime(archivedTasks);
    const costPerTask = this.computeCostPerTask(archivedTasks);
    
    // Severity 2: Truth Anchors - fail-closed on rewrite/malformed events
    const events = await this.loadEvents();
    const reviewFailRate = this.computeReviewFailRate(events);

    const entropy = this.computeIntegrityEntropy(archivedTasks);
    const globalIntegrity = this.computeGlobalIntegrity(archivedTasks, reviewFailRate);

    return {
      cycleTime,
      costPerTask,
      reviewFailRate,
      totalCompleted: archivedTasks.length,
      integrityEntropy: entropy,
      integrityLevel: globalIntegrity
    };
  }

  private async loadEvents(): Promise<string[]> {
    const eventsPath = 'docs/EVENTS.md';
    if (!(await this.fileSystem.exists(eventsPath))) {
      return [];
    }

    const content = await this.fileSystem.readFile(eventsPath);
    const lines = content.split('\n');
    
    const uniqueEvents: string[] = [];
    let currentHeader = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === '# Event Log') continue;

      if (trimmedLine.startsWith('## ')) {
        // Simple append-only check: headers must be ISO timestamps and strictly increasing
        // (Simplified for now, but following the 'must throw if malformed' directive)
        if (!trimmedLine.match(/^## \d{4}-\d{2}-\d{2}T/)) {
          throw new Error(`Integrity Violation: Malformed event header "${trimmedLine}" in docs/EVENTS.md`);
        }
        currentHeader = trimmedLine;
      } else if (trimmedLine.includes(' | ') && trimmedLine.includes(' -> ')) {
        const match = trimmedLine.match(/^TASK-\d{3} \| [A-Z_]+ -> [A-Z_]+$/);
        if (!match) {
          throw new Error(`Integrity Violation: Malformed event entry "${trimmedLine}" in docs/EVENTS.md`);
        }
        uniqueEvents.push(`${currentHeader}\n${trimmedLine}`);
      } else {
        // Unexpected line content (Garbage)
        throw new Error(`Integrity Violation: Unexpected content "${trimmedLine}" in docs/EVENTS.md`);
      }
    }

    return uniqueEvents;
  }

  private computeReviewFailRate(events: string[]): number | 'pending' {
    let rejections = 0; // REVIEW -> READY
    let approvals = 0;  // REVIEW -> DONE

    for (const event of events) {
      if (event.includes('REVIEW -> READY')) rejections++;
      if (event.includes('REVIEW -> DONE')) approvals++;
    }

    const totalExits = rejections + approvals;
    if (totalExits === 0) return 'pending';

    return rejections / totalExits;
  }

  private computeCycleTime(tasks: ArchivedTaskMetrics[]) {
    const sizes = ['XS', 'S', 'M', 'L'];
    const results: CalculatedMetrics['cycleTime'] = {};

    for (const size of sizes) {
      const sizeTasks = tasks.filter(t => t.size === size && t.createdAt && t.completedAt);
      const durations = sizeTasks.map(t => {
        const start = new Date(t.createdAt!).getTime();
        const end = new Date(t.completedAt!).getTime();
        return (end - start) / (1000 * 60 * 60); // Hours
      }).sort((a, b) => a - b);

      if (durations.length === 0) {
        results[size] = { p50: null, p90: null, count: 0 };
        continue;
      }

      results[size] = {
        p50: durations[Math.floor(durations.length * 0.5)],
        p90: durations[Math.floor(durations.length * 0.9)],
        count: durations.length
      };
    }

    return results;
  }

  private computeCostPerTask(tasks: ArchivedTaskMetrics[]) {
    const heuristics: Record<string, number> = {
      'XS': 0.05,
      'S': 0.10,
      'M': 0.25,
      'L': 0.50
    };

    const totalCost = tasks.reduce((sum, t) => {
      const cost = t.cost !== null ? t.cost : (heuristics[t.size] || 0);
      return sum + cost;
    }, 0);

    return {
      average: tasks.length > 0 ? totalCost / tasks.length : 0
    };
  }

  private computeIntegrityEntropy(tasks: ArchivedTaskMetrics[]): number {
    if (tasks.length === 0) return 0;
    const nonHigh = tasks.filter(t => t.integrity !== 'HIGH').length;
    return nonHigh / tasks.length;
  }

  private computeGlobalIntegrity(tasks: ArchivedTaskMetrics[], reviewFailRate: number | 'pending'): CalculatedMetrics['integrityLevel'] {
    if (tasks.some(t => t.integrity === 'INVALID')) return 'INVALID';
    if (reviewFailRate === 'pending') return 'LOW';

    const entropy = this.computeIntegrityEntropy(tasks);
    if (entropy > 0.5) return 'LOW';
    if (entropy > 0.1) return 'MEDIUM';
    return 'HIGH';
  }
}
