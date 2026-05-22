import { ArchivedTaskMetrics } from './archive-parser.js';
import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';
import { EpistemicDigest } from '../models/provenance.js';

export interface ActorStat {
  actor: string;
  size: string;
  avgTurns: number | null;
  avgCostUSD: number | null;
  taskCount: number;
}

export interface HanseiCategoryCount {
  category: string;
  count: number;
  severities: string[];
  isWeakSignal: boolean;
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
    heuristicCount: number;
    realCount: number;
  };
  reviewFailRate: number | 'pending';
  totalCompleted: number;
  integrityEntropy: number;
  integrityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID';
  provenance: EpistemicDigest;
  hanseiBreakdown: HanseiCategoryCount[];
  actorBreakdown: ActorStat[];
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
    private gitRepository: GitRepository,
    private eventsPath: string = 'docs/EVENTS.md'
  ) {}

  async calculate(archivedTasks: ArchivedTaskMetrics[]): Promise<CalculatedMetrics> {
    const events = await this.loadEvents();
    const eventMap = this.indexEvents(events);

    // Use the first event's timestamp as the "EventLogger operational threshold".
    // Tasks completed before this threshold are pre-operational and get MEDIUM/LOW (not INVALID)
    // even if no EVENTS.md entry exists for them.
    const firstEventTimestamp = this.extractFirstEventTimestamp(events);
    const calibratedTasks: ArchivedTaskMetrics[] = [];
    for (const task of archivedTasks) {
      calibratedTasks.push(await this.calibrateTask(task, eventMap, firstEventTimestamp));
    }
    
    const cycleTime = this.computeCycleTime(calibratedTasks);
    const costPerTask = this.computeCostPerTask(calibratedTasks);
    
    const reviewFailRate = this.computeReviewFailRate(events);

    const entropy = this.computeIntegrityEntropy(calibratedTasks);
    const globalIntegrity = this.computeGlobalIntegrity(calibratedTasks, reviewFailRate);
    const hanseiBreakdown = this.computeHanseiBreakdown(calibratedTasks);
    const actorBreakdown = this.computeActorBreakdown(calibratedTasks);

    return {
      cycleTime,
      costPerTask,
      reviewFailRate,
      totalCompleted: calibratedTasks.length,
      integrityEntropy: entropy,
      integrityLevel: globalIntegrity,
      provenance: {
        methodId: 'metrics-engine-v4-witness-hardened',
        gitRevRange: `HEAD~${archivedTasks.length}..HEAD`
      },
      hanseiBreakdown,
      actorBreakdown,
    };
  }


  private computeHanseiBreakdown(tasks: ArchivedTaskMetrics[]): HanseiCategoryCount[] {
    const map = new Map<string, { count: number; severities: string[] }>();
    for (const task of tasks) {
      if (!task.hanseiCategory || !task.hanseiSeverity) continue;
      if (task.hanseiSeverity === 'H0' || task.hanseiSeverity === 'H1') continue;
      const cat = task.hanseiCategory;
      if (!map.has(cat)) map.set(cat, { count: 0, severities: [] });
      const entry = map.get(cat)!;
      entry.count++;
      if (!entry.severities.includes(task.hanseiSeverity)) entry.severities.push(task.hanseiSeverity);
    }
    return Array.from(map.entries())
      .map(([category, { count, severities }]) => ({ category, count, severities, isWeakSignal: count >= 3 }))
      .sort((a, b) => b.count - a.count);
  }

  private computeActorBreakdown(tasks: ArchivedTaskMetrics[]): ActorStat[] {
    const THRESHOLD = 5;
    const actorTasks = tasks.filter(t => t.actor && t.actor !== 'unknown');
    if (actorTasks.length < THRESHOLD) return [];

    const groups = new Map<string, { turns: number[]; costs: number[]; count: number }>();
    for (const t of actorTasks) {
      const key = `${t.actor}::${t.size}`;
      if (!groups.has(key)) groups.set(key, { turns: [], costs: [], count: 0 });
      const g = groups.get(key)!;
      g.count++;
      if (t.turns !== null && t.turns !== undefined) g.turns.push(t.turns);
      if (t.cost !== null && t.cost !== undefined && t.costSource === 'real') g.costs.push(t.cost);
    }

    return Array.from(groups.entries()).map(([key, g]) => {
      const [actor, size] = key.split('::');
      const avgTurns = g.turns.length > 0 ? Math.round(g.turns.reduce((a, b) => a + b, 0) / g.turns.length) : null;
      const avgCostUSD = g.costs.length > 0 ? g.costs.reduce((a, b) => a + b, 0) / g.costs.length : null;
      return { actor, size, avgTurns, avgCostUSD, taskCount: g.count };
    }).sort((a, b) => b.taskCount - a.taskCount);
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

  private extractFirstEventTimestamp(events: string[]): number | null {
    for (const event of events) {
      const header = event.split('\n')[0];
      const tsMatch = header.match(/^## (\d{4}-\d{2}-\d{2}T[^\s]+)/);
      if (tsMatch) {
        const ts = new Date(tsMatch[1]).getTime();
        if (!isNaN(ts)) return ts;
      }
    }
    return null;
  }

  private async calibrateTask(task: ArchivedTaskMetrics, eventMap: Map<string, GovernanceEvent[]>, firstEventTimestamp: number | null): Promise<ArchivedTaskMetrics> {
    const taskEvents = eventMap.get(task.id) || [];
    const doneEvents = taskEvents.filter(e =>
      e.transition === 'REVIEW -> DONE' ||
      e.transition === 'IN_PROGRESS -> DONE' ||
      e.transition === 'DONE -> DONE'
    );
    
    let calibrated = { ...task };

    // Primary events: exclude DONE->DONE re-archivals (audit corrections, not duplicate completions)
    const primaryDoneEvents = doneEvents.filter(e => e.transition !== 'DONE -> DONE');
    // If no primary events, use only the first DONE->DONE to deduplicate re-archival noise
    const effectiveDoneEvents = primaryDoneEvents.length > 0
      ? primaryDoneEvents
      : doneEvents.slice(0, 1);

    if (effectiveDoneEvents.length > 1) {
      // Attack Surface 3: Ambiguous Attribution (Multiple independent DONE events)
      calibrated.integrity = 'INVALID';
      return calibrated;
    }

    const doneEvent = effectiveDoneEvents[0];

    if (doneEvent) {
      const anchorTs = doneEvent.timestamp;

      // Severity 2: Completion Timestamp Forgery Detection
      // 24h tolerance: accommodates retroactively-added events where Closed-at
      // and the EVENTS.md backfill timestamp diverge by design.
      // Real forgery (manufactured task history) would require exact manipulation
      // of both the task file and EVENTS.md — caught by the append-only check.
      if (task.completedAt && !this.isSameTime(task.completedAt, anchorTs, 86400000)) {
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
        // no-op: agent identity verification pending (future: check against arch.config.json allowlist)
      } else {
        if (calibrated.integrity === 'HIGH') calibrated.integrity = 'MEDIUM';
      }

    } else if (task.completedAt) {
      // Determine whether the EventLogger was operational when this task was completed.
      // Tasks completed before the first recorded event are "pre-operational" — the ledger
      // did not yet exist for them, so absence of an entry is not a governance violation.
      const completedAtMs = new Date(task.completedAt).getTime();
      const isPostOperational = firstEventTimestamp !== null && !isNaN(completedAtMs) && completedAtMs > firstEventTimestamp;

      if (!isPostOperational) {
        // Pre-operational: EventLogger not yet active for this task's completion
        if (calibrated.integrity === 'HIGH') calibrated.integrity = 'MEDIUM';
        else if (calibrated.integrity !== 'INVALID') calibrated.integrity = 'LOW';
      } else {
        // Attack Surface 1: Logistics-Governance Gap
        // EventLogger was operational but no DONE event recorded: governance violation
        calibrated.integrity = 'INVALID';
        calibrated.completedAt = null;
      }
    }

    return calibrated;
  }

  private async loadEvents(): Promise<string[]> {
    if (!(await this.fileSystem.exists(this.eventsPath))) {
      return [];
    }

    const content = await this.fileSystem.readFile(this.eventsPath);

    // Severity 2: Truth Anchors - Detect non-append-only rewrites via git
    await this.verifyAppendOnly(this.eventsPath, content);

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
          throw new Error(`Integrity Violation: Malformed event header "${trimmedLine}" in ${this.eventsPath}`);
        }
        
        const timestamp = new Date(tsMatch[1]).getTime();
        if (isNaN(timestamp)) {
          throw new Error(`Integrity Violation: Invalid timestamp in header "${trimmedLine}"`);
        }

        if (timestamp < lastTimestamp) {
          throw new Error(`Integrity Violation: Chronological regression detected in ${this.eventsPath}. "${trimmedLine}" is older than previous entry.`);
        }

        lastTimestamp = timestamp;
        currentHeader = trimmedLine;
      } else if (trimmedLine.includes(' | ')) {
        // Broadened regex to support optional commit/agent fields
        const match = trimmedLine.match(/^TASK-\d{3} \| [A-Z_]+ -> [A-Z_]+( \| commit:[a-zA-Z0-9-]+)?( \| agent:[^|]+)?$/);
        if (!match) {
          throw new Error(`Integrity Violation: Malformed event entry "${trimmedLine}" in ${this.eventsPath}`);
        }
        uniqueEvents.push(`${currentHeader}\n${trimmedLine}`);
      } else {
        throw new Error(`Integrity Violation: Unexpected content "${trimmedLine}" in ${this.eventsPath}`);
      }
    }

    // detect a header written without a subsequent event body (interrupted write)
    if (currentHeader && (uniqueEvents.length === 0 || !uniqueEvents[uniqueEvents.length - 1].startsWith(currentHeader))) {
      throw new Error(`Integrity Violation: Incomplete event in ${this.eventsPath} — header "${currentHeader}" has no event body. File may have been written mid-operation.`);
    }

    return uniqueEvents;
  }

  private async verifyAppendOnly(path: string, currentContent: string): Promise<void> {
    try {
      const diff = await this.gitRepository.getDiff(['HEAD', '--', path]);
      if (!diff) return;

      const lines = diff.split('\n');
      const hasDeletions = lines.some(line => line.startsWith('-') && !line.startsWith('---'));
      if (hasDeletions) {
        throw new Error(`Integrity Violation: Non-append-only rewrite detected in ${path}. Deletions found in git diff.`);
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

    let realCount = 0;
    let heuristicCount = 0;

    const totalCost = tasks.reduce((sum, t) => {
      if (t.costSource === 'real' && t.cost !== null) {
        realCount++;
        return sum + t.cost;
      }
      heuristicCount++;
      const cost = t.cost !== null ? t.cost : (heuristics[t.size] || 0);
      return sum + cost;
    }, 0);

    return {
      average: tasks.length > 0 ? totalCost / tasks.length : 0,
      heuristicCount,
      realCount,
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
