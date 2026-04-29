import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class GetSprintStatus {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  async execute() {
    const tasks = await this.taskRepository.getAll();
    const ready = tasks.filter(t => t.status === TaskStatus.READY).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const review = tasks.filter(t => t.status === TaskStatus.REVIEW).length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const currentSprint = await this.getCurrentSprint();
    const sprintTasks = currentSprint
      ? tasks.filter(t => t.sprint === currentSprint)
      : [];
    const sprintDone = sprintTasks.filter(t => t.status === TaskStatus.DONE).length;

    return {
      ready,
      inProgress,
      review,
      done,
      sprint: currentSprint
        ? {
            name: currentSprint,
            done: sprintDone,
            total: sprintTasks.length
          }
        : null,
      total: tasks.length,
      tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
    };
  }

  private async getCurrentSprint(): Promise<string> {
    if (!(await this.fileSystem.exists('arch.config.json'))) {
      return '';
    }

    const config = JSON.parse(await this.fileSystem.readFile('arch.config.json')) as {
      currentSprint?: string;
    };

    return typeof config.currentSprint === 'string' ? config.currentSprint : '';
  }
}
