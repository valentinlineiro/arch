import { FileSystem } from '../../../domain/repositories/file-system.js';
import { GitRepository } from '../../../domain/repositories/git-repository.js';
import { HanseiAuditor } from '../../../domain/services/hansei-auditor.js';
import semver from 'semver';
import { FocusLevel, ConflictSeverity, FocusConflict, TaskStatus, Hansei, Task } from '../../../domain/models/task.js';
import { PathResolver } from '../../../domain/services/path-resolver.js';
import { ConfigLoader } from '../../../domain/services/config-loader.js';
import type { DriftResult } from './checker-types.js';

export class TaskHealthChecker {
  private readonly pr: PathResolver;
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string,
    private cliVersion: string,
    pathResolver?: PathResolver
  ) {
    this.pr = pathResolver ?? PathResolver.from({});
  }

  async check(): Promise<DriftResult[]> {
    return Promise.all([
      this.checkStaleTasks(),
      this.checkPriorityDrift(),
      this.checkDeadContext(),
      this.checkStaleDepends(),
      this.checkDependsGraph(),
      this.checkTaskTemplateCompliance(),
      this.checkFocusStatusAlignment(),
      this.checkArchiveMetaIntegrity(),
      this.checkHanseiPresent(),
      this.checkHanseiReconciliation(),
      this.checkOrphanTasks(),
      this.checkApprovalPresent(),
      this.checkArchivedIdeaDecisions(),
    ]);
  }

  async checkStaleTasks(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles(this.pr.tasks);
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const status = parts[2];
        
        const lastMod = await this.gitRepository.getFileLastModifiedDate(`${this.pr.tasks}/${file}`);
        if (!lastMod) continue;

        const ageMs = now - lastMod.getTime();

        if ((status === 'READY' || status === 'BLOCKED') && ageMs > THIRTY_DAYS_MS) {
          const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
          details.push(`${file.replace('.md', '')} is ${status} but has not been modified in ${days} days.`);
        } else if (status === 'IN_PROGRESS' && ageMs > THREE_DAYS_MS) {
          const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
          details.push(`${file.replace('.md', '')} is IN_PROGRESS but has no commit in ${days} days (stale lock).`);
        }
      }
    }

    return {
      check: 'StaleTasks',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkPriorityDrift(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles(this.pr.tasks);
    const archiveFiles = await this.getMarkdownFiles(this.pr.archive);
    
    const doneTaskIds = new Set(archiveFiles.map(f => f.replace('.md', '')));
    const allActiveTasks: { id: string; priority: number; status: string; isFocused: boolean; depends: string[] }[] = [];

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
      const headerMatch = content.match(/^## (TASK-\d+): (.*)/m);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      
      if (headerMatch && metaMatch) {
        const id = headerMatch[1];
        const metaLine = metaMatch[0];
        const parts = metaLine.split('|').map(s => s.trim());
        const priority = parts[0].replace('**Meta:** ', '');
        const status = parts[2];
        const focus = parts[3];
        
        allActiveTasks.push({
          id,
          priority: parseInt(priority.substring(1), 10),
          status,
          isFocused: focus === 'Focus:yes',
          depends: dependsMatch ? dependsMatch[1].split(',').map(s => s.trim()) : []
        });
      }
    }

    const focusedTasks = allActiveTasks.filter(t => t.isFocused && t.status !== 'DONE');
    if (focusedTasks.length === 0) {
      return { check: 'PriorityDrift', status: 'OK', details: [] };
    }

    const minFocusedPriority = Math.min(...focusedTasks.map(t => t.priority));

    for (const task of allActiveTasks) {
      if (task.status === 'READY' && !task.isFocused && task.priority < minFocusedPriority) {
        // Check if unblocked
        const isUnblocked = task.depends.every((dep: string) => dep === 'none' || doneTaskIds.has(dep));
        if (isUnblocked) {
          details.push(`${task.id} (P${task.priority}) is READY and unblocked, but not focused while a P${minFocusedPriority} task is focused.`);
        }
      }
    }

    return {
      check: 'PriorityDrift',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkDeadContext(): Promise<DriftResult> {
    const details: string[] = [];
    const taskFiles = await this.getMarkdownFiles(this.pr.tasks);

    for (const file of taskFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map(s => s.trim());
        const contextPart = parts[6];
        if (contextPart) {
          const paths = contextPart.split(',').map(s => s.trim());
          for (const p of paths) {
            if (!p || p === '' || p === 'none') continue;
            // Check if it's a glob
            if (p.includes('*')) continue;
            
            const exists = await this.fileSystem.exists(`${this.rootPath}/${p}`);
            if (!exists) {
              details.push(`${file.replace('.md', '')}: dead context path '${p}'`);
            }
          }
        }
      }
    }

    return {
      check: 'DeadContext',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkStaleDepends(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles(this.pr.tasks);
    const archiveFiles = await this.getMarkdownFiles(this.pr.archive);
    
    const allTaskFiles = [...activeFiles, ...archiveFiles];
    const existingTaskIds = new Set(allTaskFiles.map(f => f.replace('.md', '')));

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      if (dependsMatch) {
        const deps = dependsMatch[1].split(',').map(s => s.trim());
        for (const dep of deps) {
          if (!dep || dep === 'none') continue;
          if (!existingTaskIds.has(dep)) {
            details.push(`${file.replace('.md', '')}: stale dependency '${dep}'`);
          }
        }
      }
    }

    return {
      check: 'StaleDepends',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkDependsGraph(): Promise<DriftResult> {
    const details: string[] = [];
    const activeFiles = await this.getMarkdownFiles(this.pr.tasks);
    const archiveFiles = await this.getMarkdownFiles(this.pr.archive);
    const allTaskIds = new Set([
      ...activeFiles.map(f => f.replace('.md', '')),
      ...archiveFiles.map(f => f.replace('.md', '')),
    ]);

    const graph = new Map<string, string[]>();
    for (const file of activeFiles) {
      const id = file.replace('.md', '');
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      const deps: string[] = [];
      if (dependsMatch) {
        for (const dep of dependsMatch[1].split(',').map(s => s.trim())) {
          if (!dep || dep === 'none') continue;
          if (!allTaskIds.has(dep)) {
            details.push(`${id}: unknown dependency '${dep}'`);
          } else {
            deps.push(dep);
          }
        }
      }
      graph.set(id, deps);
    }

    // DFS cycle detection (active nodes only)
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node);
      inStack.add(node);
      for (const dep of graph.get(node) ?? []) {
        if (!graph.has(dep)) continue; // archived, no cycle possible from here
        if (!visited.has(dep)) {
          if (dfs(dep, [...path, dep])) return true;
        } else if (inStack.has(dep)) {
          const cycle = [...path, dep].join(' → ');
          details.push(`Circular dependency detected: ${cycle}`);
          return true;
        }
      }
      inStack.delete(node);
      return false;
    };

    for (const id of graph.keys()) {
      if (!visited.has(id)) dfs(id, [id]);
    }

    return {
      check: 'DependsGraph',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkTaskTemplateCompliance(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/${this.pr.tasks}`;
    if (!(await this.fileSystem.exists(tasksDir))) {
      return { check: 'TaskTemplateCompliance', status: 'OK', details: [] };
    }

    let hanseiSinceTaskId = 195;
    try {
      const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
      const config = JSON.parse(configRaw);
      hanseiSinceTaskId = config.governance?.hanseiSinceTaskId ?? 195;
    } catch { /* use default */ }

    const VALID_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
    const VALID_SIZES = new Set(['XS', 'S', 'M', 'L']);
    const TARGET_STATUSES = new Set(['READY', 'REVIEW']);

    const files = (await this.fileSystem.readDirectory(tasksDir))
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const details: string[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);
      const taskId = file.replace('.md', '');
      const taskNum = parseInt(taskId.replace('TASK-', ''), 10);

      // Only lint READY and REVIEW tasks
      const metaMatch = content.match(/\*\*Meta:\*\*\s*([^\n]*)/);
      if (!metaMatch) {
        details.push(`${taskId}: missing Meta line`);
        continue;
      }
      const metaLine = metaMatch[1];
      const parts = metaLine.split('|').map((s: string) => s.replace(/<!--.*-->/, '').trim());

      const [priority, size, status] = [parts[0], parts[1], parts[2]];

      if (!TARGET_STATUSES.has(status)) continue;

      if (!priority || !VALID_PRIORITIES.has(priority)) {
        details.push(`${taskId}: invalid Priority '${priority}' — expected P0/P1/P2/P3`);
      }
      if (!size || !VALID_SIZES.has(size)) {
        details.push(`${taskId}: invalid Size '${size}' — expected XS/S/M/L`);
      }
      if (!parts[4] || parts[4].trim() === '') {
        details.push(`${taskId}: missing Class field in Meta line`);
      }

      const hasACs = content.includes('- [ ]') || content.includes('- [x]');
      if (!hasACs) {
        details.push(`${taskId}: no Acceptance Criteria found`);
      }

      if (!content.includes('### Definition of Done')) {
        details.push(`${taskId}: missing ### Definition of Done section`);
      }

      const HANSEI_REQUIRED_SIZES = new Set(['M', 'L', 'XL']);
      if (!isNaN(taskNum) && taskNum >= hanseiSinceTaskId && HANSEI_REQUIRED_SIZES.has(size) && !content.includes('## Hansei')) {
        details.push(`${taskId}: missing ## Hansei section (required for M+ tasks, TASK-${hanseiSinceTaskId}+)`);
      }
    }

    return {
      check: 'TaskTemplateCompliance',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkFocusStatusAlignment(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/${this.pr.tasks}`;
    if (!(await this.fileSystem.exists(tasksDir))) {
      return { check: 'FocusStatusAlignment', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(tasksDir))
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const details: string[] = [];
    const conflicts: FocusConflict[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);
      const metaMatch = content.match(/\*\*Meta:\*\*[^\n]*/);
      if (!metaMatch) continue;

      const meta = metaMatch[0];
      const statusMatch = meta.match(/\|\s*(READY|IN_PROGRESS|REVIEW|BLOCKED|DONE)\s*\|/);
      const focusMatch = meta.match(/Focus:(NONE|LOW|MEDIUM|HIGH|yes|no)/i);

      if (!statusMatch || !focusMatch) continue;

      const status = statusMatch[1] as string;
      const rawFocus = focusMatch[1].toUpperCase();
      const focusMap: Record<string, FocusLevel> = {
        'YES': FocusLevel.HIGH,
        'NO': FocusLevel.NONE,
        'NONE': FocusLevel.NONE,
        'LOW': FocusLevel.LOW,
        'MEDIUM': FocusLevel.MEDIUM,
        'HIGH': FocusLevel.HIGH,
      };
      const focus = focusMap[rawFocus] ?? FocusLevel.NONE;
      const taskId = file.replace('.md', '');
      const isHumanClass = meta.includes('| human |') || meta.includes('| human\n');

      if (status === 'IN_PROGRESS' && focus === FocusLevel.NONE) {
        conflicts.push({
          taskId,
          status: status as TaskStatus,
          focus,
          severity: ConflictSeverity.H1,
          description: 'IN_PROGRESS with Focus:NONE — work has no energy assigned.',
        });
        details.push(`${taskId}: IN_PROGRESS but Focus:NONE — H1: debt of attention.`);
      } else if (status === 'DONE' && focus !== FocusLevel.NONE) {
        conflicts.push({
          taskId,
          status: status as TaskStatus,
          focus,
          severity: ConflictSeverity.H2,
          description: 'DONE with non-NONE focus — post-hoc misalignment, no rollback needed.',
        });
        details.push(`${taskId}: DONE but Focus:${focus} — H2: interpretative desalignment.`);
      } else if (status === 'BLOCKED' && focus === FocusLevel.HIGH) {
        conflicts.push({
          taskId,
          status: status as TaskStatus,
          focus,
          severity: ConflictSeverity.INFO,
          description: 'BLOCKED with Focus:HIGH — high energy on stalled work.',
        });
        details.push(`${taskId}: BLOCKED but Focus:HIGH — INFO: coherent, not a real conflict.`);
      } else if (status === 'READY' && focus === FocusLevel.HIGH && !isHumanClass) {
        details.push(`${taskId}: READY but Focus:HIGH — focus assigned to non-executing task.`);
      }
    }

    return {
      check: 'FocusStatusAlignment',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkArchiveMetaIntegrity(): Promise<DriftResult> {
    const archiveDir = `${this.rootPath}/${this.pr.archive}`;
    if (!(await this.fileSystem.exists(archiveDir))) {
      return { check: 'ArchiveMetaIntegrity', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(archiveDir))
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const details: string[] = [];
    const VALID_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL']);
    const KNOWN_STATUSES = new Set(['DONE', 'REJECTED', 'READY', 'IN_PROGRESS', 'REVIEW', 'BLOCKED']);
    const TERMINAL_STATUSES = new Set(['DONE', 'REJECTED']);

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);
      const metaMatch = content.match(/\*\*Meta:\*\*\s*(.+)/);

      if (!metaMatch) {
        details.push(`${file}: missing or unparseable Meta line — run backfill`);
        continue;
      }

      const fields = metaMatch[1].split('|').map(f => f.replace(/<!--.*-->/, '').trim());

      const size = fields[1] ?? '';
      if (!size || !VALID_SIZES.has(size)) {
        details.push(`${file}: invalid Size field '${size}' — expected XS/S/M/L`);
      }

      const statusField = fields.find(f => KNOWN_STATUSES.has(f));
      if (!statusField || !TERMINAL_STATUSES.has(statusField)) {
        details.push(`${file}: status is '${statusField ?? 'unknown'}' — archived tasks must be DONE or REJECTED`);
      }
    }

    return {
      check: 'ArchiveMetaIntegrity',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkHanseiPresent(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const hanseiSinceTaskId = (config.governance?.hanseiSinceTaskId ?? config.hanseiSinceTaskId) as number | undefined;
    const archiveFiles = await this.getMarkdownFiles(this.pr.archive);
    const details: string[] = [];

    for (const file of archiveFiles) {
      const taskIdMatch = file.match(/^TASK-(\d+)\.md$/);
      if (!taskIdMatch) continue;

      const taskId = parseInt(taskIdMatch[1], 10);
      if (hanseiSinceTaskId !== undefined && taskId < hanseiSinceTaskId) {
        continue;
      }

      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.archive}/${file}`);
      const metaMatch = content.match(/^\*\*Meta:\*\*\s+[^|]+\|\s*(\S+)\s*\|/m);
      const size = metaMatch?.[1] ?? '';
      if (!['M', 'L', 'XL'].includes(size)) continue;
      if (!content.includes('## Hansei')) {
        details.push(`${file.replace('.md', '')}: missing ## Hansei section`);
      }
    }

    return {
      check: 'HanseiPresent',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkHanseiReconciliation(): Promise<DriftResult> {
    const tasksDir = `${this.rootPath}/${this.pr.tasks}`;
    const auditor = new HanseiAuditor(this.fileSystem, this.rootPath);
    const details: string[] = [];

    let taskFiles: string[] = [];
    try {
      taskFiles = (await this.fileSystem.readDirectory(tasksDir))
        .filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
    } catch {
      return { check: 'HanseiReconciliation', status: 'OK', details: [] };
    }

    for (const file of taskFiles) {
      const content = await this.fileSystem.readFile(`${tasksDir}/${file}`);

      // Only audit tasks in REVIEW — they have complete implementation
      if (!content.includes('| REVIEW |') && !content.includes('| REVIEW\n')) continue;

      // Parse task minimally for audit
      const idMatch = content.match(/^## (TASK-\d+)/m);
      if (!idMatch) continue;

      const hanseiMatch = content.match(/## Hansei\n\*\*Severity:\*\*\s*(\S+)\n\*\*Category:\*\*\s*(\S+)\n\*\*Decision:\*\*\s*([\s\S]*?)\n\*\*Constraint:\*\*\s*([\s\S]*?)\n\*\*Cost:\*\*\s*([\s\S]*?)\n\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n##|$)/m);
      if (!hanseiMatch) continue;

      const task: Task = {
        id: idMatch[1],
        title: '',
        priority: '',
        size: '',
        status: TaskStatus.REVIEW,
        focus: FocusLevel.NONE,
        sprint: '',
        class: '',
        cli: '',
        context: [],
        content: '',
        filePath: '',
        acceptanceCriteria: [],
        hansei: {
          severity: hanseiMatch[1].trim() as unknown as Hansei['severity'],
          category: hanseiMatch[2].trim(),
          decision: hanseiMatch[3].trim(),
          constraint: hanseiMatch[4].trim(),
          cost: hanseiMatch[5].trim(),
          forwardAction: hanseiMatch[6].trim(),
        },
        depends: [],
      };
      const changedFiles = HanseiAuditor.extractChangedFiles(content);
      const result = await auditor.audit(task, changedFiles);

      if (result.verdict === 'CONCEALMENT') {
        details.push(`${result.taskId}: ${result.details.join(' | ')}`);
      } else if (result.verdict === 'INFLATION') {
        details.push(`${result.taskId} (WARN): ${result.details.join(' | ')}`);
      }
    }

    return {
      check: 'HanseiReconciliation',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkOrphanTasks(): Promise<DriftResult> {
    const activeFiles = await this.getMarkdownFiles(this.pr.tasks);

    const tasks: { id: string; status: string; dependsOn: string[] }[] = [];

    for (const file of activeFiles) {
      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.tasks}/${file}`);
      const id = file.replace('.md', '');
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      const status = metaMatch ? metaMatch[0].split('|').map(s => s.trim())[2] : '';
      const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
      const dependsOn = dependsMatch
        ? dependsMatch[1].split(',').map(s => s.trim()).filter(s => s && s !== 'none')
        : [];
      tasks.push({ id, status, dependsOn });
    }

    const activeRootIds = new Set(
      tasks.filter(t => t.status === 'READY' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW').map(t => t.id)
    );

    if (activeRootIds.size === 0) {
      return { check: 'OrphanTasks', status: 'OK', details: [] };
    }

    // Build enables graph: dependency → [dependents that need it]
    const enables = new Map<string, string[]>();
    for (const task of tasks) {
      for (const dep of task.dependsOn) {
        if (!enables.has(dep)) enables.set(dep, []);
        enables.get(dep)!.push(task.id);
      }
    }

    // BFS from active roots following enables edges
    const reachable = new Set<string>(activeRootIds);
    const queue = [...activeRootIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dependent of enables.get(current) ?? []) {
        if (!reachable.has(dependent)) {
          reachable.add(dependent);
          queue.push(dependent);
        }
      }
    }

    const details = tasks
      .filter(t => !reachable.has(t.id))
      .map(t => `${t.id} is not reachable from any active node (orphan task).`);

    return { check: 'OrphanTasks', status: details.length === 0 ? 'OK' : 'WARN', details };
  }

  async checkApprovalPresent(): Promise<DriftResult> {
    const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
    const config = JSON.parse(configRaw);
    const sinceTaskId = (config.governance?.hanseiSinceTaskId ?? config.hanseiSinceTaskId) as number | undefined;

    const archiveFiles = await this.getMarkdownFiles(this.pr.archive);
    const details: string[] = [];

    for (const file of archiveFiles) {
      const taskIdMatch = file.match(/^TASK-(\d+)\.md$/);
      if (!taskIdMatch) continue;

      const taskId = parseInt(taskIdMatch[1], 10);
      if (sinceTaskId !== undefined && taskId < sinceTaskId) continue;

      const content = await this.fileSystem.readFile(`${this.rootPath}/${this.pr.archive}/${file}`);

      // L3 gate (ADR-009): XS and S tasks self-archive eligible — exempt from Approval requirement
      const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
      if (metaMatch) {
        const parts = metaMatch[0].split('|').map((s: string) => s.trim());
        const size = parts[1];
        if (size === 'XS' || size === 'S') {
          continue;
        }
      }

      if (!content.includes('## Approval')) {
        details.push(`${file.replace('.md', '')}: missing ## Approval section — required for human-reviewed tasks.`);
      }
    }

    return {
      check: 'ApprovalPresent',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  async checkArchivedIdeaDecisions(): Promise<DriftResult> {
    const archiveDir = `${this.rootPath}/${this.pr.refinementArchive}`;
    if (!(await this.fileSystem.exists(archiveDir))) {
      return { check: 'ArchivedIdeaDecisions', status: 'OK', details: [] };
    }

    const files = (await this.fileSystem.readDirectory(archiveDir))
      .filter(f => f.startsWith('IDEA-') && f.endsWith('.md'));

    const details: string[] = [];

    for (const file of files) {
      const content = await this.fileSystem.readFile(`${archiveDir}/${file}`);

      // Find Decision field content
      const decisionMatch = content.match(/^## Decision\n([\s\S]*?)(?=\n##|$)/m);
      if (!decisionMatch) {
        details.push(`${this.pr.refinementArchive}/${file}: missing Decision section — every archived IDEA must have a human decision (PROMOTE, REJECT, or DEFERRED).`);
        continue;
      }

      const decision = decisionMatch[1].trim();
      // Empty or only a placeholder comment
      if (decision === '' || decision.startsWith('<!--')) {
        details.push(`${this.pr.refinementArchive}/${file}: empty Decision field — archived without a recorded human decision.`);
      }
    }

    return {
      check: 'ArchivedIdeaDecisions',
      status: details.length === 0 ? 'OK' : 'WARN',
      details,
    };
  }

  private async getMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const files = await this.fileSystem.readDirectory(`${this.rootPath}/${dir}`);
      return files.filter(f => f.endsWith('.md'));
    } catch { return []; }
  }

}
