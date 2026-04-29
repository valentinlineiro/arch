import { test } from 'node:test';
import assert from 'node:assert';
import { ValidateSystem } from '../../main/ts/application/use-cases/validate-system.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';
import { FileSystem } from '../../main/ts/domain/repositories/file-system.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';

class MockTaskRepository implements TaskRepository {
  tasks: Task[] = [];
  async getById(id: string) { return null; }
  async getAll() { return this.tasks; }
  async getActive() { return this.tasks; }
  async save(task: Task) {}
  async findReady() { return []; }
  async getNextId() { return 'TASK-001'; }
  }
class MockFileSystem implements FileSystem {
  files: Record<string, string> = {};
  async readFile(path: string) { return this.files[path]; }
  async writeFile(path: string, content: string) { this.files[path] = content; }
  async exists(path: string) { return !!this.files[path]; }
  async readDirectory(path: string) { return []; }
  async rename(oldPath: string, newPath: string) {}
}

test('ValidateSystem - success when everything is valid', async () => {
  const repo = new MockTaskRepository();
  const fs = new MockFileSystem();
  
  repo.tasks.push({
    id: 'TASK-001',
    title: 'Valid Task',
    status: TaskStatus.READY,
    rawMetaLine: '**Meta:** P1 | S | 5 | READY | Focus:no | 6-writing | claude | README.md'
  } as any);

  fs.files['arch.config.json'] = JSON.stringify({ version: '0.1.0' });

  const useCase = new ValidateSystem(repo, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.errors.length, 0);
});

test('ValidateSystem - failure when meta line is invalid', async () => {
  const repo = new MockTaskRepository();
  const fs = new MockFileSystem();
  
  repo.tasks.push({
    id: 'TASK-001',
    title: 'Invalid Task',
    status: TaskStatus.READY,
    rawMetaLine: 'Invalid Meta Line'
  } as any);

  const useCase = new ValidateSystem(repo, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.success, false);
  assert.ok(result.errors.some(err => err.includes('invalid Meta line')));
});

test('ValidateSystem - failure when config is invalid', async () => {
  const repo = new MockTaskRepository();
  const fs = new MockFileSystem();
  
  fs.files['arch.config.json'] = JSON.stringify({ }); // Missing version

  const useCase = new ValidateSystem(repo, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.success, false);
  assert.ok(result.errors.some(err => err.includes('missing required field: version')));
});
