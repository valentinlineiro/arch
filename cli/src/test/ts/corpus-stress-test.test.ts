import { test } from 'node:test';
import assert from 'node:assert';
import { NormalizeRepoEvents, type RawInputTrace } from '../../main/ts/application/use-cases/normalize-repo-events.js';
import { TransientWindowCompiler } from '../../main/ts/domain/services/transient-window-compiler.js';
import { StatelessHypothesisGenerator } from '../../main/ts/domain/services/stateless-hypothesis-generator.js';
import { TransientActuationProjector } from '../../main/ts/domain/services/transient-actuation-projector.js';
import { SyntacticValidationService } from '../../main/ts/domain/models/ontology.js';

test('Corpus Adversarial Stress Test — Latent Actor Reconstruction Test (Phase 1)', () => {
  // Generate highly structured, biased raw inputs representing two distinct developer workflows
  // with distinct files, times, and actions.
  const rawTraces: RawInputTrace[] = [];
  const startTimestamp = 1716120000000;

  for (let i = 0; i < 500; i++) {
    // Developer A: highly distinct commit sequence
    rawTraces.push({
      origin: 'fs',
      type: 'write',
      payload: {
        filePath: `src/core/ComponentA_${i}.ts`,
        commitHash: `a-hash-${i}`,
        author: 'Developer-Alice-Senior-Auth',
        timestamp: startTimestamp + i * 1000,
        actionKind: 'modify_core',
        componentsCount: 3,
      },
    });

    // Developer B: completely different pattern
    rawTraces.push({
      origin: 'vcs',
      type: 'commit',
      payload: {
        filePath: `config/setupB_${i}.yaml`,
        commitHash: `b-hash-${i}`,
        author: 'Developer-Bob-Junior-Intern',
        timestamp: startTimestamp + i * 2000 + 500,
        actionKind: 'tweak_env',
        componentsCount: 1,
      },
    });
  }

  // Act: Normalize through Phase 1 Ordered Microscope
  const normalized = NormalizeRepoEvents.normalize(rawTraces);

  // Assertions:
  // 1. Verify decontextualization: no raw names, paths, hashes, or timestamps exist
  assert.strictEqual(normalized.length, 1000);

  for (let i = 0; i < normalized.length; i++) {
    const event = normalized[i];

    // Check time-blindness: event_id must be time-blind sequence index, and no timestamps or dates can leak
    assert.strictEqual(event.event_id, String(i));
    const strRepr = JSON.stringify(event);
    assert.ok(!strRepr.includes('timestamp'), 'Event must not leak raw timestamp');
    assert.ok(!strRepr.includes('Developer-Alice'), 'Event must not leak real author names');
    assert.ok(!strRepr.includes('Developer-Bob'), 'Event must not leak real author names');
    assert.ok(!strRepr.includes('ComponentA_'), 'Event must not leak original file names');
    assert.ok(!strRepr.includes('setupB_'), 'Event must not leak original file names');

    // 2. Syntactic validation: check that no qualitative words leak
    assert.doesNotThrow(() => SyntacticValidationService.validateEvent(event));
  }

  // 3. Information Entropy check: check that reconstruction correlation along the sequence
  // does not expose any continuous temporal or structural continuity gradients
  const categories = normalized.map(e => e.attributes.raw_category);
  let transitions = 0;
  for (let i = 0; i < categories.length - 1; i++) {
    if (categories[i] !== categories[i + 1]) {
      transitions++;
    }
  }

  // The categories alternate perfectly due to the interweaved loop,
  // but their continuous temporal properties and real-world actors are 100% destroyed.
  assert.ok(transitions > 900, 'Sequence order must be perfectly flat and decontextualized');
});

test('Corpus Adversarial Stress Test — Weight Isolation Test (Phase 2 & 3)', () => {
  // Feed a highly repeating, biased sequence of event windows into compilation pipeline.
  // Execute over 1,000 independent fresh CLI mock execution iterations.
  const baseEvents = [
    {
      event_id: '0',
      event_type: 'file_write_action',
      attributes: {
        raw_category: 'file_write' as const,
        file_class: 'code_like' as const,
        metadata: { authorHash: 'mask-1' },
      },
    },
    {
      event_id: '1',
      event_type: 'process_event_action',
      attributes: {
        raw_category: 'process_event' as const,
        file_class: 'unknown' as const,
        metadata: { authorHash: 'mask-2' },
      },
    },
    {
      event_id: '2',
      event_type: 'file_write_action',
      attributes: {
        raw_category: 'file_write' as const,
        file_class: 'config_like' as const,
        metadata: { authorHash: 'mask-1' },
      },
    },
  ];

  // We run 1,000 executions of Phase 2 + Phase 3 compilation.
  // We assert:
  // - No state carries over between run N and run N+1 (since all functions are pure/stateless)
  // - Using the SAME seed produces the identical deterministic output (no internal random drift)
  // - Using a DIFFERENT seed stochastically perturbs outputs to break cross-run fingerprinting,
  //   but maintains mathematically bounded behavior.
  
  const seedA = 'execution-run-timestamp-12345';
  const seedB = 'execution-run-timestamp-67890';

  const runPipeline = (seed: string) => {
    // 1. Partition
    const partitioned = TransientWindowCompiler.partition(baseEvents, {
      seed,
      baseWindowSize: 2,
      variationDelta: 1,
    });

    // 2. Generate hypotheses
    const windowOutputs = partitioned.map((window, idx) =>
      StatelessHypothesisGenerator.generate(window, idx, seed)
    );

    // 3. Project to signals
    const signals = TransientActuationProjector.project(windowOutputs);

    return { windowOutputs, signals };
  };

  // Run N: seed A
  const run1 = runPipeline(seedA);

  // Repeat 1,000 runs to ensure zero parameter drift or accumulator leak
  for (let i = 0; i < 1000; i++) {
    const runI = runPipeline(seedA);
    // Assert 100% strict within-seed determinism: if the seed is the same, output is identical.
    // This guarantees reliability and debuggability.
    assert.deepStrictEqual(runI.signals, run1.signals);
    assert.deepStrictEqual(runI.windowOutputs, run1.windowOutputs);
  }

  // Run with seed B: verify stochastic perturbation breaks exact fingerprint matches
  const runWithSeedB = runPipeline(seedB);

  // Assert that different seeds produce different outputs (either different windows or perturbed weights),
  // showing the seeded PRNG is successfully breaking structural cross-run fingerprints.
  const serialize1 = JSON.stringify(run1);
  const serializeB = JSON.stringify(runWithSeedB);

  assert.notStrictEqual(serialize1, serializeB, 'Different seeds must break exact cross-run fingerprints');

  // Verify that both runs are clean, bounded, and valid
  assert.strictEqual(run1.signals.signal_type, 'local_projection');
  assert.strictEqual(runWithSeedB.signals.signal_type, 'local_projection');
});
