import { FileSystem } from '../../../main/ts/domain/repositories/file-system.js';
import { GitRepository } from '../../../main/ts/domain/repositories/git-repository.js';
import { TaskRepository } from '../../../main/ts/domain/repositories/task-repository.js';
import { Task, TaskStatus } from '../../../main/ts/domain/models/task.js';
import { LLMProvider, ChatRequest, ChatResponse } from '../../../main/ts/domain/services/llm-provider.js';
import { FeedbackRepository } from '../../../main/ts/domain/repositories/feedback-repository.js';
import { FeedbackSignal } from '../../../main/ts/domain/models/feedback-signal.js';
import { SignalDomain, SignalType } from '../../../main/ts/domain/models/causal-signal.js';
import { RelationType } from '../../../main/ts/domain/models/causal-relation.js';
import { EventRepository, ArchEvent } from '../../../main/ts/domain/models/event.js';
import { Reviewer, ReviewResult } from '../../../main/ts/domain/services/reviewer.js';

export type CommitRecord = {
  hash: string;
  message: string;
  date: string;
  files: Array<{ path: string; status: string; oldPath?: string }>;
};

export class MockFileSystem implements FileSystem {
  files: Record<string, string> = {};
  dirs: Record<string, string[]> = {};
  written: Record<string, string> = {};
  writeCalls: Array<{ path: string; content: string }> = [];

  addFile(path: string, content: string): void {
    this.files[path] = content;
  }

  async readFile(path: string): Promise<string> {
    if (!(path in this.files)) throw new Error(`File not found: ${path}`);
    return this.files[path];
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files[path] = content;
    this.written[path] = content;
    this.writeCalls.push({ path, content });
  }

  async exists(path: string): Promise<boolean> {
    return path in this.files || path in this.dirs;
  }

  async readDirectory(path: string): Promise<string[]> {
    return this.dirs[path] ?? [];
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    // only moves files; dirs entries are not tracked through rename
    if (oldPath in this.files) {
      this.files[newPath] = this.files[oldPath];
      delete this.files[oldPath];
    }
  }

  async mkdir(path: string): Promise<void> {
    this.dirs[path] = [];
  }

  async appendFile(path: string, content: string): Promise<void> {
    this.files[path] = (this.files[path] ?? '') + content;
    this.written[path] = this.files[path];
  }

  async deleteFile(path: string): Promise<void> {
    delete this.files[path];
  }
}

export class MockTaskRepository implements TaskRepository {
  tasks: Task[] = [];
  archivedTasks: Task[] = [];
  nextId = 'TASK-001';
  fileSystem?: FileSystem;
  saved: Task | null = null;

  async getById(id: string): Promise<Task | null> {
    return this.tasks.find(t => t.id === id) ?? this.archivedTasks.find(t => t.id === id) ?? null;
  }
  async getAll(): Promise<Task[]> { return [...this.tasks, ...this.archivedTasks]; }
  async getActive(): Promise<Task[]> { return this.tasks; }
  async save(task: Task): Promise<void> {
    this.saved = task;
    const idx = this.tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) this.tasks[idx] = task;
    else this.tasks.push(task);
  }
  async findReady(): Promise<Task[]> { return this.tasks.filter(t => t.status === TaskStatus.READY); }
  async getNextId(): Promise<string> { return this.nextId; }
  parseTask(_content: string): Task | null { return null; }
}

export class MockLLMProvider implements LLMProvider {
  response: string = '';
  capturedRequest: ChatRequest | null = null;

  async complete(request: ChatRequest): Promise<ChatResponse> {
    this.capturedRequest = request;
    return {
      content: this.response,
      usage: { latencyMs: 100 }
    };
  }
}

export class MockFeedbackRepository implements FeedbackRepository {
  signals: FeedbackSignal[] = [];
  async readAll(): Promise<FeedbackSignal[]> { return this.signals; }
  async append(signal: FeedbackSignal): Promise<void> { this.signals.push(signal); }
}

export class MockCausalSignalLog {
  emitted: any[] = [];
  async append(params: {
    domain: SignalDomain;
    signal_type: SignalType;
    candidate_from: string;
    candidate_relation: RelationType;
    candidate_to: string;
    edge_id?: string;
    confidence: number;
    event: string;
  }): Promise<any> {
    this.emitted.push(params);
    return { id: 'test-uuid' };
  }
}

export class MockEventRepository implements EventRepository {
  events: ArchEvent[] = [];
  async append(event: ArchEvent): Promise<void> { this.events.push(event); }
}

export class MockHumanCoordinationService {
  async approveTask(_taskId: string): Promise<void> {}
  async redirectTask(_taskId: string, _instruction: string): Promise<void> {}
}

export class MockReviewer implements Reviewer {
  violations: string[] = [];
  reviewTask(_task: Task, _rawMetaLine?: string): ReviewResult {
    return { valid: this.violations.length === 0, violations: this.violations };
  }
  validateCommitMessage(_message: string): ReviewResult {
    return { valid: this.violations.length === 0, violations: this.violations };
  }
  validateImmutability(_changedFiles: string[], _commitMessage: string, _protectedPaths: string[], _activeTasks: Task[]): ReviewResult {
    return { valid: this.violations.length === 0, violations: this.violations };
  }
}

export class MockGitRepository implements GitRepository {
  commits: CommitRecord[] = [];
  validHashes = new Set<string>();
  diff = '';
  lastCommitMessage: string | null = null;
  currentBranch = 'main';
  statusLines: string[] = [];
  changedFilesInLastCommit: string[] = [];
  addCalls: string[] = [];
  /** @deprecated use addCalls */
  get addedFiles(): string[] { return this.addCalls; }
  repoRoot = '';
  lastCommitHash: string | null = null;
  commitCalls: string[] = [];
  mvCalls: Array<{ src: string; dst: string }> = [];
  tags: string[] = [];
  pushArgs: string[][] = [];

  async getDiff(_args?: string[]): Promise<string> { return this.diff; }
  async getLastCommitMessage(): Promise<string | null> { return this.lastCommitMessage; }
  async getCurrentBranch(): Promise<string> { return this.currentBranch; }
  async getStatusLines(): Promise<string[]> { return this.statusLines; }
  async getLog(_limit?: number): Promise<string[]> { return []; }
  async add(path: string): Promise<void> { this.addCalls.push(path); }
  async rm(_path: string): Promise<void> {}
  async mv(oldPath: string, newPath: string): Promise<void> { this.mvCalls.push({ src: oldPath, dst: newPath }); }
  async commit(message: string): Promise<void> { this.commitCalls.push(message); }
  async getFileLastModifiedDate(_path: string): Promise<Date | null> { return new Date(); }
  async getChangedFilesInLastCommit(): Promise<string[]> { return this.changedFilesInLastCommit; }
  async getMergeCommits(_limit: number): Promise<string[]> { return []; }
  async getStagedFiles(): Promise<string[]> { return []; }
  async getModifiedFiles(): Promise<string[]> { return []; }
  async getRepoRoot(): Promise<string> { return this.repoRoot; }
  async getFileFirstCommitDate(_path: string): Promise<Date | null> { return null; }
  async getLastCommitHash(): Promise<string | null> { return this.lastCommitHash; }
  async isValidCommitHash(hash: string): Promise<boolean> { return this.validHashes.has(hash); }
  async getCommitAuthor(_hash: string): Promise<string | null> { return 'test-user'; }
  async getCommitCountBetween(_fromHash: string, _toRef?: string): Promise<number | null> { return null; }
  async getCommitHistory(_limit?: number): Promise<CommitRecord[]> {
    if (this.lastCommitMessage === 'FAIL_HISTORY') throw new Error('git log failed');
    return this.commits;
  }
  async tag(name: string, _message?: string): Promise<void> { this.tags.push(name); }
  async push(args: string[] = []): Promise<void> { this.pushArgs.push(args); }
}

export function createTestRepo(options?: {
  files?: Record<string, string>;
  dirs?: Record<string, string[]>;
}): { fs: MockFileSystem; git: MockGitRepository } {
  const fs = new MockFileSystem();
  fs.dirs['.arch'] = [];
  fs.dirs['docs/tasks'] = [];
  if (options?.files) Object.assign(fs.files, options.files);
  if (options?.dirs) Object.assign(fs.dirs, options.dirs);
  return { fs, git: new MockGitRepository() };
}
