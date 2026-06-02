import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AlertFatigueStore } from '../../main/ts/application/use-cases/alert-fatigue-store.js';

class TestFileSystem {
  files: Record<string, string> = {};
  async readFile(path: string): Promise<string> {
    if (path in this.files) return this.files[path];
    throw new Error(`Not found: ${path}`);
  }
  async writeFile(path: string, content: string): Promise<void> { this.files[path] = content; }
  async appendFile(path: string, content: string): Promise<void> {
    this.files[path] = (this.files[path] ?? '') + content;
  }
  async exists(path: string): Promise<boolean> { return path in this.files; }
  async readDirectory(): Promise<string[]> { return []; }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
  async deleteFile(): Promise<void> {}
}

describe('AlertFatigueStore', () => {
  test('first emission returns emit', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'emit');
  });

  test('second emission returns emit', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    await store.recordEmission('SpecDrift');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'emit');
  });

  test('third emission returns escalate', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    await store.recordEmission('SpecDrift');
    await store.recordEmission('SpecDrift');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'escalate');
  });

  test('fourth emission returns skip', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    await store.recordEmission('SpecDrift');
    await store.recordEmission('SpecDrift');
    await store.recordEmission('SpecDrift');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'skip');
  });

  test('fifth emission returns halt', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    for (let i = 0; i < 4; i++) await store.recordEmission('SpecDrift');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'halt');
  });

  test('sixth and subsequent emissions return halt', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    for (let i = 0; i < 5; i++) await store.recordEmission('SpecDrift');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'halt');
  });

  test('different categories track independently', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    await store.recordEmission('SpecDrift');
    await store.recordEmission('SpecDrift');
    const action = await store.recordEmission('AuditGap');
    assert.equal(action, 'emit');
  });

  test('reset clears counter — next emission is emit', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    await store.recordEmission('SpecDrift');
    await store.recordEmission('SpecDrift');
    await store.recordEmission('SpecDrift');
    await store.reset('SpecDrift');
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'emit');
  });

  test('stale record (>24h) resets counter to 1 — returns emit', async () => {
    const fs = new TestFileSystem();
    const store = new AlertFatigueStore(fs as any, '.');
    // Manually plant a stale record
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const staleRecord = JSON.stringify({ category: 'SpecDrift', consecutiveCount: 4, lastTimestamp: staleTime, lastAction: 'skip' });
    fs.files['./.arch/alert-fatigue.jsonl'] = staleRecord + '\n';
    const action = await store.recordEmission('SpecDrift');
    assert.equal(action, 'emit');
  });
});
