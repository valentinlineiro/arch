import fs from 'node:fs/promises';
import path from 'node:path';
import { Task, TaskRepository, TaskStatus } from '../../domain/task.js';

export class MarkdownTaskRepository implements TaskRepository {
  private sprintFile = 'docs/SPRINT.md';
  private backlogFile = 'docs/BACKLOG.md';

  async findTaskById(id: string): Promise<Task | null> {
    const tasks = await this.listAllTasks();
    return tasks.find(t => t.id === id) || null;
  }

  async findReadyTasks(): Promise<Task[]> {
    const tasks = await this.listAllTasks();
    return tasks.filter(t => t.status === TaskStatus.READY);
  }

  async listAllTasks(): Promise<Task[]> {
    const sprintContent = await this.safeReadFile(this.sprintFile);
    const backlogContent = await this.safeReadFile(this.backlogFile);
    
    const sprintTasks = this.parseMarkdown(sprintContent, 'Sprint 1'); // Simplified for now
    const backlogTasks = this.parseMarkdown(backlogContent, 'Backlog');
    
    return [...sprintTasks, ...backlogTasks];
  }

  async saveTask(task: Task): Promise<void> {
    // Implementation for saving back to markdown (complex regex replacement)
    // For now, we focus on porting the functionality of the bash script
  }

  private async safeReadFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  private parseMarkdown(content: string, defaultSprint: string): Task[] {
    const tasks: Task[] = [];
    const taskRegex = /^## TASK-(?<id>\d{3}): (?<title>.+)$/gm;
    const metaRegex = /^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>XS|S|M|L|XL) \| (?<status>IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED) \| (?<sprint>Sprint \d+|Backlog) \| (?<class>\d-[a-z-]+) \| (?<cli>[a-z-]+) \| (?<context>.+)$/m;
    
    let match;
    while ((match = taskRegex.exec(content)) !== null) {
      const id = match[1];
      const title = match[2];
      
      const remainingContent = content.slice(match.index + match[0].length);
      const metaMatch = metaRegex.exec(remainingContent);
      
      if (metaMatch && metaMatch.groups) {
        tasks.push({
          id: `TASK-${id}`,
          title,
          priority: `P${metaMatch.groups.priority}`,
          size: metaMatch.groups.size,
          status: metaMatch.groups.status as TaskStatus,
          sprint: metaMatch.groups.sprint,
          class: metaMatch.groups.class,
          cli: metaMatch.groups.cli,
          context: metaMatch.groups.context.split(',').map(s => s.trim())
        });
      }
    }
    
    return tasks;
  }
}
