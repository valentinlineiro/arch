import { Task, TaskRepository, TaskStatus } from '../../domain/models/task.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskValidator } from '../../domain/services/task-validator.js';

export class MarkdownTaskRepository implements TaskRepository {
  private sprintFile = 'docs/SPRINT.md';
  private backlogFile = 'docs/BACKLOG.md';

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
    const sprintContent = await this.safeReadFile(this.sprintFile);
    const backlogContent = await this.safeReadFile(this.backlogFile);
    
    const sprintTasks = this.parseMarkdown(sprintContent, 'Sprint 1');
    const backlogTasks = this.parseMarkdown(backlogContent, 'Backlog');
    
    return [...sprintTasks, ...backlogTasks];
  }

  async save(task: Task): Promise<void> {
    const targetFile = task.sprint.startsWith('Sprint') ? this.sprintFile : this.backlogFile;
    let content = await this.safeReadFile(targetFile);
    
    const statusRegex = new RegExp(`(## ${task.id}:.*?\\n\\*\\*Meta:\\*\\* .*?\\| )(IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED)`, 's');
    content = content.replace(statusRegex, `$1${task.status}`);
    
    await this.fileSystem.writeFile(targetFile, content);
  }

  private async safeReadFile(filePath: string): Promise<string> {
    if (await this.fileSystem.exists(filePath)) {
      return await this.fileSystem.readFile(filePath);
    }
    return '';
  }

  private parseMarkdown(content: string, defaultSprint: string): Task[] {
    const tasks: Task[] = [];
    const taskBlockRegex = /^## (TASK-\d{3}): (.*)\n\*\*Meta:\*\* (.*)$/gm;
    
    let match;
    while ((match = taskBlockRegex.exec(content)) !== null) {
      const id = match[1];
      const title = match[2];
      const metaLine = match[3];
      
      const parsedMeta = TaskValidator.parseMeta(`**Meta:** ${metaLine}`);
      if (parsedMeta) {
        tasks.push({
          id,
          title,
          priority: `P${parsedMeta.priority}`,
          size: parsedMeta.size,
          status: parsedMeta.status as TaskStatus,
          sprint: parsedMeta.sprint,
          class: parsedMeta.class,
          cli: parsedMeta.cli,
          context: parsedMeta.context.split(',').map((s: string) => s.trim())
        });
      }
    }
    
    return tasks;
  }
}
