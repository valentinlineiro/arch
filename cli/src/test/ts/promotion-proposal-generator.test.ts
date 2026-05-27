import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractIdeaMetadata } from '../../main/ts/domain/services/promotion-proposal-generator.js';

describe('extractIdeaMetadata', () => {
  it('parses explicit Candidate-class and Candidate-size fields', () => {
    const content = `# IDEA: Test
**Created:** 2026-05-27
**Source:** test
**Status:** DRAFT
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S

## Problem
Test problem

## Decision
`;
    const meta = extractIdeaMetadata(content);
    assert.equal(meta.candidateClass, '1-code-reasoning');
    assert.equal(meta.candidateSize, 'S');
    assert.deepEqual(meta.missingFields, []);
  });

  it('returns missing fields when Candidate-class and Candidate-size absent', () => {
    const content = `# IDEA: Test
**Created:** 2026-05-27
**Source:** test
**Status:** DRAFT

## Problem
Test problem
`;
    const meta = extractIdeaMetadata(content);
    assert.equal(meta.candidateClass, null);
    assert.equal(meta.candidateSize, null);
    assert.ok(meta.missingFields.includes('candidate-class'), 'should report missing candidate-class');
    assert.ok(meta.missingFields.includes('candidate-size'), 'should report missing candidate-size');
  });

  it('falls back to legacy ## Estimated size for candidate-size', () => {
    const content = `# IDEA: Test
**Created:** 2026-05-27
**Source:** test
**Status:** DRAFT
**Candidate-class:** 2-code-generation

## Problem
Test

## Estimated size
L
`;
    const meta = extractIdeaMetadata(content);
    assert.equal(meta.candidateSize, 'L');
    assert.deepEqual(meta.missingFields, []);
  });

  it('detects Decision field as set when non-comment content present', () => {
    const withDecision = `# IDEA: Test
## Decision
EXTEND. Not yet.
`;
    const withoutDecision = `# IDEA: Test
## Decision
<!-- REJECT: rationale -->
<!-- PROMOTE → TASK-XXX -->
`;
    assert.equal(extractIdeaMetadata(withDecision).hasDecision, true);
    assert.equal(extractIdeaMetadata(withoutDecision).hasDecision, false);
  });

  it('rejects invalid Candidate-class values', () => {
    const content = `# IDEA: Test
**Candidate-class:** not-a-valid-class
**Candidate-size:** M
`;
    const meta = extractIdeaMetadata(content);
    assert.equal(meta.candidateClass, null);
    assert.ok(meta.missingFields.includes('candidate-class'));
  });

  it('rejects invalid Candidate-size values', () => {
    const content = `# IDEA: Test
**Candidate-class:** 2-code-generation
**Candidate-size:** HUGE
`;
    const meta = extractIdeaMetadata(content);
    assert.equal(meta.candidateSize, null);
    assert.ok(meta.missingFields.includes('candidate-size'));
  });
});

describe('PromotionProposalGenerator.generateAll', () => {
  it('includes missing fields in proposal and skips AC generation', async () => {
    const { PromotionProposalGenerator } = await import('../../main/ts/domain/services/promotion-proposal-generator.js');
    const os = await import('node:os');
    const path = await import('node:path');
    const fs = await import('node:fs');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'IDEA-no-metadata.md'), `# IDEA: Missing fields
**Source:** test
## Problem
A problem without class or size.
`);
      const gen = new PromotionProposalGenerator(tmpDir);
      const proposals = gen.generateAll();
      assert.equal(proposals.length, 1);
      assert.ok(proposals[0].missingFields?.includes('candidate-class'));
      assert.ok(proposals[0].missingFields?.includes('candidate-size'));
      assert.equal(proposals[0].acs.length, 0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('generates ACs when all required fields present', async () => {
    const { PromotionProposalGenerator } = await import('../../main/ts/domain/services/promotion-proposal-generator.js');
    const os = await import('node:os');
    const path = await import('node:path');
    const fs = await import('node:fs');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'IDEA-complete.md'), `# IDEA: Complete idea
**Source:** test
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
## Problem
A complete problem statement.
## Proposed outcome
The outcome is X.
`);
      const gen = new PromotionProposalGenerator(tmpDir);
      const proposals = gen.generateAll();
      assert.equal(proposals.length, 1);
      assert.deepEqual(proposals[0].missingFields, []);
      assert.equal(proposals[0].class, '1-code-reasoning');
      assert.equal(proposals[0].size, 'S');
      assert.ok(proposals[0].acs.length > 0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('skips IDEA files that already have a Decision set', async () => {
    const { PromotionProposalGenerator } = await import('../../main/ts/domain/services/promotion-proposal-generator.js');
    const os = await import('node:os');
    const path = await import('node:path');
    const fs = await import('node:fs');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'IDEA-decided.md'), `# IDEA: Already decided
**Source:** test
**Candidate-class:** 2-code-generation
**Candidate-size:** M
## Problem
A problem.
## Decision
REJECT. Out of scope.
`);
      const gen = new PromotionProposalGenerator(tmpDir);
      const proposals = gen.generateAll();
      assert.equal(proposals.length, 0, 'should skip IDEA with Decision already set');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});
