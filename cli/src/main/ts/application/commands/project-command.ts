import path from 'node:path';
import type { Command } from '../../domain/models/command.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { LLMProvider } from '../../domain/services/llm-provider.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { BridgeProvider } from '../../domain/services/bridge-provider.js';
import { spawnSync } from 'node:child_process';
import { PathResolver } from '../../domain/services/path-resolver.js';

interface DecomposedADR {
  title: string;
  context: string;
  decision: string;
}

interface DecomposedTask {
  title: string;
  class: string;
  size: string;
  depends: string;
  acs: string[];
}

interface DecompositionOutput {
  adrs: DecomposedADR[];
  tasks: DecomposedTask[];
  dod: string[];
}

export class ProjectCommand implements Command {
  constructor(
    private fileSystem: FileSystem,
    private taskRepository: TaskRepository,
    private rootPath: string = '.',
    private llmProvider?: LLMProvider,
  ) {}

  async execute(args: string[]): Promise<number> {
    const sub = args[0];
    if (sub === 'init') {
      await this.runInit(args.slice(1));
    } else {
      console.error(`  Unknown subcommand: ${sub ?? '(none)'}. Usage: arch project init "<spec>"`);
      return 1;
    }
    return 0;
  }

  private async runInit(args: string[]): Promise<void> {
    const depthIdx = args.indexOf('--depth');
    const depth = depthIdx !== -1 ? parseInt(args[depthIdx + 1] ?? '2', 10) : 2;

    // Spec: first non-flag arg
    const spec = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--depth').join(' ').trim();
    if (!spec) throw new Error('spec argument is required: arch project init "<spec>"');

    const provider = await this.resolveProvider();
    if (!provider) throw new Error('No LLM provider available. Configure a provider in arch.config.json.');

    console.log(`\n  ARCH — project init\n  Spec: ${spec}\n  Decomposition depth: ${depth}\n`);

    const prompt = this.buildPrompt(spec, depth);
    const response = await provider.complete({ messages: [{ role: 'user', content: prompt }], model: '' });

    const output = this.parseResponse(response.content);

    await this.writeAll(output, spec);

    console.log(`\n  Done. Review docs/PROJECT.md — ratify before running arch task loop.\n`);
  }

  private async resolveProvider(): Promise<LLMProvider | null> {
    if (this.llmProvider) return this.llmProvider;

    const config = await ConfigLoader.load(this.fileSystem);
    const isBinAvailable = (bin: string) => spawnSync('which', [bin]).status === 0;
    const registry = new ProviderRegistry(config);
    const { provider } = registry.resolve('2-code-generation', 'L', isBinAvailable);
    return provider ?? null;
  }

  private buildPrompt(spec: string, depth: number): string {
    return `You are an ARCH protocol planning assistant. Decompose the following project spec into an initial set of ADRs and tasks.

Spec: ${spec}

Decomposition depth: ${depth} (1 = epics only, 2 = epics + tasks, 3 = epics + tasks + sub-tasks)

Output ONLY valid JSON matching this schema exactly — no prose, no markdown:
{
  "adrs": [{ "title": string, "context": string, "decision": string }],
  "tasks": [{ "title": string, "class": string, "size": string, "depends": string, "acs": string[] }],
  "dod": string[]
}

Rules:
- task "class" must be one of: 1-code-reasoning, 2-code-generation, 3-code-context, 6-writing, 7-operations, 8-strategy
- task "size" must be one of: XS, S, M, L
- task "depends" is a comma-separated list of task titles (or "none")
- task "acs" is a list of short acceptance criteria strings
- "dod" is a list of project-level done predicates (e.g. "All tasks archived", "Integration tests pass")
- depth ${depth}: generate ${depth === 1 ? '3–6 high-level tasks' : depth === 2 ? '8–15 concrete tasks' : '15–25 granular tasks'}`;
  }

  private parseResponse(content: string): DecompositionOutput {
    // Strip markdown code fences if present
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenceMatch ? fenceMatch[1].trim() : content.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`LLM returned invalid JSON — cannot parse response. Raw output: ${raw.slice(0, 200)}`);
    }

    if (!this.isDecompositionOutput(parsed)) {
      throw new Error('LLM output missing required fields: adrs, tasks, dod arrays');
    }
    return parsed;
  }

  private isDecompositionOutput(v: unknown): v is DecompositionOutput {
    return (
      typeof v === 'object' && v !== null &&
      Array.isArray((v as any).adrs) &&
      Array.isArray((v as any).tasks) &&
      Array.isArray((v as any).dod)
    );
  }

  private async writeAll(output: DecompositionOutput, spec: string): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);
    const pr = PathResolver.from({});
    const adrDir = (config.paths as any)?.adr ?? pr.adr;
    const tasksDir = (config.paths as any)?.tasks ?? pr.tasks;

    // Determine ADR starting number
    let adrFiles: string[] = [];
    try { adrFiles = await this.fileSystem.readDirectory(adrDir); } catch { /* dir may not exist */ }
    const maxAdr = adrFiles
      .map(f => parseInt(f.match(/^ADR-(\d+)/)?.[1] ?? '0', 10))
      .reduce((a, b) => Math.max(a, b), 0);

    // Get next task ID
    const nextTaskId = await this.taskRepository.getNextId();
    const baseTaskNum = parseInt(nextTaskId.replace('TASK-', ''), 10);

    const now = new Date().toISOString().slice(0, 10);

    // Write ADRs
    for (let i = 0; i < output.adrs.length; i++) {
      const adr = output.adrs[i];
      const num = String(maxAdr + i + 1).padStart(3, '0');
      const slug = adr.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filePath = path.join(adrDir, `ADR-${num}-${slug}.md`);
      await this.fileSystem.writeFile(filePath, this.renderAdr(num, adr, now));
      console.log(`  + ${filePath}`);
    }

    // Write tasks — build title→id map for depends resolution
    const titleToId: Record<string, string> = {};
    for (let i = 0; i < output.tasks.length; i++) {
      const num = String(baseTaskNum + i).padStart(3, '0');
      titleToId[output.tasks[i].title] = `TASK-${num}`;
    }

    for (let i = 0; i < output.tasks.length; i++) {
      const task = output.tasks[i];
      const num = String(baseTaskNum + i).padStart(3, '0');
      const taskId = `TASK-${num}`;
      const filePath = path.join(tasksDir, `${taskId}.md`);
      const depends = this.resolveDepends(task.depends, titleToId);
      await this.fileSystem.writeFile(filePath, this.renderTask(taskId, task, depends, now));
      console.log(`  + ${filePath}`);
    }

    // Write PROJECT.md
    await this.fileSystem.writeFile('docs/PROJECT.md', this.renderProjectMd(spec, output, now));
    console.log('  + docs/PROJECT.md');
  }

  private resolveDepends(depends: string, titleToId: Record<string, string>): string {
    if (!depends || depends.toLowerCase() === 'none') return 'none';
    return depends.split(',').map(d => {
      const t = d.trim();
      return titleToId[t] ?? t;
    }).join(', ');
  }

  private renderAdr(num: string, adr: DecomposedADR, date: string): string {
    return `# ADR-${num}: ${adr.title}

**Date:** ${date}
**Status:** Proposed

## Context
${adr.context}

## Decision
${adr.decision}

## Consequences
_To be determined during implementation._
`;
  }

  private renderTask(id: string, task: DecomposedTask, depends: string, date: string): string {
    const acs = task.acs.map(ac => `- [ ] ${ac}\n  - \`prose: ${ac}\``).join('\n');
    return `## ${id}: ${task.title}
**Meta:** P2 | ${task.size} | READY | Focus:no | ${task.class} | claude-code | docs/

**Depends:** ${depends}
**Created-at:** ${date}

### Context
_Generated by arch project init. Review and refine before starting._

### Acceptance Criteria
${acs}

### Definition of Done
- [ ] All ACs checked
- [ ] \`arch review\` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
`;
  }

  private renderProjectMd(spec: string, output: DecompositionOutput, date: string): string {
    const dodLines = output.dod.map(d => `- [ ] ${d}`).join('\n');
    return `# PROJECT.md
**Generated:** ${date}

## Goal
${spec}

## Scope
${output.tasks.length} tasks across ${output.adrs.length} architectural decision(s).

## Definition of Done
${dodLines}

## Ratification
<!-- Human sign-off required before running arch task loop -->

- [ ] ADRs reviewed and accepted
- [ ] Task graph reviewed and scoped correctly
- [ ] DoD predicates are measurable and complete

**Sign off:** _(your name / date)_
`;
  }
}
