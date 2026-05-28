import { test } from 'node:test';
import assert from 'node:assert';
import { MarkdownTaskRepository } from '../../main/ts/infrastructure/filesystem/markdown-task-repository.js';
import { TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';

const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const STATUSES: TaskStatus[] = [
  TaskStatus.DRAFT, TaskStatus.IDEA, TaskStatus.BACKLOG,
  TaskStatus.READY, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW,
  TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.REJECTED,
];
const FOCUS_PAIRS: [FocusLevel, string][] = [
  [FocusLevel.HIGH, 'yes'],
  [FocusLevel.NONE, 'no'],
];

function buildMetaLine(opts: {
  priority: string; size: string; status: TaskStatus; focus: FocusLevel;
  taskClass: string; cli: string; context: string[];
}): string {
  const focusStr = opts.focus !== FocusLevel.NONE ? 'yes' : 'no';
  return `**Meta:** ${opts.priority} | ${opts.size} | ${opts.status} | Focus:${focusStr} | ${opts.taskClass} | ${opts.cli} | ${opts.context.join(', ')}`;
}

function makeContent(metaLine: string, title = 'Test'): string {
  return `## TASK-999: ${title}\n${metaLine}\n`;
}

const repo = new MarkdownTaskRepository({} as any);

// ---------------------------------------------------------------------------
// Round-trip property test: parse(serialize(task)) === task
// ---------------------------------------------------------------------------

test('meta-line round-trip: all priority × size × status × focus combinations', () => {
  const taskClass = '2-code-generation';
  const cli = 'local';
  const context = ['test/path'];
  let count = 0;

  for (const priority of PRIORITIES) {
    for (const size of SIZES) {
      for (const status of STATUSES) {
        for (const [focusLevel] of FOCUS_PAIRS) {
          const metaLine = buildMetaLine({ priority, size, status, focus: focusLevel, taskClass, cli, context });
          const content = makeContent(metaLine);
          const task = repo.parseTask(content);

          assert.ok(task, `parseTask returned null for valid meta: ${metaLine}`);
          assert.strictEqual(task.priority, priority);
          assert.strictEqual(task.size, size);
          assert.strictEqual(task.status, status);
          assert.strictEqual(task.focus, focusLevel);
          assert.strictEqual(task.class, taskClass);
          assert.strictEqual(task.cli, cli);
          assert.deepStrictEqual(task.context, context);

          const serializedMeta = buildMetaLine({
            priority: task.priority, size: task.size, status: task.status,
            focus: task.focus, taskClass: task.class, cli: task.cli, context: task.context,
          });
          const reparsed = repo.parseTask(makeContent(serializedMeta));
          assert.ok(reparsed, `re-parse returned null: ${serializedMeta}`);
          assert.strictEqual(reparsed.priority, priority);
          assert.strictEqual(reparsed.size, size);
          assert.strictEqual(reparsed.status, status);
          assert.strictEqual(reparsed.focus, focusLevel);

          count++;
        }
      }
    }
  }
  assert.strictEqual(count, PRIORITIES.length * SIZES.length * STATUSES.length * FOCUS_PAIRS.length);
});

// ---------------------------------------------------------------------------
// Boundary tests
// ---------------------------------------------------------------------------

test('boundary: empty context field', () => {
  const metaLine = buildMetaLine({
    priority: 'P1', size: 'S', status: TaskStatus.READY,
    focus: FocusLevel.NONE, taskClass: '2-code-generation', cli: 'local',
    context: [],
  });
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task);
  assert.ok(Array.isArray(task.context));
});

test('boundary: long context path', () => {
  const longPath = 'src/very/deeply/nested/directory/structure/that/exceeds/normal/path/lengths/for/testing/purposes/and/keeps/going/deeper/still/with/more/levels';
  const metaLine = buildMetaLine({
    priority: 'P1', size: 'M', status: TaskStatus.IN_PROGRESS,
    focus: FocusLevel.HIGH, taskClass: '2-code-generation', cli: 'local',
    context: [longPath],
  });
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task);
  assert.strictEqual(task.context[0], longPath);
});

test('boundary: special characters in title (colons, dashes, pipes)', () => {
  const title = 'feat: add auth middleware - OAuth2 | JWT';
  const metaLine = buildMetaLine({
    priority: 'P2', size: 'S', status: TaskStatus.READY,
    focus: FocusLevel.NONE, taskClass: '6-writing', cli: 'claude',
    context: ['docs/'],
  });
  const content = makeContent(metaLine, title);
  const task = repo.parseTask(content);
  assert.ok(task);
  assert.strictEqual(task.title, title);
});

test('boundary: Unicode in title', () => {
  const title = 'Support français, 日本語, 中文, and русский in task names';
  const metaLine = buildMetaLine({
    priority: 'P2', size: 'S', status: TaskStatus.READY,
    focus: FocusLevel.NONE, taskClass: '2-code-generation', cli: 'local',
    context: ['i18n/'],
  });
  const content = makeContent(metaLine, title);
  const task = repo.parseTask(content);
  assert.ok(task);
  assert.strictEqual(task.title, title);
});

test('boundary: multiple context paths round-trip', () => {
  const contexts = ['src/main/ts/', 'src/test/ts/', 'docs/'];
  const metaLine = buildMetaLine({
    priority: 'P0', size: 'L', status: TaskStatus.REVIEW,
    focus: FocusLevel.HIGH, taskClass: '2-code-generation', cli: 'claude',
    context: contexts,
  });
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task);
  assert.deepStrictEqual(task.context, contexts);
});

test('boundary: DONE status with Cost and Steps in meta line', () => {
  const metaLine = `**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/ | Cost: $10.50 | Steps: 3`;
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task);
  assert.strictEqual(task.status, TaskStatus.DONE);
  assert.strictEqual(task.cost, 10.50);
  assert.strictEqual(task.steps, 3);
});

// ---------------------------------------------------------------------------
// Malformed input tests — must never throw
// ---------------------------------------------------------------------------

test('malformed: missing fields in meta line', () => {
  const metaLine = '**Meta:** P0 | S | READY';
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task, 'parser returns a Task object for partial meta');
});

test('malformed: wrong number of pipe-separated parts (too few)', () => {
  const metaLine = '**Meta:** P0 | S';
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task, 'parser returns a Task object for truncated meta');
  assert.strictEqual(task.priority, 'P0');
});

test('malformed: unrecognized status value', () => {
  const metaLine = '**Meta:** P0 | S | INVALID_STATUS | Focus:no | 2-code-generation | local | test/path';
  const task = repo.parseTask(makeContent(metaLine));
  assert.ok(task, 'parser returns a Task object despite invalid status');
});

test('malformed: wrong pipe separator (using colon instead of pipe)', () => {
  const metaLine = '**Meta:** P0 : S : READY : Focus:no : 2-code-generation : local : test/path';
  const content = makeContent(metaLine);
  const task = repo.parseTask(content);
  assert.ok(task, 'parser returns a Task object despite non-pipe separator');
});

test('malformed: empty meta line content (no **Meta:** prefix)', () => {
  const content = '## TASK-999: Test\n';
  const task = repo.parseTask(content);
  assert.strictEqual(task, null);
});

test('malformed: completely empty content', () => {
  const task = repo.parseTask('');
  assert.strictEqual(task, null);
});
