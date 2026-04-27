import path from 'node:path';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus } from '../../domain/models/task.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { DriftChecker } from '../../domain/services/drift-checker.js';

export class GenerateInbox {
  private inboxFile = 'docs/INBOX.md';
  private refinementDir = 'docs/refinement';

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    private reviewer: Reviewer,
    private driftChecker?: DriftChecker
  ) {}

  async execute() {
    const tasks = await this.taskRepository.getAll();
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE && t.status !== TaskStatus.REJECTED);
    
    const urgentItems: string[] = [];
    const pendingIdeas: string[] = [];
    
    // 1. Detect Urgent: P0/P1 tasks in Focus:yes
    const focusTasks = activeTasks.filter(t => t.rawMetaLine?.includes('Focus:yes'));
    for (const t of focusTasks) {
      if (t.priority === 'P0' || t.priority === 'P1') {
        urgentItems.push(`[${t.id}] ${t.title} (${t.priority}) - Active in Focus`);
      }
    }

    // 2. Detect Urgent: Review violations
    for (const t of activeTasks) {
      const result = this.reviewer.reviewTask(t, t.rawMetaLine);
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
          if (content.includes('Status: DRAFT')) {
            const titleMatch = content.match(/^# IDEA: (.*)/m) || content.match(/^## (IDEA-.*)/m);
            const title = titleMatch ? titleMatch[1] : file;
            pendingIdeas.push(`${title} (${file})`);
          }
        }
      }
    }

    // 5. Build INBOX.md content
    const date = new Date().toISOString().split('T')[0];
    let content = `# INBOX\n<!-- Weekly dashboard for human-agent coordination -->\n<!-- Generated on: ${date} -->\n\n`;
    
    content += `## Status Summary\n`;
    const ready = activeTasks.filter(t => t.status === TaskStatus.READY).length;
    const inProgress = activeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const review = activeTasks.filter(t => t.status === TaskStatus.REVIEW).length;
    content += `- **Active Tasks:** ${inProgress}\n`;
    content += `- **In Review:** ${review}\n`;
    content += `- **Backlog (Ready):** ${ready}\n\n`;

    content += `## Urgent / Actions Required\n`;
    if (urgentItems.length > 0) {
      urgentItems.forEach(item => content += `- [ ] ${item}\n`);
    } else {
      content += `_No urgent items detected._\n`;
    }
    content += `\n`;

    content += `## Refinement Queue\n`;
    if (pendingIdeas.length > 0) {
      pendingIdeas.forEach(idea => content += `- ${idea}\n`);
    } else {
      content += `_No pending ideas._\n`;
    }
    content += `\n`;

    content += `## Recent Activity\n`;
    const lastCommit = await this.gitRepository.getLastCommitMessage();
    content += `- **Last Commit:** ${lastCommit || 'None'}\n`;

    await this.fileSystem.writeFile(this.inboxFile, content);
    return this.inboxFile;
  }
}
