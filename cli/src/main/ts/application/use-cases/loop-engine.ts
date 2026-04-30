import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface LoopOptions {
  sprint?: string;
  dryRun?: boolean;
  resume?: boolean;
}

export class LoopEngine {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository
  ) {}

  async execute(options: LoopOptions) {
    console.log(`Starting arch loop${options.dryRun ? ' (dry-run)' : ''}...`);

    while (true) {
      // 1. Govern phase
      console.log('\n--- Phase: GOVERN ---');
      if (!options.dryRun) {
        const governResult = await this.runSubprocess('arch', ['govern']);
        if (governResult !== 0) {
          console.error('Govern phase failed. Halting.');
          process.exit(governResult);
        }
      } else {
        console.log('[Dry-run] Would run: arch govern');
      }

      // 2. Selection phase (arch next)
      console.log('\n--- Phase: SELECT ---');
      const nextTaskResult = await this.runSubprocessWithOutput('arch', ['next']);
      const taskIdMatch = nextTaskResult.match(/TASK-\d{3}/);
      
      if (!taskIdMatch) {
        console.log('No READY tasks found. Loop complete.');
        break;
      }

      const taskId = taskIdMatch[0];
      const task = await this.taskRepository.getById(taskId);
      
      if (!task) {
        console.error(`Task ${taskId} not found in repository. Halting.`);
        process.exit(1);
      }

      // Sprint filtering
      if (options.sprint && task.sprint !== options.sprint) {
        console.log(`Task ${taskId} does not match sprint ${options.sprint}. Skipping.`);
        // Note: In a real loop we might want to mark it as skipped or find the next one
        break; 
      }

      console.log(`Targeting task: ${taskId} - ${task.title}`);

      if (options.dryRun) {
        console.log(`[Dry-run] Would execute cycle for ${taskId}`);
        break; // Only dry-run one cycle for now
      }

      // 3. Execution phase (arch exec - simulated via agent call)
      // Since 'arch exec' doesn't exist yet as a CLI command that handles the agent lifecycle,
      // we assume the environment (like this agent session) IS the execution engine.
      // For the CLI 'loop' command, it would invoke the agent.
      console.log('\n--- Phase: EXEC ---');
      console.log(`Executing ${taskId}...`);
      
      // In a real CI environment, this would call the agent CLI (gemini/claude)
      // For now, we'll implement the logic that the loop engine should follow.
      // This is a bootstrap problem: the loop engine is being built BY an agent.
      
      // 4. Review phase
      console.log('\n--- Phase: REVIEW ---');
      const reviewResult = await this.runSubprocess('arch', ['review']);
      
      if (reviewResult !== 0) {
        console.warn(`Review failed for ${taskId}. Checking Andon Cord conditions...`);
        // TODO: Implement Andon Cord logic (3x failure count check)
        await this.handleAndonHalt(taskId, 'REVIEW_FAILURE_LOOP', 'Review failed.');
        process.exit(1);
      }

      // 5. Archive phase
      console.log('\n--- Phase: ARCHIVE ---');
      // Simulated: in a real loop, this would be 'arch task done' or automatic move
      console.log(`Archiving ${taskId}...`);
    }
  }

  private async runSubprocess(command: string, args: string[]): Promise<number> {
    const bin = process.argv[0];
    const script = process.argv[1];
    const rootDir = process.cwd();
    return new Promise((resolve) => {
      const child = spawn(bin, [script, ...args], { stdio: 'inherit', cwd: rootDir });
      child.on('close', (code) => resolve(code || 0));
    });
  }

  private async runSubprocessWithOutput(command: string, args: string[]): Promise<string> {
    const bin = process.argv[0];
    const script = process.argv[1];
    const rootDir = process.cwd();
    return new Promise((resolve, reject) => {
      const child = spawn(bin, [script, ...args], { stdio: ['inherit', 'pipe', 'inherit'], cwd: rootDir });
      let output = '';
      child.stdout?.on('data', (data) => output += data.toString());
      child.on('close', (code) => {
        if (code === 0) resolve(output.trim());
        else reject(new Error(`Command ${args.join(' ')} failed with code ${code} (cwd: ${rootDir})`));
      });
    });
  }

  private async handleAndonHalt(taskId: string, condition: string, evidence: string) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(0, 16);
    const entry = `\n## [${timestamp}] ANDON_HALT | ${taskId} | ${condition}\nEvidence: ${evidence}\n`;
    fs.appendFileSync('docs/INBOX.md', entry);
  }
}
