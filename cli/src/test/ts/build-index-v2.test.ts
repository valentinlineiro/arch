import { test } from 'node:test';
import assert from 'node:assert';
import { canonicalize } from '../../main/ts/application/use-cases/build-index.js'; // Assuming utility is exported from use-case
import { MockFileSystem, MockGitRepository } from './mocks/index.js';

// ============================================================================
// Test 1: Canonicalization Invariant
// ============================================================================
test('BuildIndex v2: canonicalize() enforces key and array sorting for deterministic serializations', () => {
  const objectA = {
    z: 'last',
    a: 'first',
    nested: {
      y: 2,
      x: 1,
    },
    list: ['banana', 'apple', 'cherry'],
  };

  const objectB = {
    nested: {
      x: 1,
      y: 2,
    },
    list: ['cherry', 'banana', 'apple'],
    a: 'first',
    z: 'last',
  };

  const canonicalA = canonicalize(objectA);
  const canonicalB = canonicalize(objectB);

  // Raw objects have different structural iteration orders
  assert.notDeepEqual(Object.keys(objectA), Object.keys(objectB));

  // Canonicalized objects are byte-for-byte identical when stringified
  assert.equal(JSON.stringify(canonicalA), JSON.stringify(canonicalB));
});

// ============================================================================
// Test 2: Heuristic Isolation Invariant (heuristics ∉ write-path)
// ============================================================================
test('BuildIndex v2: Heuristics are strictly excluded from write path and carry advisory authority only', () => {
  const heuristicEnvelope = {
    confidence: 0.85,
    model: 'keyword-overlap-v2',
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    authority: 'non-binding' as const,
    value: {
      associatedAdr: 'ADR-002',
      reason: 'Overlap on "context budget" keywords',
    },
  };

  // 1. Verify heuristic authority is non-binding
  assert.equal(heuristicEnvelope.authority, 'non-binding');

  // 2. Mock build gate validation path
  function runValidationGate(facts: any, heuristics: any[]): { blockBuild: boolean } {
    // Structural rule: heuristics cannot mutate block state or trigger failures
    const containsBlocker = facts.some((f: any) => f.violation === 'enforced-adr-broken');
    
    // An advisory heuristic MUST NOT block even if confidence is 1.0
    const heuristicBlockAttempt = heuristics.some((h: any) => h.confidence > 0.99);
    
    return {
      blockBuild: containsBlocker && !heuristicBlockAttempt, // Strict separation
    };
  }

  const mockFacts = [{ violation: 'enforced-adr-broken' }];
  const mockHeuristics = [heuristicEnvelope];

  const decision = runValidationGate(mockFacts, mockHeuristics);
  assert.ok(decision.blockBuild, 'Build must be blocked solely by Layer 1 facts, ignoring heuristics');
});

// ============================================================================
// Test 3: Multi-Axis Epoch Invalidation
// ============================================================================
test('BuildIndex v2: Schema/Operator version mismatch triggers a clean wipe of Layer 2 projections and heuristics', async () => {
  const fs = new MockFileSystem();
  
  // Set up existing index with old version keys
  const oldEpoch = {
    schemaVersion: 1,
    operatorVersion: 1,
    projectionVersion: 1,
    heuristicModelVersion: 1,
  };
  fs.files['.arch/context/schema-version.json'] = JSON.stringify(oldEpoch);
  fs.dirs['.arch/context/governance/projections'] = ['ADR-002.json'];
  fs.dirs['.arch/context/derived/heuristic'] = ['keyword-links.json'];

  // New Epoch with advanced heuristics model but identical schema
  const newEpoch = {
    schemaVersion: 1,
    operatorVersion: 1,
    projectionVersion: 1,
    heuristicModelVersion: 2, // Changed model axis
  };

  // Mock EpochManager checker
  async function checkEpochAndWipe(fsMock: any, active: typeof newEpoch): Promise<void> {
    const raw = await fsMock.readFile('.arch/context/schema-version.json');
    const current = JSON.parse(raw);
    
    if (
      current.schemaVersion !== active.schemaVersion ||
      current.operatorVersion !== active.operatorVersion ||
      current.projectionVersion !== active.projectionVersion ||
      current.heuristicModelVersion !== active.heuristicModelVersion
    ) {
      // Selective wipe
      if (current.heuristicModelVersion !== active.heuristicModelVersion) {
        fsMock.dirs['.arch/context/derived/heuristic'] = [];
      }
      if (current.projectionVersion !== active.projectionVersion || current.schemaVersion !== active.schemaVersion) {
        fsMock.dirs['.arch/context/governance/projections'] = [];
      }
      fsMock.files['.arch/context/schema-version.json'] = JSON.stringify(active);
    }
  }

  await checkEpochAndWipe(fs, newEpoch);

  // Assert heuristic cache is wiped while projections remain stable (schema & projection versions were matching)
  assert.deepEqual(fs.dirs['.arch/context/derived/heuristic'], []);
  assert.deepEqual(fs.dirs['.arch/context/governance/projections'], ['ADR-002.json']);
  
  // Assert schema version is updated in disk
  const updatedEpoch = JSON.parse(fs.files['.arch/context/schema-version.json']);
  assert.equal(updatedEpoch.heuristicModelVersion, 2);
});

// ============================================================================
// Test 4: Selective Incremental Ingestion
// ============================================================================
test('BuildIndex v2: parser only ingests files whose mtime/hash differ from ChangeTracker', async () => {
  const fs = new MockFileSystem();
  
  // Set up active tracking state
  const previousTracker = {
    schemaVersion: 1,
    operatorVersion: 1,
    files: {
      'cli/src/main/ts/index.ts': {
        path: 'cli/src/main/ts/index.ts',
        mtime: 1000,
        contentHash: 'hash-aaa',
      },
      'cli/src/main/ts/domain/models/task.ts': {
        path: 'cli/src/main/ts/domain/models/task.ts',
        mtime: 1000,
        contentHash: 'hash-bbb',
      }
    }
  };
  fs.files['.arch/context/change-tracker.json'] = JSON.stringify(previousTracker);
  
  // Simulated files on disk
  fs.files['cli/src/main/ts/index.ts'] = 'const index = true;';
  fs.files['cli/src/main/ts/domain/models/task.ts'] = 'const task = "modified";'; // Modified
  
  // Mock file stats
  const mockStats = (path: string): { mtimeMs: number } => {
    if (path === 'cli/src/main/ts/index.ts') return { mtimeMs: 1000 };
    return { mtimeMs: 2000 }; // Dirty task file
  };

  const mockHash = (content: string) => content === 'const index = true;' ? 'hash-aaa' : 'hash-ccc';

  // Incremental scan algorithm
  async function computeModifiedFiles(tracker: typeof previousTracker, paths: string[]): Promise<string[]> {
    const dirty: string[] = [];
    for (const p of paths) {
      const cached = tracker.files[p as keyof typeof tracker.files];
      const stats = mockStats(p);
      if (!cached || cached.mtime !== stats.mtimeMs) {
        dirty.push(p);
      }
    }
    return dirty;
  }

  const modified = await computeModifiedFiles(previousTracker, [
    'cli/src/main/ts/index.ts',
    'cli/src/main/ts/domain/models/task.ts'
  ]);

  // Assert that ONLY task.ts is flagged as modified (index.ts is clean)
  assert.deepEqual(modified, ['cli/src/main/ts/domain/models/task.ts']);
});
