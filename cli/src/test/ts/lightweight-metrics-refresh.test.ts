import { test } from 'node:test';
import assert from 'node:assert';
import { LightweightMetricsRefresh } from '../../main/ts/application/use-cases/lightweight-metrics-refresh.js';
import { MockFileSystem } from './mocks/index.js';

const SAMPLE_METRICS = `# ARCH Metrics

<!-- GENERATED:START -->
## Operational Metrics

*Last updated: 2026-01-01T00:00:00.000Z*

### Trusted Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Completed Tasks** | 100 | total archived |
| **REVIEW_FAIL Rate** | 0.0% | rejected / total review exits |

### Cycle Time (P50/P90)

| Size | P50 | P90 | Count |
|------|-----|-----|-------|
| XS | 0.7h | 22.7h | 55 |

### Experimental Metrics

> Confidence is below the threshold required for canonical use.

| Metric | Value | Notes |
|--------|-------|-------|
| **Integrity Level** | LOW | CONFIDENCE: 0% |

> **Epistemic Digest:** \`metrics-engine-v4\` (Range: \`HEAD~100..HEAD\`)

<!-- GENERATED:END -->
`;

test('LightweightMetricsRefresh - updates Completed Tasks row', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 142, reviewFailRate: 0 });

  const result = fs.written['docs/METRICS.md'];
  assert.ok(result.includes('| **Completed Tasks** | 142 | total archived |'), 'should update completedTasks');
});

test('LightweightMetricsRefresh - updates REVIEW_FAIL Rate row', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 100, reviewFailRate: 0.25 });

  const result = fs.written['docs/METRICS.md'];
  assert.ok(result.includes('| **REVIEW_FAIL Rate** | 25.0% | rejected / total review exits |'), 'should update reviewFailRate');
});

test('LightweightMetricsRefresh - handles pending reviewFailRate', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 5, reviewFailRate: 'pending' });

  const result = fs.written['docs/METRICS.md'];
  assert.ok(
    result.includes('| **REVIEW_FAIL Rate** | pending (insufficient event history) | rejected / total review exits |'),
    'should format pending rate'
  );
});

test('LightweightMetricsRefresh - leaves Experimental section unchanged', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 200, reviewFailRate: 0 });

  const result = fs.written['docs/METRICS.md'];
  assert.ok(result.includes('### Experimental Metrics'), 'Experimental section header preserved');
  assert.ok(result.includes('**Integrity Level**'), 'Integrity Level row preserved');
  assert.ok(result.includes('Epistemic Digest'), 'Epistemic Digest preserved');
  assert.ok(result.includes('metrics-engine-v4'), 'Digest content preserved');
});

test('LightweightMetricsRefresh - leaves Cycle Time section unchanged', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 200, reviewFailRate: 0 });

  const result = fs.written['docs/METRICS.md'];
  assert.ok(result.includes('### Cycle Time (P50/P90)'), 'Cycle Time section preserved');
  assert.ok(result.includes('0.7h'), 'Cycle Time data preserved');
});

test('LightweightMetricsRefresh - always writes because timestamp is updated', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const refresh = new LightweightMetricsRefresh(fs);
  // Even with identical metric values the timestamp changes so the file is always written
  await refresh.execute({ completedTasks: 100, reviewFailRate: 0 });

  assert.ok(fs.written['docs/METRICS.md'] !== undefined, 'should write because timestamp changed');
});

test('LightweightMetricsRefresh - updates Last updated timestamp', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/METRICS.md'] = SAMPLE_METRICS;

  const before = Date.now();
  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 100, reviewFailRate: 0 });
  const after = Date.now();

  const result = fs.written['docs/METRICS.md'];
  assert.ok(result, 'file must be written');
  const match = result.match(/\*Last updated: ([^*]+)\*/);
  assert.ok(match, 'Last updated line must be present');
  const written = new Date(match![1].trim()).getTime();
  assert.ok(written >= before && written <= after, 'timestamp must be within the execution window');
  assert.ok(!result.includes('2026-01-01T00:00:00.000Z'), 'old timestamp must be replaced');
});

test('LightweightMetricsRefresh - throws on missing METRICS.md', async () => {
  const fs = new MockFileSystem();
  // No docs/METRICS.md in fs

  const refresh = new LightweightMetricsRefresh(fs);
  await assert.rejects(
    () => refresh.execute({ completedTasks: 10, reviewFailRate: 0 }),
    /File not found/
  );
});
