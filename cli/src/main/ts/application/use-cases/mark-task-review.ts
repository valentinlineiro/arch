import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus, FocusLevel } from '../../domain/models/task.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { ValidateTaskAcs } from './validate-task-acs.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';

export class MarkTaskReview {
  private validateAcs: ValidateTaskAcs;
  private verifier: DeterministicACVerifier;

  constructor(private taskRepository: TaskRepository, rootPath: string, private fileSystem?: FileSystem) {
    this.validateAcs = new ValidateTaskAcs(rootPath);
    this.verifier = new DeterministicACVerifier(rootPath);
  }

  async execute(taskId: string): Promise<{ passed: boolean; failures: string[] }> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Task ${taskId} is not in IN_PROGRESS state`);
    }

    const validation = this.validateAcs.execute(task.content, taskId);

    if (!validation.allPassed) {
      const failures = validation.results
        .filter(r => !r.passed)
        .map(r => {
          if (r.type === 'cmd') {
            return `[exit ${r.actualExit}, expected ${r.expectedExit}] ${r.ac} (cmd: ${r.command})`;
          }
          return `${r.ac}: ${r.reason || 'failed'}`;
        });
      return { passed: false, failures };
    }

    const hanseiErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.REVIEW });
    if (hanseiErrors.length > 0) {
      return { passed: false, failures: hanseiErrors };
    }

    // FLOW-REGRESSION check — warn if core flows are failing
    try {
      const warnings = await this.checkCoreFlows(task.context ?? []);
      if (warnings.length > 0) {
        console.log('  \x1b[33m⚠ [FLOW-REGRESSION] Core flow regression detected — review may introduce breakage:\x1b[0m');
        for (const w of warnings) console.log(`    \x1b[33m⚠\x1b[0m ${w}`);
      }
    } catch { /* flow check must never block review transition */ }

    task.status = TaskStatus.REVIEW;
    task.focus = FocusLevel.NONE;
    await this.taskRepository.save(task);
    return { passed: true, failures: [] };
  }

  private hasContextOverlap(acLabel: string, acDetail: string, taskContext: string[]): boolean {
    if (taskContext.length === 0) return true;
    const combined = `${acLabel} ${acDetail}`.toLowerCase();
    for (const ctx of taskContext) {
      const ctxLower = ctx.trim().toLowerCase();
      if (!ctxLower) continue;
      if (combined.includes(ctxLower) || ctxLower.includes(combined)) {
        return true;
      }
      const segments = ctxLower.split('/').filter(s => s.length > 2);
      for (const seg of segments) {
        if (combined.includes(seg)) {
          return true;
        }
      }
    }
    return false;
  }

  private async checkCoreFlows(taskContext: string[]): Promise<string[]> {
    if (!this.fileSystem) return [];
    const projectPath = 'docs/PROJECT.md';
    if (!await this.fileSystem.exists(projectPath)) return [];

    const content = await this.fileSystem.readFile(projectPath);
    const cfStart = content.indexOf('\n## Core Flows');
    if (cfStart === -1) return [];

    const bodyStart = content.indexOf('\n', cfStart + 1) + 1;
    const nextSection = content.indexOf('\n## ', bodyStart);
    const cfSection = nextSection === -1 ? content.slice(bodyStart) : content.slice(bodyStart, nextSection);

    const result = await this.verifier.verifySection(cfSection);
    return result.evidence
      .filter(r => !r.pass && this.hasContextOverlap(r.ac, r.detail, taskContext))
      .map(r => {
        const desc = r.ac.length > 80 ? r.ac.slice(0, 80) + '…' : r.ac;
        return `Core Flow "${desc}" is currently failing. Verify this task did not introduce the regression before closing.`;
      });
  }
}
