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

const TEMPLATE_REGISTRY: Record<string, string[]> = {
  '2-code-generation': [
    'Implement logic',
    'Add unit tests',
    'arch check passes',
    'npm test passes'
  ],
  '6-writing': [
    'Draft content',
    'Verify accuracy',
    'arch check passes'
  ],
  '7-operations': [
    'Execute operation',
    'Verify outcome',
    'arch check passes'
  ],
  'default': [
    'Implement intent',
    'arch check passes'
  ]
};

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
    private gitRepository: GitRepository,
    // Injectable for testing; production code uses tryLlmDraft
    private draftFn?: (intent: string) => Promise<LlmDraft | null>,
  ) {}

  async execute(intent: string, taskClassOverride?: string, sizeOverride?: string, draftMode = false): Promise<string> {
    const nextId = await this.taskRepository.getNextId();
    let draft: LlmDraft | null = null;
    if (draftMode) {
      const fn = this.draftFn ?? ((i: string) => this.tryLlmDraft(i));
      try {
        draft = await fn(intent);
      } catch {
        throw new Error('--draft flag requires a configured LLM provider. Set one up or remove --draft.');
      }
    }
    const content = this.scaffold(nextId, intent, draft, taskClassOverride, sizeOverride);

    const taskPath = `docs/tasks/${nextId}.md`;
    await this.fileSystem.writeFile(taskPath, content);

    try {
      const inference = new ContextInference(this.fileSystem);
      await inference.execute(nextId, intent, taskClassOverride ?? draft?.taskClass ?? DEFAULT_CLASS);
    } catch { /* inference errors must not block create */ }

    await this.gitRepository.add(taskPath);
    await this.gitRepository.commit(`chore: [${nextId}] scaffold task from intent`);

    return nextId;
  }

  private scaffold(nextId: string, intent: string, draft: LlmDraft | null, taskClassOverride?: string, sizeOverride?: string): string {
    const title = draft?.title ?? intent.slice(0, 60).replace(/[^\x20-\x7E]/g, '');
    const size = sizeOverride ?? draft?.size ?? DEFAULT_SIZE;
    const cls = taskClassOverride ?? draft?.taskClass ?? DEFAULT_CLASS;
    const metaLine = `**Meta:** ${DEFAULT_PRIORITY} | ${size} | READY | Focus:no | ${cls} | local | docs/tasks/`;

    const errors = TaskValidator.validateMeta(metaLine);
    const safeMetaLine = errors.length === 0
      ? metaLine
      : `**Meta:** ${DEFAULT_PRIORITY} | ${DEFAULT_SIZE} | READY | Focus:no | ${DEFAULT_CLASS} | local | docs/tasks/`;

    // Build ACs with class-appropriate predicate types
    const llmAcs = draft?.acs ?? [];
    const acs = this.buildACs(cls, llmAcs, intent);

    const isXsLightweight = size === 'XS' && (cls === '6-writing' || cls === '7-operations');
    const isMPlus = ['M', 'L', 'XL'].includes(size);

    const sections: string[] = [
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
    ];

    if (!isXsLightweight) {
      sections.push(
        ``,
        `### Definition of Done`,
        `- [ ] All ACs checked by Auditor`,
        `- [ ] \`arch check\` passes`,
      );
    }

    if (isMPlus) {
      sections.push(
        ``,
        `## Hansei`,
        `**Severity:** H0`,
        `**Category:** [SpecDrift]`,
        `**Decision:** Not yet started.`,
        `**Constraint:** None.`,
        `**Cost:** None.`,
        `**Forward Action:** None.`,
      );
    }

    return sections.join('\n');
  }

  private buildACs(cls: string, llmAcs: string[], intent: string): string {
    const lines: string[] = [];

    if (llmAcs.length > 0) {
      // Use LLM-generated ACs with class-appropriate predicate types
      for (const ac of llmAcs) {
        const predicate = this.predicateForClass(cls, ac);
        lines.push(`- [ ] ${ac}`);
        lines.push(`  - \`${predicate}\``);
      }
    } else {
      // Fallback: class-specific skeleton ACs
      const skeleton = this.skeletonACs(cls, intent);
      for (const { desc, predicate } of skeleton) {
        lines.push(`- [ ] ${desc}`);
        lines.push(`  - \`${predicate}\``);
      }
    }

    // Always add arch check AC
    lines.push(`- [ ] \`arch check\` passes`);
    lines.push(`  - \`cmd: node cli/dist/index.js review\``);

    return lines.join('\n');
  }

  private predicateForClass(cls: string, ac: string): string {
    const lc = ac.toLowerCase();
    if (cls === '2-code-generation') {
      if (lc.includes('test') || lc.includes('spec')) return 'cmd: npm test; exit: 0';
      if (lc.includes('exist') || lc.includes('file') || lc.includes('creat')) return 'file: (path)';
      return 'cmd: (command); exit: 0';
    }
    if (cls === '7-operations') return 'cmd: (command); exit: 0';
    if (cls === '6-writing') {
      if (lc.includes('exist') || lc.includes('creat') || lc.includes('document')) return 'file: (path)';
      return 'prose: verified by reading the document';
    }
    return 'prose: verified';
  }

  private skeletonACs(cls: string, intent: string): Array<{ desc: string; predicate: string }> {
    if (cls === '2-code-generation') return [
      { desc: 'Implementation file exists at declared context path', predicate: 'file: (path)' },
      { desc: 'Tests pass', predicate: 'cmd: npm test; exit: 0' },
    ];
    if (cls === '7-operations') return [
      { desc: 'Operation completes without error', predicate: 'cmd: (command); exit: 0' },
      { desc: 'Output exists at expected path', predicate: 'file: (path)' },
    ];
    if (cls === '6-writing') return [
      { desc: 'Document exists at declared path', predicate: 'file: (path)' },
      { desc: 'Content is accurate and complete', predicate: 'prose: reviewed and verified' },
    ];
    return [
      { desc: 'Intent addressed', predicate: 'prose: verified' },
    ];
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
