import { ArchivedTaskMetrics } from './archive-parser.js';
import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';

export interface EpistemicDigest {
  methodId: string;
  gitRevRange: string;
}

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
  provenance: EpistemicDigest;
}

export interface GovernanceEvent {
  timestamp: string;
  transition: string;
  commitHash?: string;
  agentId?: string;
}

export class MetricsEngine {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async calculate(archivedTasks: ArchivedTaskMetrics[]): Promise<CalculatedMetrics> {
    const events = await this.loadEvents();
    const eventMap = this.indexEvents(events);

    const calibratedTasks: ArchivedTaskMetrics[] = [];
    for (const task of archivedTasks) {
      calibratedTasks.push(await this.calibrateTask(task, eventMap));
    }
    
    const cycleTime = this.computeCycleTime(calibratedTasks);
    const costPerTask = this.computeCostPerTask(calibratedTasks);
    
    const reviewFailRate = this.computeReviewFailRate(events);

    const entropy = this.computeIntegrityEntropy(calibratedTasks);
    const globalIntegrity = this.computeGlobalIntegrity(calibratedTasks, reviewFailRate);

    return {
      cycleTime,
      costPerTask,
      reviewFailRate,
      totalCompleted: calibratedTasks.length,
      integrityEntropy: entropy,
      integrityLevel: globalIntegrity,
      provenance: {
        methodId: 'metrics-engine-v4-witness-hardened',
        gitRevRange: 'HEAD'
      }
    };
  }

  private isSameTime(t1: string, t2: string, toleranceMs: number): boolean {
    try {
      const d1 = new Date(t1).getTime();
      const d2 = new Date(t2).getTime();
      return Math.abs(d1 - d2) < toleranceMs;
    } catch {
      return false;
    }
  }

  private indexEvents(events: string[]): Map<string, GovernanceEvent[]> {
    const map = new Map();
    for (const event of events) {
      const [header, body] = event.split('\n');
      const tsMatch = header.match(/^## (\d{4}-\d{2}-\d{2}T[^\s]+)/);
      // TASK-001 | REVIEW -> DONE | commit:abc | agent:human
      const bodyMatch = body.match(/^(TASK-\d{3}) \| ([^|]+)(?: \| commit:([^|]+))?(?: \| agent:([^|]+))?$/);
      
      if (tsMatch && bodyMatch) {
        const taskId = bodyMatch[1];
        const transition = bodyMatch[2].trim();
        const commitHash = bodyMatch[3]?.trim();
        const agentId = bodyMatch[4]?.trim();
        const timestamp = tsMatch[1];
        
        if (!map.has(taskId)) map.set(taskId, []);
        map.get(taskId).push({ timestamp, transition, commitHash, agentId });
      }
    }
    return map;
  }

  private async calibrateTask(task: ArchivedTaskMetrics, eventMap: Map<string, GovernanceEvent[]>): Promise<ArchivedTaskMetrics> {
    const taskEvents = eventMap.get(task.id) || [];
    const doneEvents = taskEvents.filter(e => e.transition === 'REVIEW -> DONE');
    
    let calibrated = { ...task };

    if (doneEvents.length > 1) {
      // Attack Surface 3: Ambiguous Attribution (Multiple DONE events)
      calibrated.integrity = 'INVALID';
      return calibrated;
    }

    const doneEvent = doneEvents[0];

    if (doneEvent) {
      const anchorTs = doneEvent.timestamp;

      // Severity 2: Completion Timestamp Forgery Detection
      if (task.completedAt && !this.isSameTime(task.completedAt, anchorTs, 2000)) {
        calibrated.integrity = 'INVALID';
      }
      calibrated.completedAt = anchorTs;

      // Attack Surface 2: Git Witness Illusion (Commit Verification)
      if (doneEvent.commitHash) {
        const commitExists = await this.gitRepository.isValidCommitHash(doneEvent.commitHash);
        if (!commitExists) {
          // Witness is missing or history was rewritten
          calibrated.integrity = 'INVALID';
        }
      } else {
        // Missing commit hash for a post-hardening event
        // (We could check a date threshold here, but for now degrade)
        if (calibrated.integrity !== 'INVALID') calibrated.integrity = 'MEDIUM';
      }

      // Attack Surface 3: Identity Integrity (Attribution)
      if (doneEvent.agentId) {
         // Placeholder for more complex agent verification (e.g., checking against config)
         // For now, if present it reinforces, if missing it degrades.
      } else {
        if (calibrated.integrity === 'HIGH') calibrated.integrity = 'MEDIUM';
      }

    } else if (task.completedAt) {
      // Attack Surface 1: Logistics-Governance Gap
      // Markdown says completed, and maybe git move found it, but NO governance record exists. 
      calibrated.integrity = 'INVALID';
      calibrated.completedAt = null; 
    }

    return calibrated;
  }

  private async loadEvents(): Promise<string[]> {
    const eventsPath = 'docs/EVENTS.md';
    if (!(await this.fileSystem.exists(eventsPath))) {
      return [];
    }

    const content = await this.fileSystem.readFile(eventsPath);

    // Severity 2: Truth Anchors - Detect non-append-only rewrites via git
    await this.verifyAppendOnly(eventsPath, content);

    const lines = content.split('\n');
    
    const uniqueEvents: string[] = [];
    let currentHeader = '';
    let lastTimestamp = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === '# Event Log') continue;

      if (trimmedLine.startsWith('## ')) {
        const tsMatch = trimmedLine.match(/^## (\d{4}-\d{2}-\d{2}T[^\s]+)/);
        if (!tsMatch) {
          throw new Error(`Integrity Violation: Malformed event header "${trimmedLine}" in docs/EVENTS.md`);
        }
        
        const timestamp = new Date(tsMatch[1]).getTime();
        if (isNaN(timestamp)) {
          throw new Error(`Integrity Violation: Invalid timestamp in header "${trimmedLine}"`);
        }

        if (timestamp < lastTimestamp) {
          throw new Error(`Integrity Violation: Chronological regression detected in docs/EVENTS.md. "${trimmedLine}" is older than previous entry.`);
        }

        lastTimestamp = timestamp;
        currentHeader = trimmedLine;
      } else if (trimmedLine.includes(' | ')) {
        // Broadened regex to support optional commit/agent fields
        const match = trimmedLine.match(/^TASK-\d{3} \| [A-Z_]+ -> [A-Z_]+( \| commit:[a-zA-Z0-9-]+)?( \| agent:[^|]+)?$/);
        if (!match) {
          throw new Error(`Integrity Violation: Malformed event entry "${trimmedLine}" in docs/EVENTS.md`);
        }
        uniqueEvents.push(`${currentHeader}\n${trimmedLine}`);
      } else {
        throw new Error(`Integrity Violation: Unexpected content "${trimmedLine}" in docs/EVENTS.md`);
      }
    }

    return uniqueEvents;
  }

  private async verifyAppendOnly(path: string, currentContent: string): Promise<void> {
    try {
      const diff = await this.gitRepository.getDiff(['HEAD', '--', path]);
      if (!diff) return;

      if (diff.includes('\n-') && !diff.includes('\n---')) {
        const lines = diff.split('\n');
        const hasDeletions = lines.some(line => line.startsWith('-') && !line.startsWith('---'));
        if (hasDeletions) {
           throw new Error(`Integrity Violation: Non-append-only rewrite detected in ${path}. Deletions found in git diff.`);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Integrity Violation')) throw e;
      // git errors (git not found, etc.) should not silently pass verification
      if (e instanceof Error && !e.message.includes('not a git repository') && !e.message.includes('No such file')) {
        throw new Error(`Integrity Violation: Cannot verify append-only constraint for ${path}: ${e.message}`);
      }
    }
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
    if (reviewFailRate === 'pending') return 'MEDIUM';

    const entropy = this.computeIntegrityEntropy(tasks);
    if (entropy > 0.5) return 'LOW';
    if (entropy > 0.1) return 'MEDIUM';
    return 'HIGH';
  }
}
