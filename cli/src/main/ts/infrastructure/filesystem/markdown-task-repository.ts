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
        const filePath = path.join(dirPath, file);
        const content = await this.fileSystem.readFile(filePath);
        const task = this.parseTask(content);
        if (task) {
          task.filePath = filePath;
          tasks.push(task);
        }
      }
    }
    return tasks;
  }

  async save(task: Task): Promise<void> {
    const isArchived = task.status === TaskStatus.DONE || task.status === TaskStatus.REJECTED;
    const targetDir = isArchived ? this.archiveDir : this.tasksDir;
    const targetPath = path.join(targetDir, `${task.id}.md`);

    let content = task.content;

    const metaMatch = content.match(/^\*\*Meta:\*\* (.*)/m);
    if (metaMatch) {
      let newMetaLine = `**Meta:** ${task.priority} | ${task.size} | ${task.status} | Focus:${task.focus ? 'yes' : 'no'} | ${task.class} | ${task.cli} | ${task.context.join(', ')}`;
      if (task.status === TaskStatus.DONE) {
        if (task.cost !== undefined) newMetaLine += ` | Cost: $${task.cost.toFixed(2)}`;
        if (task.steps !== undefined) newMetaLine += ` | Steps: ${task.steps}`;
      }
      content = content.replace(metaMatch[0], newMetaLine);
    }

    const ensureField = (fieldName: string, value: string | undefined) => {
      if (value && !content.includes(`**${fieldName}:**`)) {
        const insertionMatch = content.match(/^(\*\*(Depends|Sprint|Meta):\*\*.*?\n)/m);
        if (insertionMatch) {
          content = content.replace(insertionMatch[0], `${insertionMatch[0]}**${fieldName}:** ${value}\n`);
        }
      }
    };

    ensureField('Created-at', task.createdAt);
    ensureField('Closed-at', task.closedAt);
    ensureField('Rejected-at', task.rejectedAt);
    ensureField('Reason', task.rejectionReason);

    if (task.status !== TaskStatus.DONE && (task.cost !== undefined || task.steps !== undefined)) {
      const metricsComment = `<!-- arch-metrics: cost=${task.cost?.toFixed(2) || '0.00'}, steps=${task.steps || '0'} -->`;
      const existingMetricsMatch = content.match(/<!-- arch-metrics: .*? -->/);
      if (existingMetricsMatch) {
        content = content.replace(existingMetricsMatch[0], metricsComment);
      } else {
        content = content.replace(/^(\*\*Meta:\*\*.*?\n)/m, `$1${metricsComment}\n`);
      }
    }

    const currentPath = task.filePath || path.join(this.tasksDir, `${task.id}.md`);
    if (await this.fileSystem.exists(currentPath) && currentPath !== targetPath) {
      await this.fileSystem.writeFile(currentPath, content);
      await this.fileSystem.rename(currentPath, targetPath);
      task.filePath = targetPath;
    } else {
      await this.fileSystem.writeFile(targetPath, content);
      task.filePath = targetPath;
    }
  }

  public parseTask(content: string): Task | null {
    const headerMatch = content.match(/^## (TASK-\d{3}): (.*)/m);
    const metaMatch = content.match(/^\*\*Meta:\*\* (.*)/m);

    if (headerMatch && metaMatch) {
      const id = headerMatch[1];
      const title = headerMatch[2];
      const metaLine = metaMatch[0];

      const metaParts = metaMatch[1].split('|').map(s => s.trim());
      
      const costMatch = metaMatch[1].match(/Cost: \$(\d+\.\d{2})/);
      const stepsMatch = metaMatch[1].match(/Steps: (\d+)/);

      const inProgressMetricsMatch = content.match(/<!-- arch-metrics: cost=(?<cost>\d+\.\d{2}), steps=(?<steps>\d+) -->/);

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
      const createdAtMatch = content.match(/^\*\*Created-at:\*\* (.*)/m);
      const rejectedAtMatch = content.match(/^\*\*Rejected-at:\*\* (.*)/m);
      const rejectionReasonMatch = content.match(/^\*\*Reason:\*\* (.*)/m);
      const sprintMatch = content.match(/^\*\*Sprint:\*\* (.*)/m);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);

      const hanseiMatch = content.match(/## Hansei\n([\s\S]*?)(\n## |$)/);
      let hansei: any = undefined;
      if (hanseiMatch) {
        const hContent = hanseiMatch[1];
        const severity = hContent.match(/\*\*Severity:\*\* (H0|H1|H2|H3a|H3b)/)?.[1];
        const category = hContent.match(/\*\*Category:\*\* (.*)/)?.[1]?.trim();
        const decision = hContent.match(/\*\*Decision:\*\*\n?([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim();
        const constraint = hContent.match(/\*\*Constraint:\*\*\n?([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim();
        const cost = hContent.match(/\*\*Cost:\*\*\n?([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim();
        const forwardAction = hContent.match(/\*\*Forward Action:\*\*\n?([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim();

        if (severity || category || decision) {
          hansei = { severity, category, decision, constraint, cost, forwardAction };
        }
      }

      return {
        id,
        title,
        priority: metaParts[0] || '',
        size: metaParts[1] || '',
        status: (metaParts[2] || '') as TaskStatus,
        focus: metaParts[3] === 'Focus:yes',
        sprint: sprintMatch?.[1]?.trim() || '',
        class: metaParts[4] || '',
        cli: metaParts[5] || '',
        context: (metaParts[6] || '').split(',').map(s => s.trim()),
        createdAt: createdAtMatch?.[1]?.trim(),
        closedAt: closedAtMatch?.[1]?.trim(),
        rejectedAt: rejectedAtMatch?.[1]?.trim(),
        depends: dependsMatch ? dependsMatch[1].split(',').map(s => s.trim()) : undefined,
        acceptanceCriteria,
        hansei,
        cost: costMatch ? parseFloat(costMatch[1]) : (inProgressMetricsMatch?.groups?.cost ? parseFloat(inProgressMetricsMatch.groups.cost) : undefined),
        steps: stepsMatch ? parseInt(stepsMatch[1], 10) : (inProgressMetricsMatch?.groups?.steps ? parseInt(inProgressMetricsMatch.groups.steps, 10) : undefined),
        rawMetaLine: metaLine,
        rawDependsLine: dependsMatch ? dependsMatch[0] : undefined,
        content
      };
    }
    return null;
  }
}
