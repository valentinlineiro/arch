import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { IntentStatus } from '../../domain/models/intent.js';

export interface ScaffoldResult {
  taskId: string;
  intentId: string;
}

export class ScaffoldTask {
  constructor(
    private intentRepository: IntentRepository,
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
  ) {}

  async execute(intentId: string): Promise<ScaffoldResult> {
    const intent = await this.intentRepository.getById(intentId);
    if (!intent) throw new Error(`Intent ${intentId} not found`);
    if (intent.status !== IntentStatus.CAPTURED) {
      throw new Error(`Intent ${intentId} is not CAPTURED (status: ${intent.status})`);
    }
    if (intent.promotedTo.length > 0) {
      throw new Error(`Intent ${intentId} is already promoted to ${intent.promotedTo.join(', ')}`);
    }

    const taskId = await this.taskRepository.getNextId();
    const taskPath = `docs/tasks/${taskId}.md`;

    if (await this.fileSystem.exists(taskPath)) {
      throw new Error(`Task file ${taskPath} already exists`);
    }

    const now = new Date().toISOString();
    const content = this.buildScaffold(taskId, intentId, intent.rawIntent, now);

    await this.fileSystem.mkdir('docs/tasks');
    await this.fileSystem.writeFile(taskPath, content);

    return { taskId, intentId };
  }

  private buildScaffold(taskId: string, intentId: string, rawIntent: string, now: string): string {
    const title = rawIntent.length > 60 ? rawIntent.slice(0, 57) + '...' : rawIntent;
    return `## ${taskId}: ${title}

**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Source:** ${intentId}
**Depends:** none

### Generation

enrichment_phase: scaffolded
scaffolded_by: arch-cli
scaffolded_at: ${now}
enriched_by: ~

### Objective

_Awaiting agent enrichment_

### Acceptance Criteria

_Awaiting agent enrichment_

### Complexity

_Awaiting agent enrichment_

### Confidence

_Awaiting agent enrichment_

### Relevant Context

_confidence: ~_

_Pending ContextInference_

### Risks

_Awaiting agent enrichment_
`;
  }
}
