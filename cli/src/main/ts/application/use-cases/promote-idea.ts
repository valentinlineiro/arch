import path from 'node:path';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';

export class PromoteIdea {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(ideaSlug: string): Promise<string> {
    const ideaPath = path.join('docs/refinement', `${ideaSlug.startsWith('IDEA-') ? '' : 'IDEA-'}${ideaSlug}.md`);
    
    if (!(await this.fileSystem.exists(ideaPath))) {
      throw new Error(`Idea file not found: ${ideaPath}`);
    }

    const ideaContent = await this.fileSystem.readFile(ideaPath);
    const nextTaskId = await this.taskRepository.getNextId();
    const taskContent = this.transformIdeaToTask(ideaContent, nextTaskId);
    const taskPath = path.join('docs/tasks', `${nextTaskId}.md`);

    // 1. Create task file
    await this.fileSystem.writeFile(taskPath, taskContent);

    // 2. Update IDEA file with decision
    const updatedIdeaContent = this.updateIdeaDecision(ideaContent, nextTaskId);
    await this.fileSystem.writeFile(ideaPath, updatedIdeaContent);

    // 3. Move IDEA to archive using git mv
    const archivePath = path.join('docs/refinement/archive', path.basename(ideaPath));
    await this.gitRepository.mv(ideaPath, archivePath);

    // 4. Git add task and commit
    await this.gitRepository.add(taskPath);
    await this.gitRepository.commit(`feat: promote ${ideaSlug} to ${nextTaskId}`);

    return nextTaskId;
  }

  private transformIdeaToTask(ideaContent: string, taskId: string): string {
    const titleMatch = ideaContent.match(/^# IDEA: (.*)/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled Task';
    
    const metaMatch = ideaContent.match(/^\*\*Meta:\*\* (.*)/m);
    let metaLine = '';
    if (metaMatch) {
      const parts = metaMatch[1].split('|').map(p => p.trim());
      const priority = parts[0] || 'P3';
      const size = parts[1] || 'S';
      const cli = parts[2] || 'local';
      const context = parts[3] || 'docs/';
      // TASK Meta: priority | size | status | focus | class | cli | context
      metaLine = `**Meta:** ${priority} | ${size} | READY | Focus:no | 2-code-generation | ${cli} | ${context}`;
    } else {
      metaLine = `**Meta:** P3 | S | READY | Focus:no | 2-code-generation | local | docs/`;
    }

    const problemMatch = ideaContent.match(/## Problem\n([\s\S]*?)(\n## |$)/);
    const solutionMatch = ideaContent.match(/## Proposed solution\n([\s\S]*?)(\n## |$)/);
    const depsMatch = ideaContent.match(/## Dependencies\n([\s\S]*?)(\n## |$)/);

    let content = `## ${taskId}: ${title}\n${metaLine}\n`;
    if (depsMatch) {
      const deps = depsMatch[1].trim();
      content += `**Depends:** ${deps.toLowerCase() === 'none' || deps === '' ? 'none' : deps}\n`;
    } else {
      content += `**Depends:** none\n`;
    }

    content += `\n### Acceptance Criteria\n- [ ] ${title}\n`;
    
    if (problemMatch || solutionMatch) {
      content += `\n### Context\n`;
      if (problemMatch) content += `#### Problem\n${problemMatch[1].trim()}\n\n`;
      if (solutionMatch) content += `#### Solution\n${solutionMatch[1].trim()}\n`;
    }

    content += `\n### Definition of Done\n- [ ] All ACs checked.\n- [ ] arch review passes.\n`;

    return content;
  }

  private updateIdeaDecision(ideaContent: string, taskId: string): string {
    const decisionRegex = /## Decision\n([\s\S]*?)(<!-- PROMOTE → TASK-XXX \| REJECT: reason -->|$)/;
    const replacement = `## Decision\nPROMOTE → ${taskId}\n`;
    if (ideaContent.match(decisionRegex)) {
      return ideaContent.replace(decisionRegex, replacement);
    }
    return ideaContent.trimEnd() + `\n\n## Decision\nPROMOTE → ${taskId}\n`;
  }
}
