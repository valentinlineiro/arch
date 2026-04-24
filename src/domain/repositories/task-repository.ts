import { Task } from '../models/task.js';

export interface TaskRepository {
  getById(id: string): Promise<Task | null>;
  getAll(): Promise<Task[]>;
  save(task: Task): Promise<void>;
  findReady(): Promise<Task[]>;
}
