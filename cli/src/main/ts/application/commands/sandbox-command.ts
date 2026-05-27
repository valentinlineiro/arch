import { CommandExit, Command } from '../../domain/models/command.js';
import { SandboxService } from '../../domain/services/sandbox.js';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { EscalationStore } from '../use-cases/escalation-store.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class SandboxCommand implements Command {
  constructor(
    private sandboxService: SandboxService,
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(args: string[]): Promise<number> {
    const subCommand = args[0];
    if (subCommand !== 'exec') {
      fmt.log('Usage: arch sandbox exec "<command>" [--args "arg1 arg2"] [--privileged]');
      return 1;
    }

    const command = args[1];
    if (!command) {
      fmt.fail('Missing command to execute.');
      return 1;
    }

    const argString = this.getArg(args, '--args') || '';
    const cmdArgs = argString ? argString.split(' ') : [];
    const privileged = args.includes('--privileged');

    if (privileged) {
      await this.checkPrivilegeApproval();
    }

    try {
      const result = this.sandboxService.executeCommand(command, cmdArgs, { privileged });
      
      if (result.status === 0) {
        process.stdout.write(result.stdout);
      } else {
        process.stderr.write(result.stderr);
        fmt.fail(`Command exited with status ${result.status}`);
        return result.status ?? 1;
      }
    } catch (e: any) {
      fmt.fail(e.message);
      return 1;
    }
    return 0;
  }

  private async checkPrivilegeApproval(): Promise<void> {
    const focusedTask = (await this.taskRepository.getActive()).find(t => t.focus);
    if (!focusedTask) {
      fmt.fail('Privileged execution requires an active focused task.');
      throw new CommandExit(1);
    }

    const store = new EscalationStore(this.fileSystem);

    // Check for human approval in structured store (not INBOX.md)
    const isApproved = await store.hasApproval(focusedTask.id);

    if (!isApproved) {
      // Write approval request to escalation store
      await store.append('ANDON_HALT', focusedTask.id, `Agent requested privileged execution for task ${focusedTask.id}.`);

      // Also write human-readable note to INBOX (write-only — never read by automation)
      try {
        const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
        const entry = `\n## [${ts}] AWAITING_APPROVAL | PRIVILEGED_EXECUTION | ${focusedTask.id}\nEvidence: Agent requested privileged execution. Approve by running: arch approve ${focusedTask.id}\n`;
        const inboxPath = PathResolver.from({}).inbox;
        const existing = await this.fileSystem.readFile(inboxPath).catch(() => '');
        await this.fileSystem.writeFile(inboxPath, existing + entry);
      } catch { /* non-blocking */ }

      fmt.warn(`Privileged execution requested for ${focusedTask.id}.`);
      fmt.info(`Halted: run 'arch approve ${focusedTask.id}' to grant approval.`);
      throw new CommandExit(1);
    }
  }

  private getArg(args: string[], flag: string): string | undefined {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  }
}
