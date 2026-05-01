import { test } from 'node:test';
import assert from 'node:assert';
import { SandboxService } from '../../main/ts/domain/services/sandbox.js';
import os from 'node:os';

test('SandboxService - executeJs isolation', async (t) => {
  const sandbox = new SandboxService();
  
  await t.test('should prevent access to global process', () => {
    try {
      sandbox.executeJs('process.exit(1)');
      assert.fail('Should have thrown ReferenceError');
    } catch (e: any) {
      assert.strictEqual(e.error.name, 'ReferenceError');
      assert.match(e.error.message, /process is not defined/);
    }
  });

  await t.test('should execute valid math', () => {
    const { result } = sandbox.executeJs('1 + 1');
    assert.strictEqual(result, 2);
  });
});

test('SandboxService - executeJs timeout', async (t) => {
  const sandbox = new SandboxService();
  
  await t.test('should timeout infinite loop', () => {
    try {
      sandbox.executeJs('while(true) {}', { timeout: 100 });
      assert.fail('Should have timed out');
    } catch (e: any) {
      assert.match(e.error.message, /Script execution timed out/);
    }
  });
});

test('SandboxService - executeCommand allowlist', async (t) => {
  const sandbox = new SandboxService();

  await t.test('should allow node --version', () => {
    const result = sandbox.executeCommand('node', ['--version']);
    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /^v\d+/);
  });

  await t.test('should deny rm -rf /', () => {
    assert.throws(() => {
      sandbox.executeCommand('rm', ['-rf', '/']);
    }, /not in the sandbox allowlist/);
  });

  await t.test('should deny git push', () => {
    assert.throws(() => {
      sandbox.executeCommand('git', ['push']);
    }, /Subcommand 'git push' is not allowed/);
  });

  await t.test('should allow git status', () => {
    const result = sandbox.executeCommand('git', ['status'], { privileged: true }); // Using privileged because /tmp is not a git repo usually
    // result might fail with status 128 if not in a repo, but the point is it shouldn't throw an allowlist error
    assert.ok(result.duration >= 0);
  });
});

test('SandboxService - benchmarking', async (t) => {
  const sandbox = new SandboxService();

  await t.test('benchmarking overhead', () => {
    const code = 'let x = 0; for(let i=0; i<1000; i++) x += i; x;';
    
    // VM Execution
    const vmStart = performance.now();
    const { duration: vmDuration } = sandbox.executeJs(code);
    const vmTotal = performance.now() - vmStart;

    // Native Execution (approximate)
    const nativeStart = performance.now();
    eval(code);
    const nativeDuration = performance.now() - nativeStart;

    console.log(`\n  Benchmarking Results:`);
    console.log(`  - VM Internal Duration: ${vmDuration.toFixed(4)}ms`);
    console.log(`  - VM Total Overhead: ${vmTotal.toFixed(4)}ms`);
    console.log(`  - Native eval Duration: ${nativeDuration.toFixed(4)}ms`);
    
    assert.ok(vmTotal > nativeDuration, 'VM should have some overhead');
  });
});
