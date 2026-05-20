import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CorpusAuditCommand } from '../../main/ts/application/commands/corpus-audit-command.js';
import { CorpusIndexService } from '../../main/ts/application/use-cases/corpus-index.js';
import { MockFileSystem } from './mocks/index.js';

// Helpers
function makeFs(entries: Record<string, string>): MockFileSystem {
  const fs = new MockFileSystem();
  const archive = Object.keys(entries);
  fs.dirs['docs/archive'] = archive;
  fs.dirs['docs/refinement'] = [];
  fs.dirs['docs/refinement/archive'] = [];
  for (const [file, content] of Object.entries(entries)) {
    fs.files[`docs/archive/${file}`] = content;
  }
  return fs;
}

const H0_TASK = (id: string, decision = 'Implementation was clean, nothing unexpected.') => `## ${id}: task
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/
**Closed-at:** 2026-05-19T10:00:00Z
## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** ${decision}
**Constraint:** None encountered.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.
`;

const H2_WITH_IDEA = (id: string, ideaSlug: string) => `## ${id}: task
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/
**Closed-at:** 2026-05-19T10:00:00Z
## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Pattern recurred across three tasks this sprint.
**Constraint:** Spec was too vague about boundary conditions.
**Cost:** Extra hour to debug the edge case.
**Forward Action:** File ${ideaSlug} to address this pattern systemically.
`;

describe('CorpusAuditCommand — weighted score', () => {
  test('perfect corpus: score is 100', async () => {
    const fs = makeFs({
      'TASK-001.md': H0_TASK('TASK-001'),
      'TASK-002.md': H0_TASK('TASK-002'),
      'TASK-003.md': H0_TASK('TASK-003'),
    });

    // Pre-build index
    const idx = await new CorpusIndexService(fs).rebuild();
    fs.files['.arch/corpus-index.json'] = JSON.stringify(idx);

    const cmd = new CorpusAuditCommand(fs, undefined, '.');
    const score = await cmd.runQuiet();
    assert.equal(score, 100, `Expected 100, got ${score}`);
  });

  test('missed H2+ IDEA (WARN) penalizes more than entropy INFO', async () => {
    // Build a corpus: 20 clean tasks + 1 H2 with unfiled IDEA
    const entries: Record<string, string> = {};
    for (let i = 1; i <= 20; i++) {
      entries[`TASK-${String(i).padStart(3,'0')}.md`] = H0_TASK(`TASK-${String(i).padStart(3,'0')}`);
    }
    entries['TASK-021.md'] = H2_WITH_IDEA('TASK-021', 'IDEA-missing-boundary-check');

    const fs = makeFs(entries);
    const idx = await new CorpusIndexService(fs).rebuild();
    fs.files['.arch/corpus-index.json'] = JSON.stringify(idx);

    const cmd = new CorpusAuditCommand(fs, undefined, '.');
    const score = await cmd.runQuiet();

    // 1 WARN (forward-action, weight 3) / 21 tasks * 100 = ~14 pts off → score ~86
    assert.ok(score < 100, 'Score should be penalized');
    assert.ok(score > 80, `Score should still be above warn threshold, got ${score}`);
  });

  test('runQuiet returns numeric score', async () => {
    const fs = makeFs({ 'TASK-001.md': H0_TASK('TASK-001') });
    const idx = await new CorpusIndexService(fs).rebuild();
    fs.files['.arch/corpus-index.json'] = JSON.stringify(idx);

    const cmd = new CorpusAuditCommand(fs, undefined, '.');
    const score = await cmd.runQuiet();
    assert.ok(typeof score === 'number', 'Should return a number');
    assert.ok(score >= 0 && score <= 100, `Score ${score} out of range`);
  });

  test('entropy detection: 5 same-phrase decisions flagged', async () => {
    const repeatedDecision = 'task completed directly session without formal lifecycle applied before task file';
    const entries: Record<string, string> = {};
    for (let i = 1; i <= 10; i++) {
      const decision = i <= 5 ? repeatedDecision : `Unique decision for task ${i} with distinct content and observations.`;
      entries[`TASK-${String(i).padStart(3,'0')}.md`] = H0_TASK(`TASK-${String(i).padStart(3,'0')}`, decision);
    }

    const fs = makeFs(entries);
    const idx = await new CorpusIndexService(fs).rebuild();
    fs.files['.arch/corpus-index.json'] = JSON.stringify(idx);

    const cmd = new CorpusAuditCommand(fs, undefined, '.');
    const score = await cmd.runQuiet();
    assert.ok(score < 100, `Expected entropy penalty, score was ${score}`);
  });

  test('unfiled IDEA reference is a WARN, vague IDEA mention is INFO', async () => {
    const withSlug = H2_WITH_IDEA('TASK-001', 'IDEA-specific-thing');
    const withVague = `## TASK-002: task
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/
**Closed-at:** 2026-05-19T10:00:00Z
## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Pattern found that needs tracking.
**Constraint:** Pattern recurred.
**Cost:** Some overhead.
**Forward Action:** File an IDEA to address this pattern.
`;

    const fs = makeFs({ 'TASK-001.md': withSlug, 'TASK-002.md': withVague });
    const idx = await new CorpusIndexService(fs).rebuild();
    fs.files['.arch/corpus-index.json'] = JSON.stringify(idx);

    const cmd = new CorpusAuditCommand(fs, undefined, '.');
    const result = await (cmd as any).audit(false);

    const findings = result.findings as any[];
    const warnForward = findings.filter(f => f.check === 'forward-action' && f.severity === 'WARN');
    const infoForward = findings.filter(f => f.check === 'forward-action' && f.severity === 'INFO');

    assert.equal(warnForward.length, 1, 'Named unfiled IDEA should be WARN');
    assert.equal(infoForward.length, 1, 'Vague IDEA mention should be INFO');
  });
});

test('CorpusAuditCommand --layer2 runs without error and prints Drift and Anomalies headers', async () => {
  const archiveContent = (id: string, cat: string) => `## ${id}: Test task
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-01-0${id.slice(-1)}T00:00:00Z
**Depends:** none

### Acceptance Criteria
- [x] File exists
  - \`file: docs/out.md\`
- [x] Tests pass
  - \`cmd: npm test; exit: 0\`

## Hansei
**Severity:** H1
**Category:** ${cat}
**Decision:** Some recurring issue found in implementation.
**Constraint:** None — minor issue.
**Cost:** No additional cost incurred.
**Forward Action:** None required.`;

  const fs = new MockFileSystem();
  fs.files['docs/archive/TASK-001.md'] = archiveContent('TASK-001', '[SpecDrift]');
  fs.files['docs/archive/TASK-002.md'] = archiveContent('TASK-002', '[SpecDrift]');
  fs.dirs['docs/archive'] = ['TASK-001.md', 'TASK-002.md'];
  fs.dirs['docs/refinement'] = [];
  fs.dirs['docs/refinement/archive'] = [];
  fs.files['arch.config.json'] = JSON.stringify({ hanseiSinceTaskId: 0 });

  const lines: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => lines.push(args.join(' '));
  try {
    const cmd = new CorpusAuditCommand(fs as any);
    await cmd.execute(['--layer2']);
  } finally {
    console.log = orig;
  }

  const output = lines.join('\n');
  assert.ok(output.includes('Drift') || output.includes('drift'), 'must include drift section');
  assert.ok(output.includes('Anomal') || output.includes('anomal'), 'must include anomaly section');
});
