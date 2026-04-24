import path from 'node:path';
import { Task, TaskRepository, TaskStatus, AcceptanceCriterion } from '../../domain/models/task.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class MarkdownTaskRepository implements TaskRepository {
  private sprintDir = 'docs/tasks/sprint';
  private backlogDir = 'docs/tasks/backlog';
  private archiveDir = 'docs/archive';
  private doneFile = 'docs/DONE.md';

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
    const sprintTasks = await this.loadTasksFromDir(this.sprintDir, 'Sprint 1');
    const backlogTasks = await this.loadTasksFromDir(this.backlogDir, 'Backlog');
    const archiveTasks = await this.loadTasksFromDir(this.archiveDir, 'Archive');
    
    return [...sprintTasks, ...backlogTasks, ...archiveTasks];
  }

  private async loadTasksFromDir(dirPath: string, defaultSprint: string): Promise<Task[]> {
    if (!(await this.fileSystem.exists(dirPath))) {
      return [];
    }
    const files = await this.fileSystem.readDirectory(dirPath);
    const tasks: Task[] = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await this.fileSystem.readFile(path.join(dirPath, file));
        const task = this.parseTask(content, defaultSprint);
        if (task) {
          tasks.push(task);
        }
      }
    }
    return tasks;
  }

  async save(task: Task): Promise<void> {
    let targetDir: string;
    if (task.status === TaskStatus.DONE) {
      targetDir = this.archiveDir;
    } else {
      const isSprintTask = task.sprint.startsWith('Sprint');
      targetDir = isSprintTask ? this.sprintDir : this.backlogDir;
    }
    
    const targetPath = path.join(targetDir, `${task.id}.md`);
    
    // Check if task needs to be moved
    const sprintPath = path.join(this.sprintDir, `${task.id}.md`);
    const backlogPath = path.join(this.backlogDir, `${task.id}.md`);
    const archivePath = path.join(this.archiveDir, `${task.id}.md`);
    
    let currentPath = '';
    if (await this.fileSystem.exists(sprintPath)) {
      currentPath = sprintPath;
    } else if (await this.fileSystem.exists(backlogPath)) {
      currentPath = backlogPath;
    } else if (await this.fileSystem.exists(archivePath)) {
      currentPath = archivePath;
    }

    // Update Meta line in content
    let content = '';
    if (currentPath) {
      content = await this.fileSystem.readFile(currentPath);
    } else {
      // New task - create basic structure
      content = `## ${task.id}: ${task.title}\n${task.rawMetaLine}\n\n### Acceptance Criteria\n${task.acceptanceCriteria.map(ac => `- [${ac.completed ? 'x' : ' '}] ${ac.description}`).join('\n')}`;
    }

    const statusRegex = new RegExp(`(\\n\\*\\*Meta:\\*\\* .*?\\| )(IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED)`, 's');
    content = content.replace(statusRegex, `$1${task.status}`);

    if (currentPath && currentPath !== targetPath) {
      // Move file
      await this.fileSystem.writeFile(currentPath, content);
      await this.fileSystem.rename(currentPath, targetPath);
    } else {
      await this.fileSystem.writeFile(targetPath, content);
    }

    // If marked as DONE, also update DONE.md table
    if (task.status === TaskStatus.DONE) {
      await this.updateDoneTable(task);
    }
  }

  private async updateDoneTable(task: Task): Promise<void> {
    if (!(await this.fileSystem.exists(this.doneFile))) {
      return;
    }
    let content = await this.fileSystem.readFile(this.doneFile);
    if (content.includes(`| ${task.id} |`)) {
      return; // Already in table
    }

    const today = new Date().toISOString().split('T')[0];
    const newRow = `| ${task.id} | ${task.title} | ${task.size}→${task.size} | ${task.cli} | ${task.sprint} | ${today} | - | Archived |\n`;
    
    // Append to the end of the table (before the Archive marker if exists)
    if (content.includes('---')) {
        const lines = content.split('\n');
        let lastRowIndex = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith('|')) {
                lastRowIndex = i;
                break;
            }
        }
        if (lastRowIndex !== -1) {
            lines.splice(lastRowIndex + 1, 0, newRow.trim());
            content = lines.join('\n');
        } else {
            content += `\n${newRow}`;
        }
    } else {
        content += `\n${newRow}`;
    }

    await this.fileSystem.writeFile(this.doneFile, content);
  }

  private parseTask(content: string, defaultSprint: string): Task | null {
    const headerMatch = content.match(/^## (TASK-\d{3}): (.*)/m);
    const metaMatch = content.match(/^\*\*Meta:\*\* (.*)/m);
    
    if (headerMatch && metaMatch) {
      const id = headerMatch[1];
      const title = headerMatch[2];
      const metaLine = metaMatch[1];
      
      const acceptanceCriteria: AcceptanceCriterion[] = [];
      const acSectionMatch = content.match(/### Acceptance Criteria\n([\s\S]*?)(\n### |$)/);
      if (acSectionMatch) {
        const acSection = acSectionMatch[1];
        const acItemRegex = /- \[(x| )\] (.*)/g;
        let acItemMatch;
        while ((acItemMatch = acItemRegex.exec(acSection)) !== null) {
          acceptanceCriteria.push({
            completed: acItemMatch[1] === 'x',
            description: acItemMatch[2].trim()
          });
        }
      }

      const metaParts = metaLine.split('|').map(s => s.trim());
      const statusStr = metaParts[2] || '';
      
      return {
        id,
        title,
        priority: metaParts[0] || '',
        size: metaParts[1] || '',
        status: statusStr as TaskStatus,
        sprint: metaParts[3] || defaultSprint,
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
