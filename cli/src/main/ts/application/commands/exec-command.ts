import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus } from '../../domain/models/task.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { BatchSystem } from '../use-cases/batch-system.js';

const DO_PROMPT_FILE = 'docs/agents/DO.md';

export class ExecCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  /**
   * Resolves which CLI and command string to use for agent invocation.
   * Returns 'local' for local-routing mode, null if no CLI is available,
   * or { name, cmd } for a runnable command.
   *
   * Extracted as a static method so it can be unit-tested without spawning processes.
   */
  static resolveAgentCommand(
    config: any,
    taskClass: string,
    taskSize: string,
    promptFile: string,
    extraFlags: string,
    isBinAvailable: (bin: string) => boolean
  ): { name: string; cmd: string } | 'local' | null {
    const clis: any[] = config.clis || [];

    const preferredCliName: string | null =
      taskClass && config.routing?.[taskClass] ? config.routing[taskClass] : null;

    const preferredModel: string | null =
      taskSize && config.governance?.modelTiers?.[taskSize]
        ? config.governance.modelTiers[taskSize]
        : null;

    if (preferredCliName === 'local') {
      return 'local';
    }

    const preferred = clis.find(c => c.name === preferredCliName);
    const ordered = preferred
      ? [preferred, ...clis.filter(c => c.name !== preferredCliName)]
      : clis;

    for (const cli of ordered) {
      if (!isBinAvailable(cli.bin)) continue;

      let cmd = cli.template
        .replace(/\{prompt\}/g, `$(cat ${promptFile})`)
        .replace(/\{prompt_file\}/g, promptFile);

      if (preferredModel) {
        if (cli.template.includes('{model}')) {
          cmd = cmd.replace(/\{model\}/g, preferredModel);
        } else if (cli.name === 'claude') {
          cmd += ` --model ${preferredModel}`;
        }
      }

      if (extraFlags) {
        cmd += ` ${extraFlags}`;
      }

      return { name: cli.name, cmd };
    }

    return null;
  }

  async execute(args: string[]): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);

    const activeTasks = await this.taskRepository.getActive();
    const focusedTask = activeTasks.find(
      t => t.focus && t.status !== TaskStatus.DONE
    );

    const taskClass = focusedTask?.class ?? '';
    const taskSize = focusedTask?.size ?? '';
    const taskId = focusedTask?.id ?? '';
    const extraFlags = args.join(' ');

    // Batch routing: queue XS writing tasks when batchWritingTasks is enabled
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

    const resolved = ExecCommand.resolveAgentCommand(
      config,
      taskClass,
      taskSize,
      DO_PROMPT_FILE,
      extraFlags,
      bin => spawnSync('which', [bin]).status === 0
    );

    if (resolved === 'local') {
      console.log('  Routing: local (no AI invocation)');
      console.log('');
      process.stdout.write(fs.readFileSync(DO_PROMPT_FILE, 'utf8'));
      process.exit(0);
    }

    if (resolved === null) {
      console.log('  Note: No AI CLI detected or invocation failed. Showing protocol:');
      console.log(fs.readFileSync(DO_PROMPT_FILE, 'utf8'));
      process.exit(1);
    }

    const result = spawnSync('sh', ['-c', resolved.cmd], { stdio: 'inherit' });
    process.exit(result.status ?? 0);
  }
}
