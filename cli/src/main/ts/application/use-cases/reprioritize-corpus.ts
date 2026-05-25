import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { Task } from '../../domain/models/task.js';
import { TaskStatus } from '../../domain/models/task.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export const DEMOTION_BOUND = 1;
export const CAUSAL_RECURRENCE_THRESHOLD = 3;
export const RECENCY_GUARD_DAYS = 30;

const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3'];

function priorityIndex(p: string): number {
  return PRIORITY_ORDER.indexOf(p);
}

function priorityFromIndex(i: number): string {
  return PRIORITY_ORDER[Math.max(0, Math.min(3, i))] ?? 'P3';
}

export interface PriorityDiffEntry {
  taskId: string;
  currentPriority: string;
  proposedPriority: string;
  signals: {
    recurrenceCount: number;
    fanOutCount: number;
    causalAncestry: string | null;
    ageDays: number;
    classMismatch: boolean;
  };
  reason: string;
}

export interface EcpRecord {
  ecp_id: string;
  canonical_signature: string;
  state: 'ECP_CREATED' | 'ECP_STABLE' | 'ECP_CANDIDATE' | 'ACTIVE' | 'REJECTED' | 'DISCARDED';
  confidence: number;
  recurrence_count: number;
  class_field: string;
  task_ids: string[];
  created_at: string;
  updated_at: string;
}

export type UnclassifiedCluster = {
  class_field: string;
  task_ids: string[];
  recurrence_count: number;
};

const ECP_REGISTRY_PATH = `${PathResolver.from({}).archDir}/ecp-registry.jsonl`;

function computeEcpId(classField: string, taskIds: string[]): string {
  const signature = JSON.stringify(classField) + '|' + JSON.stringify([...taskIds].sort());
  return createHash('sha256').update(signature).digest('hex').slice(0, 12);
}

export class ReprioritizeCorpus {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {}

  async execute(): Promise<{ diff: PriorityDiffEntry[]; ecpPath: string }> {
    const allTasks = await this.taskRepository.getAll();
    const readyTasks = allTasks.filter(t => t.status === TaskStatus.READY);
    const archiveTasks = await this.loadArchiveTasks();

    const diff: PriorityDiffEntry[] = [];

    for (const task of readyTasks) {
      const entry = await this.scoreTask(task, readyTasks, archiveTasks);
      if (entry.proposedPriority !== entry.currentPriority) {
        diff.push(entry);
      }
    }

    // Detect UNCLASSIFIED clusters and write ECP registry
    const clusters = this.detectUnclassifiedClusters(archiveTasks);
    await this.updateEcpRegistry(clusters);

    return { diff, ecpPath: `${this.rootPath}/${ECP_REGISTRY_PATH}` };
  }

  private async scoreTask(
    task: Task,
    readyTasks: Task[],
    archiveTasks: { id: string; class_: string; hansei: { category: string; severity: string } | null; closedAt: string | null }[],
  ): Promise<PriorityDiffEntry> {
    const now = new Date();
    const createdAt = task.createdAt ? new Date(task.createdAt) : null;
    const ageDays = createdAt ? Math.floor((now.getTime() - createdAt.getTime()) / 86400000) : 0;

    // I7 — Human recency guard: tasks with priority set or confirmed within 30 days are not demoted
    const recencyProtected = createdAt
      ? (now.getTime() - createdAt.getTime()) / 86400000 < RECENCY_GUARD_DAYS
      : false;

    // Signal 1 — Recurrence count: archived tasks whose Hansei category matches this task's class
    // RECENCY_GUARD referenced here to mark the policy application point
    const taskClass = task.class ?? '';
    const recurrenceCount = archiveTasks.filter(
      a => a.hansei && a.hansei.category.includes(taskClass.replace(/^\d+-/, '').split('-')[0] ?? ''),
    ).length;

    // Signal 2 — Fan-out: direct dependents only (1 hop) — direct.*fan.out
    const directFanOut = readyTasks.filter(
      t => t.id !== task.id && (t.depends ?? []).includes(task.id),
    ).length;

    // Signal 3 — Causal ancestry: is this a forward action from H0/H1?
    const causalAncestry = await this.findCausalAncestry(task.id, archiveTasks);

    // Signal 4 — Class mismatch: P3 task in class that has H0/H1 history
    const classMismatch = task.priority === 'P3' && archiveTasks.some(
      a => a.hansei && ['H0', 'H1'].includes(a.hansei.severity) && a.class_ === taskClass,
    );

    // Bias calculation (advisory only)
    let priorityDelta = 0;

    if (recurrenceCount >= CAUSAL_RECURRENCE_THRESHOLD && !recencyProtected) {
      priorityDelta -= 1; // bump priority up (lower index = higher priority)
    }

    if (directFanOut >= 3 && !recencyProtected) {
      priorityDelta -= 1;
    }

    if (causalAncestry) {
      priorityDelta -= 1;
    }

    if (classMismatch) {
      priorityDelta -= 1;
    }

    // Age demotion (>60 days READY with no signals = stale estimate)
    if (ageDays > 60 && recurrenceCount === 0 && directFanOut === 0 && !causalAncestry && !recencyProtected) {
      priorityDelta += 1; // lower priority
    }

    // I4 — DEMOTION_BOUND: cap demotion at -1 per pass unless strong evidence
    const isStrongEvidence = recurrenceCount >= 2 * CAUSAL_RECURRENCE_THRESHOLD && causalAncestry !== null;
    const maxDemotion = isStrongEvidence ? 2 : DEMOTION_BOUND;

    const currentIndex = priorityIndex(task.priority);
    if (currentIndex === -1) {
      return this.noDiff(task, ageDays, recurrenceCount, directFanOut, causalAncestry, classMismatch);
    }

    // Clamp promotion (priorityDelta < 0 means "higher priority = lower index")
    const rawNewIndex = currentIndex + Math.min(priorityDelta, maxDemotion) * (priorityDelta < 0 ? -1 : 1);
    // Re-express: positive delta = demotion (higher index), negative delta = promotion (lower index)
    const newIndex = currentIndex - Math.min(-priorityDelta, 4) + Math.min(priorityDelta > 0 ? priorityDelta : 0, maxDemotion);

    // Simplify: positive score = promote, negative = demote
    const finalDelta = -(Math.sign(priorityDelta) * Math.min(Math.abs(priorityDelta), priorityDelta > 0 ? maxDemotion : 4));
    const proposedIndex = Math.max(0, Math.min(3, currentIndex + finalDelta));

    const proposedPriority = priorityFromIndex(proposedIndex);

    const reason = this.buildReason(recurrenceCount, directFanOut, causalAncestry, classMismatch, ageDays, recencyProtected);

    return {
      taskId: task.id,
      currentPriority: task.priority,
      proposedPriority,
      signals: { recurrenceCount, fanOutCount: directFanOut, causalAncestry, ageDays, classMismatch },
      reason,
    };
  }

  private noDiff(task: Task, ageDays: number, recurrenceCount: number, directFanOut: number, causalAncestry: string | null, classMismatch: boolean): PriorityDiffEntry {
    return {
      taskId: task.id,
      currentPriority: task.priority,
      proposedPriority: task.priority,
      signals: { recurrenceCount, fanOutCount: directFanOut, causalAncestry, ageDays, classMismatch },
      reason: 'no signal',
    };
  }

  private buildReason(recurrenceCount: number, fanOut: number, causalAncestry: string | null, classMismatch: boolean, ageDays: number, recencyProtected: boolean): string {
    const parts: string[] = [];
    if (recurrenceCount >= CAUSAL_RECURRENCE_THRESHOLD) parts.push(`recurrence:${recurrenceCount}`);
    if (fanOut >= 3) parts.push(`fan-out:${fanOut}`);
    if (causalAncestry) parts.push(`causal:${causalAncestry}`);
    if (classMismatch) parts.push('class-mismatch');
    if (ageDays > 60) parts.push(`age:${ageDays}d`);
    if (recencyProtected) parts.push('recency-protected');
    return parts.join(' | ') || 'no signal';
  }

  private async findCausalAncestry(
    taskId: string,
    archiveTasks: { id: string; hansei: { category: string; severity: string } | null; content: string }[],
  ): Promise<string | null> {
    for (const archived of archiveTasks) {
      if (!archived.hansei) continue;
      if (!['H0', 'H1'].includes(archived.hansei.severity)) continue;
      if (archived.content.includes(`TASK-${taskId.replace('TASK-', '')}`) ||
          archived.content.includes(taskId)) {
        return `${archived.id}:${archived.hansei.severity}`;
      }
    }
    return null;
  }

  private async loadArchiveTasks(): Promise<Array<{
    id: string;
    class_: string;
    content: string;
    hansei: { category: string; severity: string } | null;
    closedAt: string | null;
  }>> {
    const archiveDir = `${this.rootPath}/${PathResolver.from({}).archive}`;
    const results = [];

    let files: string[] = [];
    try {
      files = (await this.fileSystem.readDirectory(archiveDir))
        .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
    } catch {
      return [];
    }

    for (const file of files) {
      try {
        const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
        const id = file.replace('.md', '');
        const metaLine = content.match(/\*\*Meta:\*\*\s*(.+)/)?.[1] ?? '';
        const metaFields = metaLine.split('|').map(f => f.trim());
        const class_ = metaFields[4] ?? '';

        const closedMatch = content.match(/Closed-at:\s*([^\s|*\n]+)/);
        const closedAt = closedMatch?.[1] ?? null;

        const hanseiSection = content.slice(content.lastIndexOf('## Hansei'));
        const severity = hanseiSection.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1] ?? '';
        const category = hanseiSection.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] ?? '';

        const hansei = severity && category ? { severity, category } : null;

        results.push({ id, class_, content, hansei, closedAt });
      } catch { /* skip */ }
    }

    return results;
  }

  private detectUnclassifiedClusters(archiveTasks: { class_: string; id: string; hansei: { category: string } | null }[]): UnclassifiedCluster[] {
    const clusterMap = new Map<string, { taskIds: Set<string>; count: number }>();

    for (const task of archiveTasks) {
      if (!task.hansei) continue;
      if (task.class_ && !clusterMap.has(task.class_)) {
        clusterMap.set(task.class_, { taskIds: new Set(), count: 0 });
      }
      if (task.class_) {
        const cluster = clusterMap.get(task.class_)!;
        cluster.taskIds.add(task.id);
        cluster.count++;
      }
    }

    const clusters: UnclassifiedCluster[] = [];
    for (const [classField, { taskIds, count }] of clusterMap) {
      if (count >= CAUSAL_RECURRENCE_THRESHOLD) {
        clusters.push({ class_field: classField, task_ids: Array.from(taskIds), recurrence_count: count });
      }
    }
    return clusters;
  }

  private async updateEcpRegistry(clusters: UnclassifiedCluster[]): Promise<void> {
    const registryPath = `${this.rootPath}/${ECP_REGISTRY_PATH}`;

    // Load existing registry
    const existingIds = new Set<string>();
    try {
      const raw = await this.fileSystem.readFile(registryPath);
      for (const line of raw.trim().split('\n').filter(Boolean)) {
        const record = JSON.parse(line) as EcpRecord;
        existingIds.add(record.ecp_id);
      }
    } catch { /* file doesn't exist yet */ }

    const newRecords: EcpRecord[] = [];
    const now = new Date().toISOString();

    for (const cluster of clusters) {
      const ecp_id = computeEcpId(cluster.class_field, cluster.task_ids);
      if (existingIds.has(ecp_id)) continue;

      const confidence = Math.min(1.0, cluster.recurrence_count / (2 * CAUSAL_RECURRENCE_THRESHOLD));
      const state: EcpRecord['state'] = cluster.recurrence_count >= 2 * CAUSAL_RECURRENCE_THRESHOLD
        ? 'ECP_STABLE'
        : 'ECP_CREATED';

      newRecords.push({
        ecp_id,
        canonical_signature: JSON.stringify(cluster.class_field) + '|' + JSON.stringify([...cluster.task_ids].sort()),
        state,
        confidence,
        recurrence_count: cluster.recurrence_count,
        class_field: cluster.class_field,
        task_ids: cluster.task_ids,
        created_at: now,
        updated_at: now,
      });
    }

    for (const record of newRecords) {
      await this.fileSystem.appendFile(registryPath, JSON.stringify(record) + '\n');
    }
  }
}
