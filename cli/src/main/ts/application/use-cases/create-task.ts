import { spawnSync } from 'node:child_process';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { ContextInference } from './context-inference.js';

const DEFAULT_SIZE = 'S';
const DEFAULT_CLASS = '2-code-generation';
const DEFAULT_PRIORITY = 'P3';
const DRAFT_PROMPT_PREFIX = `You are helping scaffold an ARCH task file. Given the intent below, output ONLY the following fields — no other text:

Title: <concise task title, max 60 chars, ASCII only>
Size: <XS|S|M|L>
Class: <2-code-generation|6-writing|7-operations>
ACs:
- <acceptance criterion 1>
- <acceptance criterion 2>
- <acceptance criterion 3>

Intent: `;

interface LlmDraft {
  title: string;
  size: string;
  taskClass: string;
  acs: string[];
}

export class CreateTask {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async execute(intent: string): Promise<string> {
    const nextId = await this.taskRepository.getNextId();
    const draft = await this.tryLlmDraft(intent);
    const content = this.scaffold(nextId, intent, draft);

    const taskPath = `docs/tasks/${nextId}.md`;
    await this.fileSystem.writeFile(taskPath, content);

    try {
      const inference = new ContextInference(this.fileSystem);
      await inference.execute(nextId, intent, draft?.taskClass ?? DEFAULT_CLASS);
    } catch { /* inference errors must not block create */ }

    await this.gitRepository.add(taskPath);
    await this.gitRepository.commit(`chore: [${nextId}] scaffold task from intent`);

    return nextId;
  }

  private scaffold(nextId: string, intent: string, draft: LlmDraft | null): string {
    const title = draft?.title ?? intent.slice(0, 60).replace(/[^\x20-\x7E]/g, '');
    const size = draft?.size ?? DEFAULT_SIZE;
    const cls = draft?.taskClass ?? DEFAULT_CLASS;
    const metaLine = `**Meta:** ${DEFAULT_PRIORITY} | ${size} | READY | Focus:no | ${cls} | local | docs/tasks/`;

    const errors = TaskValidator.validateMeta(metaLine);
    const safeMetaLine = errors.length === 0
      ? metaLine
      : `**Meta:** ${DEFAULT_PRIORITY} | ${DEFAULT_SIZE} | READY | Focus:no | ${DEFAULT_CLASS} | local | docs/tasks/`;

    const acs = draft?.acs?.length
      ? draft.acs.map(ac => `- [ ] ${ac} → prose: verified`).join('\n')
      : `- [ ] ${title} → prose: verified`;

    return [
      `## ${nextId}: ${title}`,
      safeMetaLine,
      `**Depends:** none`,
      ``,
      `### Acceptance Criteria`,
      acs,
      ``,
      `### Context`,
      `#### Intent`,
      intent,
      ``,
      `### Definition of Done`,
      `- [ ] All ACs checked → prose: all ACs above verified`,
      `- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0`,
      ``,
    ].join('\n');
  }

  private async tryLlmDraft(intent: string): Promise<LlmDraft | null> {
    try {
      const config = await ConfigLoader.load(this.fileSystem);
      const registry = new ProviderRegistry(config);
      const { provider, model } = registry.resolve(
        DEFAULT_CLASS,
        DEFAULT_SIZE,
        bin => spawnSync('which', [bin]).status === 0
      );
      if (!provider) return null;

      const response = await provider.complete({
        model: model ?? '',
        messages: [{ role: 'user', content: DRAFT_PROMPT_PREFIX + intent }],
      });

      return this.parseDraft(response.content);
    } catch {
      return null;
    }
  }

  private parseDraft(raw: string): LlmDraft | null {
    try {
      const titleMatch = raw.match(/^Title:\s*(.+)/m);
      const sizeMatch = raw.match(/^Size:\s*(XS|S|M|L|XL)/m);
      const classMatch = raw.match(/^Class:\s*(\S+)/m);
      const acsBlock = raw.match(/^ACs:\n([\s\S]*)/m);

      if (!titleMatch) return null;

      const acs: string[] = [];
      if (acsBlock) {
        for (const line of acsBlock[1].split('\n')) {
          const ac = line.replace(/^-\s*/, '').trim();
          if (ac) acs.push(ac);
        }
      }

      return {
        title: titleMatch[1].trim().replace(/^["'`]|["'`]$/g, '').replace(/[^\x20-\x7E]/g, '').slice(0, 60),
        size: sizeMatch?.[1] ?? DEFAULT_SIZE,
        taskClass: classMatch?.[1] ?? DEFAULT_CLASS,
        acs,
      };
    } catch {
      return null;
    }
  }
}
