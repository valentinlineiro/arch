import path from 'node:path';
import { Task, TaskRepository, TaskStatus, AcceptanceCriterion } from '../../domain/models/task.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class MarkdownTaskRepository implements TaskRepository {
  private tasksDir = 'docs/tasks';
  private archiveDir = 'docs/archive';

  constructor(private fileSystem: FileSystem) {}

  async getById(id: string): Promise<Task | null> {
    const tasks = await this.getAll();
    return tasks.find(t => t.id === id) || null;
  }

  async findReady(): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.status === TaskStatus.READY);
  }

  async getNextId(): Promise<string> {
    const tasks = await this.getAll();
    const ids = tasks
      .map(t => t.id)
      .filter(id => /^TASK-\d{3}$/.test(id))
      .map(id => parseInt(id.split('-')[1], 10));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `TASK-${(maxId + 1).toString().padStart(3, '0')}`;
  }

  async getActive(): Promise<Task[]> {
    return this.loadTasksFromDir(this.tasksDir);
  }

  async getAll(): Promise<Task[]> {
    const activeTasks = await this.loadTasksFromDir(this.tasksDir);
    const archiveTasks = await this.loadTasksFromDir(this.archiveDir);
    return [...activeTasks, ...archiveTasks];
  }

  private async loadTasksFromDir(dirPath: string): Promise<Task[]> {
    if (!(await this.fileSystem.exists(dirPath))) {
      return [];
    }
    const files = await this.fileSystem.readDirectory(dirPath);
    const tasks: Task[] = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await this.fileSystem.readFile(path.join(dirPath, file));
        const task = this.parseTask(content);
        if (task) tasks.push(task);
      }
    }
    return tasks;
  }

  async save(task: Task): Promise<void> {
    const targetDir = (task.status === TaskStatus.DONE || task.status === TaskStatus.REJECTED) ? this.archiveDir : this.tasksDir;
    const targetPath = path.join(targetDir, `${task.id}.md`);

    const tasksPath = path.join(this.tasksDir, `${task.id}.md`);
    const archivePath = path.join(this.archiveDir, `${task.id}.md`);

    let currentPath = '';
    if (await this.fileSystem.exists(tasksPath)) {
      currentPath = tasksPath;
    } else if (await this.fileSystem.exists(archivePath)) {
      currentPath = archivePath;
    }

    let content = '';
    if (currentPath) {
      content = await this.fileSystem.readFile(currentPath);
    } else {
      content = `## ${task.id}: ${task.title}\n${task.rawMetaLine}\n\n### Acceptance Criteria\n${task.acceptanceCriteria.map(ac => `- [${ac.completed ? 'x' : ' '}] ${ac.description}`).join('\n')}`;
    }

    const statusRegex = new RegExp(`(\\n\\*\\*Meta:\\*\\* .*?\\| )(IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED)`, 's');
    content = content.replace(statusRegex, `$1${task.status}`);

    const ensureField = (fieldName: string, value: string | undefined) => {
      if (value && !content.includes(`**${fieldName}:**`)) {
        const insertionMatch = content.match(/^(\*\*(Depends|Sprint|Meta):\*\*.*?\n)/m);
        if (insertionMatch) {
          content = content.replace(insertionMatch[0], `${insertionMatch[0]}**${fieldName}:** ${value}\n`);
        }
      }
    };

    ensureField('Closed-at', task.closedAt);
    ensureField('Rejected-at', task.rejectedAt);
    ensureField('Reason', task.rejectionReason);

    if (currentPath && currentPath !== targetPath) {
      await this.fileSystem.writeFile(currentPath, content);
      await this.fileSystem.rename(currentPath, targetPath);
    } else {
      await this.fileSystem.writeFile(targetPath, content);
    }
  }

  private parseTask(content: string): Task | null {
    const headerMatch = content.match(/^## (TASK-\d{3}): (.*)/m);
    const metaMatch = content.match(/^\*\*Meta:\*\* (.*)/m);

    if (headerMatch && metaMatch) {
      const id = headerMatch[1];
      const title = headerMatch[2];
      const metaLine = metaMatch[1];
      const metaParts = metaLine.split('|').map(s => s.trim());

      const acceptanceCriteria: AcceptanceCriterion[] = [];
      const acSectionMatch = content.match(/### Acceptance Criteria\n([\s\S]*?)(\n### |$)/);
      if (acSectionMatch) {
        const acItemRegex = /- \[(x| )\] (.*)/g;
        let m;
        while ((m = acItemRegex.exec(acSectionMatch[1])) !== null) {
          acceptanceCriteria.push({ completed: m[1] === 'x', description: m[2].trim() });
        }
      }

      const closedAtMatch = content.match(/^\*\*Closed-at:\*\* (.*)/m);
      const rejectedAtMatch = content.match(/^\*\*Rejected-at:\*\* (.*)/m);
      const rejectionReasonMatch = content.match(/^\*\*Reason:\*\* (.*)/m);
      const sprintMatch = content.match(/^\*\*Sprint:\*\* (.*)/m);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);

      return {
        id,
        title,
        priority: metaParts[0] || '',
        size: metaParts[1] || '',
        status: (metaParts[2] || '') as TaskStatus,
        sprint: sprintMatch?.[1]?.trim() || '',
        class: metaParts[4] || '',
        cli: metaParts[5] || '',
        context: (metaParts[6] || '').split(',').map(s => s.trim()),
        closedAt: closedAtMatch?.[1],
        rejectedAt: rejectedAtMatch?.[1],
        rejectionReason: rejectionReasonMatch?.[1],
        depends: dependsMatch ? dependsMatch[1].split(',').map(s => s.trim()) : undefined,
        acceptanceCriteria,
        rawMetaLine: `**Meta:** ${metaLine}`,
        rawDependsLine: dependsMatch ? dependsMatch[0] : undefined
      };
    }
    return null;
  }
}
