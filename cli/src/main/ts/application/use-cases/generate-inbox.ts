import path from 'node:path';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus, Task, FocusLevel } from '../../domain/models/task.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { DriftChecker, DriftResult } from '../use-cases/drift-checker.js';
import { EscalationStore, EscalationEntry } from './escalation-store.js';

export interface InboxData {
  summary: {
    active: number;
    review: number;
    ready: number;
  };
  urgent: string[];
  escalations: EscalationEntry[];
  refinement: string[];
  sprint?: {
    name: string;
    progress: string;
    openTasks: Task[];
  };
}

export interface DecisionItem {
  slug: string;
  title: string;
  problem: string;
  sessions: number;
  created: string;
  decisionRequired: boolean;
}

export class GenerateInbox {
  private refinementDir = 'docs/refinement';

  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private reviewer: Reviewer,
    private driftChecker?: DriftChecker
  ) {}

  async execute(): Promise<InboxData> {
    const activeTasks = await this.taskRepository.getActive();

    const urgentItems: string[] = [];
    const pendingIdeas: string[] = [];

    // 0. Read OPEN escalations from structured store (source of truth for active halts)
    const escalationStore = new EscalationStore(this.fileSystem);
    const openEscalations = await escalationStore.getOpen();
    for (const esc of openEscalations) {
      if (esc.type === 'ANDON_HALT') {
        urgentItems.push(`[ANDON_HALT] ${esc.subject}: ${esc.reason} (${esc.escalation_id})`);
      }
    }
    
    // 1. Detect Urgent: P0/P1 tasks in Focus:yes
    const focusTasks = activeTasks.filter(t => t.focus !== FocusLevel.NONE);
    for (const t of focusTasks) {
      if (t.priority === 'P0' || t.priority === 'P1') {
        urgentItems.push(`[${t.id}] ${t.title} (${t.priority}) - Active in Focus`);
      }
    }

    // 2. Detect Urgent: Review violations
    for (const t of activeTasks) {
      const result = this.reviewer.reviewTask(t, t.rawMetaLine || '');
      if (!result.valid) {
        urgentItems.push(`[${t.id}] Validation Failure: ${result.violations[0]}`);
      }
    }

    // 3. Detect Urgent: Drift
    if (this.driftChecker) {
      const drift = await this.driftChecker.check();
      for (const d of drift) {
        if (d.status === 'WARN') {
          urgentItems.push(`Drift: ${d.check} - ${d.details[0]}`);
        }
      }
    }

    // 4. Detect Pending: DRAFT IDEAs
    if (await this.fileSystem.exists(this.refinementDir)) {
      const ideaFiles = await this.fileSystem.readDirectory(this.refinementDir);
      for (const file of ideaFiles) {
        if (file.startsWith('IDEA-') && file.endsWith('.md')) {
          const content = await this.fileSystem.readFile(path.join(this.refinementDir, file));
          if (/\*{0,2}Status:\*{0,2} DRAFT/.test(content)) {
            const titleMatch = content.match(/^# IDEA: (.*)/m) || content.match(/^## (IDEA-.*)/m);
            const title = titleMatch ? titleMatch[1] : file;
            pendingIdeas.push(`${title} (${file})`);
          }
        }
      }
    }

    const configPath = 'arch.config.json';
    let sprintData: InboxData['sprint'];
    try {
      const configContent = await this.fileSystem.readFile(configPath);
      const config = JSON.parse(configContent);
      if (config.currentSprint) {
        const sprintTasks = activeTasks.filter(t => t.sprint === config.currentSprint);
        const totalSprint = sprintTasks.length;
        const doneSprint = sprintTasks.filter(t => t.status === TaskStatus.DONE).length;
        sprintData = {
          name: config.currentSprint,
          progress: `${doneSprint}/${totalSprint}`,
          openTasks: sprintTasks.filter(t => t.status !== TaskStatus.DONE)
        };
      }
    } catch {
      // Ignore
    }

    return {
      summary: {
        active: activeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        review: activeTasks.filter(t => t.status === TaskStatus.REVIEW).length,
        ready: activeTasks.filter(t => t.status === TaskStatus.READY).length,
      },
      urgent: urgentItems,
      escalations: openEscalations,
      refinement: pendingIdeas,
      sprint: sprintData
    };
  }

  async getDecisionQueue(): Promise<DecisionItem[]> {
    const refinementDir = `${this.refinementDir}`;
    const items: DecisionItem[] = [];

    let files: string[] = [];
    try {
      const allFiles = await this.fileSystem.readDirectory(refinementDir);
      files = allFiles.filter(f => f.startsWith('IDEA-') && f.endsWith('.md'));
    } catch {
      return [];
    }

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${refinementDir}/${file}`);

      // Only include if Decision field is empty/missing
      const dIdx = content.indexOf('## Decision');
      const dStart = dIdx >= 0 ? content.indexOf('\n', dIdx) + 1 : -1;
      const dEnd = dStart > 0 ? content.indexOf('\n', dStart) : -1;
      const dLine = dStart > 0 && dEnd > 0 ? content.slice(dStart, dEnd).trim() : '';
      const hasDecision = dIdx >= 0 && dLine !== '' && !dLine.startsWith('<!--');
      if (hasDecision) continue;

      const slug = file.replace('.md', '');

      const titleMatch = content.match(/^# IDEA: (.*)/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;

      const problemStart = content.indexOf('## Problem');
      const problemBodyStart = problemStart >= 0 ? content.indexOf('\n', problemStart) + 1 : -1;
      const problemBodyEnd = problemBodyStart > 0 ? content.indexOf('\n##', problemBodyStart) : -1;
      const problem = problemBodyStart > 0 && problemBodyEnd > 0
        ? content.slice(problemBodyStart, problemBodyEnd).trim().split('\n')[0].slice(0, 100)
        : 'No problem description.';

      const sessionsMatch = content.match(/\*\*Sessions:\*\*\s*(\d+)/);
      const sessions = sessionsMatch ? parseInt(sessionsMatch[1], 10) : 0;

      const createdMatch = content.match(/\*\*Created:\*\*\s*([\d-]+)/);
      const created = createdMatch ? createdMatch[1] : 'unknown';

      const decisionRequired = content.includes('**Decision-required:** yes');

      items.push({ slug, title, problem, sessions, created, decisionRequired });
    }

    return items.sort((a, b) => b.sessions - a.sessions);
  }
  async getResurrectQueue(): Promise<DecisionItem[]> {
    const archiveDir = `${this.refinementDir}/archive`;
    const items: DecisionItem[] = [];

    let files: string[] = [];
    try {
      const allFiles = await this.fileSystem.readDirectory(archiveDir);
      files = allFiles.filter(f => f.startsWith('IDEA-') && f.endsWith('.md'));
    } catch {
      return [];
    }

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);

      // Only include TTL-expired or DEFERRED IDEAs
      const statusMatch = content.match(/\*\*Status:\*\*\s*(\S+)/);
      const status = statusMatch?.[1] ?? '';
      if (!status.includes('DEFERRED') && !status.includes('REJECTED')) continue;

      // Check Decision field for TTL expired or DEFERRED
      const dIdx = content.indexOf('## Decision');
      const dStart = dIdx >= 0 ? content.indexOf('\n', dIdx) + 1 : -1;
      const dEnd = dStart > 0 ? content.indexOf('\n##', dStart) : -1;
      const dLine = dStart > 0 ? (dEnd > 0 ? content.slice(dStart, dEnd) : content.slice(dStart)).trim() : '';

      const isResurrectable = dLine.includes('TTL expired') || status.includes('DEFERRED');
      if (!isResurrectable) continue;

      const slug = file.replace('.md', '');

      const titleMatch = content.match(/^# IDEA: (.*)/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;

      const problemStart = content.indexOf('## Problem');
      const problemBodyStart = problemStart >= 0 ? content.indexOf('\n', problemStart) + 1 : -1;
      const problemBodyEnd = problemBodyStart > 0 ? content.indexOf('\n##', problemBodyStart) : -1;
      const problem = problemBodyStart > 0 && problemBodyEnd > 0
        ? content.slice(problemBodyStart, problemBodyEnd).trim().split('\n')[0].slice(0, 100)
        : 'No problem description.';

      const sessionsMatch = content.match(/\*\*Sessions:\*\*\s*(\d+)/);
      const sessions = sessionsMatch ? parseInt(sessionsMatch[1], 10) : 0;

      const createdMatch = content.match(/\*\*Created:\*\*\s*([\d-]+)/);
      const created = createdMatch ? createdMatch[1] : 'unknown';

      items.push({ slug, title, problem, sessions, created, decisionRequired: false });
    }

    // Sort by created date ascending (oldest first)
    return items.sort((a, b) => a.created.localeCompare(b.created));
  }


}
