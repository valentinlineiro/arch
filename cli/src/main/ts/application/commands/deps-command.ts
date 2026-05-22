import { Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { Task } from '../../domain/models/task.js';

export class DepsCommand implements Command {
  constructor(private taskRepository: TaskRepository) {}

  async execute(args: string[]): Promise<void> {
    const all = args.includes('--all');
    const taskId = args.find(a => /^TASK-\d+$/.test(a));

    const tasks = await this.taskRepository.getAll();
    const byId = new Map<string, Task>(tasks.map(t => [t.id, t]));

    if (all) {
      this.renderAll(tasks, byId);
      return;
    }

    if (!taskId) {
      process.stderr.write('Usage: arch deps TASK-XXX [--all]\n');
      process.exit(1);
    }

    const task = byId.get(taskId);
    if (!task) {
      process.stderr.write(`Task ${taskId} not found in active tasks.\n`);
      process.exit(1);
    }

    this.renderSingle(task, tasks, byId);
  }

  private renderSingle(task: Task, all: Task[], byId: Map<string, Task>): void {
    console.log(`\n${task.id} (${task.priority} ${task.size} ${task.status})\n`);

    // Depends-on
    const deps = this.depsOf(task);
    if (deps.length > 0) {
      console.log('  depends on:');
      for (const dep of deps) {
        const t = byId.get(dep);
        const label = t ? `${t.size} ${t.status} — ${t.title}` : '(not in active tasks)';
        console.log(`    ← ${dep}  ${label}`);
      }
    } else {
      console.log('  depends on: (none)');
    }

    // Unlocks
    const unlocked = all.filter(t => this.depsOf(t).includes(task.id));
    if (unlocked.length > 0) {
      console.log('\n  unlocks:');
      for (const t of unlocked) {
        console.log(`    → ${t.id}  ${t.size} ${t.status} — ${t.title}`);
      }
    } else {
      console.log('\n  unlocks: (none)');
    }
    console.log('');
  }

  private renderAll(tasks: Task[], byId: Map<string, Task>): void {
    // Detect cycles
    const cycle = this.detectCycle(tasks);
    if (cycle) {
      process.stderr.write(`[CYCLE] ${cycle.join(' → ')}\n`);
      process.exit(1);
    }

    // Unblocking leverage: count transitive dependents
    const leverage = new Map<string, number>();
    for (const t of tasks) {
      leverage.set(t.id, this.countDownstream(t.id, tasks));
    }

    const sorted = [...tasks].sort((a, b) => (leverage.get(b.id) ?? 0) - (leverage.get(a.id) ?? 0));

    console.log('\n  Dependency Graph (sorted by unblocking leverage):\n');
    for (const t of sorted) {
      const count = leverage.get(t.id) ?? 0;
      const unlockStr = count > 0 ? ` [unlocks ${count}]` : '';
      const deps = this.depsOf(t);
      const depStr = deps.length > 0 ? `  ← ${deps.join(', ')}` : '';
      console.log(`  ${t.id}  ${t.priority} ${t.size} ${t.status}${unlockStr}  ${t.title?.slice(0, 45) ?? ''}${depStr}`);
    }
    console.log('');
  }

  private depsOf(task: Task): string[] {
    const raw = (task as any).depends ?? (task as any).dependsOn ?? [];
    if (Array.isArray(raw)) return raw.filter((d: string) => d && d !== 'none');
    if (typeof raw === 'string') return raw.split(',').map((s: string) => s.trim()).filter(s => s && s !== 'none');
    return [];
  }

  private countDownstream(id: string, all: Task[]): number {
    const visited = new Set<string>();
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      const dependents = all.filter(t => this.depsOf(t).includes(cur)).map(t => t.id);
      for (const dep of dependents) {
        if (!visited.has(dep)) { visited.add(dep); queue.push(dep); }
      }
    }
    return visited.size;
  }

  private detectCycle(tasks: Task[]): string[] | null {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const byId = new Map(tasks.map(t => [t.id, t]));

    const dfs = (id: string, path: string[]): string[] | null => {
      if (stack.has(id)) return [...path, id];
      if (visited.has(id)) return null;
      visited.add(id); stack.add(id);
      const t = byId.get(id);
      if (t) {
        for (const dep of this.depsOf(t)) {
          const cycle = dfs(dep, [...path, id]);
          if (cycle) return cycle;
        }
      }
      stack.delete(id);
      return null;
    };

    for (const t of tasks) {
      const cycle = dfs(t.id, []);
      if (cycle) return cycle;
    }
    return null;
  }
}
