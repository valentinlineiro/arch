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
    const targetDir = task.status === TaskStatus.DONE ? this.archiveDir : this.tasksDir;
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

      return {
        id,
        title,
        priority: metaParts[0] || '',
        size: metaParts[1] || '',
        status: (metaParts[2] || '') as TaskStatus,
        sprint: metaParts[3] || '',
        class: metaParts[4] || '',
        cli: metaParts[5] || '',
        context: (metaParts[6] || '').split(',').map(s => s.trim()),
        acceptanceCriteria,
        rawMetaLine: `**Meta:** ${metaLine}`
      };
    }
    return null;
  }
}
