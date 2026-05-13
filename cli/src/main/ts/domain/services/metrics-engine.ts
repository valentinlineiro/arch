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
    [key: string]: number; // size or class
  };
  reviewFailRate: number | 'pending';
  totalCompleted: number;
}

export class MetricsEngine {
  constructor(private fileSystem: FileSystem) {}

  async calculate(archivedTasks: ArchivedTaskMetrics[]): Promise<CalculatedMetrics> {
    const cycleTime = this.computeCycleTime(archivedTasks);
    const costPerTask = this.computeCostPerTask(archivedTasks);
    const reviewFailRate = await this.computeReviewFailRate();

    return {
      cycleTime,
      costPerTask,
      reviewFailRate,
      totalCompleted: archivedTasks.length
    };
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
    // Heuristic v1: XS=$0.05, S=$0.10, M=$0.25, L=$0.50
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

  private async computeReviewFailRate(): Promise<number | 'pending'> {
    const eventsPath = 'docs/EVENTS.md';
    if (!(await this.fileSystem.exists(eventsPath))) {
      return 'pending';
    }

    const content = await this.fileSystem.readFile(eventsPath);
    const lines = content.split('\n');
    
    let rejections = 0; // REVIEW -> READY
    let approvals = 0;  // REVIEW -> DONE

    for (const line of lines) {
      if (line.includes('REVIEW -> READY')) rejections++;
      if (line.includes('REVIEW -> DONE')) approvals++;
    }

    const totalExits = rejections + approvals;
    if (totalExits === 0) {
      return 'pending';
    }

    return rejections / totalExits;
  }
}
