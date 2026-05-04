import { SandboxService } from '../../domain/services/sandbox.js';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class SandboxCommand {
  constructor(
    private sandboxService: SandboxService,
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(args: string[]): Promise<void> {
    const subCommand = args[0];
    if (subCommand !== 'exec') {
      console.log('Usage: arch sandbox exec "<command>" [--args "arg1 arg2"] [--privileged]');
      process.exit(1);
    }

    const command = args[1];
    if (!command) {
      fmt.fail('Missing command to execute.');
      process.exit(1);
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
        process.exit(result.status ?? 1);
      }
    } catch (e: any) {
      fmt.fail(e.message);
      process.exit(1);
    }
  }

  private async checkPrivilegeApproval(): Promise<void> {
    const focusedTask = (await this.taskRepository.getActive()).find(t => t.focus);
    if (!focusedTask) {
      fmt.fail('Privileged execution requires an active focused task.');
      process.exit(1);
    }

    const inboxPath = 'docs/INBOX.md';
    const inbox = await this.fileSystem.readFile(inboxPath);
    const approvedRegex = new RegExp(`## \\[.*?\\] APPROVED \\| PRIVILEGED_EXECUTION \\| ${focusedTask.id}`, 'g');

    if (!approvedRegex.test(inbox)) {
      const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const entry = `\n## [${ts}] AWAITING_APPROVAL | PRIVILEGED_EXECUTION | ${focusedTask.id}\nEvidence: Agent requested privileged execution for task ${focusedTask.id}.\n`;
      await this.fileSystem.writeFile(inboxPath, inbox + entry);
      
      fmt.warn(`Privileged execution requested for ${focusedTask.id}.`);
      fmt.info('Halted: Awaiting human approval in INBOX.md. Write APPROVED to proceed.');
      process.exit(1);
    }
  }

  private getArg(args: string[], flag: string): string | undefined {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  }
}
