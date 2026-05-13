import path from 'node:path';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus, Task } from '../../domain/models/task.js';
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
    const focusTasks = activeTasks.filter(t => t.focus);
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
}
