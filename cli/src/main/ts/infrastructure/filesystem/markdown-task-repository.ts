import { Task, TaskRepository, TaskStatus, AcceptanceCriterion } from '../../domain/models/task.js';
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
    const blocks = content.split('\n---\n');
    
    for (const block of blocks) {
      const headerMatch = block.match(/^## (TASK-\d{3}): (.*)/m);
      const metaMatch = block.match(/^\*\*Meta:\*\* (.*)/m);
      
      if (headerMatch && metaMatch) {
        const id = headerMatch[1];
        const title = headerMatch[2];
        const metaLine = metaMatch[1];
        
        const acceptanceCriteria: AcceptanceCriterion[] = [];
        const acSectionMatch = block.match(/### Acceptance Criteria\n([\s\S]*?)(\n### |$)/);
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
        
        tasks.push({
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
        });
      }
    }
    
    return tasks;
  }
}
