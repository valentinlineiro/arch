import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus } from '../../domain/models/task.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { BatchSystem } from '../use-cases/batch-system.js';
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { BridgeProvider } from '../../domain/services/bridge-provider.js';

const DO_PROMPT_FILE = 'docs/agents/DO.md';

export class ExecCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  /**
   * @deprecated Use ProviderRegistry.resolve() instead. Kept for unit-test backward compatibility.
   */
  static resolveAgentCommand(
    config: any,
    taskClass: string,
    taskSize: string,
    promptFile: string,
    extraFlags: string,
    isBinAvailable: (bin: string) => boolean
  ): { name: string; cmd: string } | 'local' | null {
    const registry = new ProviderRegistry(config);
    const { provider, name, model } = registry.resolve(taskClass, taskSize, isBinAvailable);

    if (name === 'local') return 'local';
    if (!provider || !name) return null;

    if (provider instanceof BridgeProvider) {
      const cmd = provider.buildCommand('', model, promptFile) + (extraFlags ? ` ${extraFlags}` : '');
      return { name, cmd };
    }

    return null;
  }

  async execute(args: string[]): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);

    const activeTasks = await this.taskRepository.getActive();
    const focusedTask = activeTasks.find(t => t.focus && t.status !== TaskStatus.DONE);

    const taskClass = focusedTask?.class ?? '';
    const taskSize = focusedTask?.size ?? '';
    const taskId = focusedTask?.id ?? '';

    if (
      config.governance?.batchWritingTasks === true &&
      taskClass === '6-writing' &&
      taskSize === 'XS' &&
      taskId
    ) {
      console.log(`  \x1b[33mBATCH\x1b[0m — queuing ${taskId} for Anthropic Batch API`);
      const batchSystem = new BatchSystem(this.fileSystem);
      await batchSystem.add(taskId, DO_PROMPT_FILE);
      return;
    }

    console.log('  \x1b[32mARCH\x1b[0m — invoking EXEC (DO) mode');

    const registry = new ProviderRegistry(config);
    const { provider, name, model } = registry.resolve(
      taskClass,
      taskSize,
      bin => spawnSync('which', [bin]).status === 0
    );

    if (name === 'local') {
      console.log('  Routing: local (no AI invocation)');
      console.log('');
      process.stdout.write(fs.readFileSync(DO_PROMPT_FILE, 'utf8'));
      process.exit(0);
    }

    if (!provider) {
      console.log('  Note: No AI provider detected. Showing protocol:');
      console.log(fs.readFileSync(DO_PROMPT_FILE, 'utf8'));
      process.exit(1);
    }

    console.log(`  Provider: ${name} | Model: ${model || 'default'}`);

    const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
    const extraFlags = args.join(' ');

    if (provider instanceof BridgeProvider) {
      const cmd = provider.buildCommand(promptContent, model, DO_PROMPT_FILE) +
        (extraFlags ? ` ${extraFlags}` : '');
      const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
      process.exit(result.status ?? 0);
    }

    // NativeProvider: call REST endpoint
    try {
      const response = await provider.complete({
        model,
        messages: [{ role: 'user', content: promptContent }],
      });
      console.log(response.content);
      if (response.usage.turns) console.log(`Turns: ${response.usage.turns}`);
      if (response.usage.cost) console.log(`Cost: ${response.usage.cost}`);
      if (response.usage.latencyMs) console.log(`Latency: ${response.usage.latencyMs}ms`);
    } catch (err: any) {
      console.error(`Provider error: ${err.message}`);
      process.exit(1);
    }
  }
}
