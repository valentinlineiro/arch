import { test } from 'node:test';
import assert from 'node:assert';
import type { ChatRequest, ChatResponse, UsageMetadata, LLMProvider } from '../../main/ts/domain/services/llm-provider.js';
import { BridgeProvider, BridgeConfig } from '../../main/ts/domain/services/bridge-provider.js';

test('ChatRequest has model and messages fields', () => {
  const req: ChatRequest = {
    model: 'claude-3-5-sonnet-20240620',
    messages: [{ role: 'user', content: 'hello' }],
  };
  assert.equal(req.model, 'claude-3-5-sonnet-20240620');
  assert.equal(req.messages.length, 1);
});

test('UsageMetadata latencyMs is required', () => {
  const usage: UsageMetadata = { latencyMs: 120 };
  assert.equal(usage.latencyMs, 120);
});

test('ChatResponse has content and usage', () => {
  const res: ChatResponse = {
    content: 'done',
    usage: { latencyMs: 100, turns: 3, cost: '$0.02' },
  };
  assert.equal(res.content, 'done');
  assert.equal(res.usage.turns, 3);
});

test('BridgeProvider.buildCommand - substitutes {prompt} with cat of temp file', () => {
  const config: BridgeConfig = {
    name: 'claude-code',
    type: 'bridge',
    bin: 'claude',
    template: 'claude -p "{prompt}" --dangerously-skip-permissions',
  };
  const provider = new BridgeProvider(config);
  const cmd = provider.buildCommand('hello world', 'claude-3-5-sonnet-20240620', '/tmp/test.md');
  assert.ok(cmd.includes('$(cat /tmp/test.md)'), `cmd: ${cmd}`);
  assert.ok(cmd.includes('--dangerously-skip-permissions'), `cmd: ${cmd}`);
});

test('BridgeProvider.buildCommand - injects model via {model} placeholder', () => {
  const config: BridgeConfig = {
    name: 'ollama-bridge',
    type: 'bridge',
    bin: 'ollama',
    template: 'ollama run {model} "{prompt}"',
  };
  const provider = new BridgeProvider(config);
  const cmd = provider.buildCommand('hello', 'llama3.2', '/tmp/test.md');
  assert.ok(cmd.includes('llama3.2'), `cmd: ${cmd}`);
  assert.ok(!cmd.includes('{model}'), `cmd: ${cmd}`);
});

test('BridgeProvider.buildCommand - appends --model for claude when no {model} placeholder', () => {
  const config: BridgeConfig = {
    name: 'claude',
    type: 'bridge',
    bin: 'claude',
    template: 'claude -p "{prompt}"',
  };
  const provider = new BridgeProvider(config);
  const cmd = provider.buildCommand('hello', 'claude-3-5-sonnet-20240620', '/tmp/test.md');
  assert.ok(cmd.includes('--model claude-3-5-sonnet-20240620'), `cmd: ${cmd}`);
});

test('BridgeProvider.parseMetadata - extracts turns and cost from stdout', () => {
  const config: BridgeConfig = { name: 'claude-code', type: 'bridge', bin: 'claude', template: '' };
  const provider = new BridgeProvider(config);
  const stdout = 'Some output\nTurns: 5\nCost: $0.03\n';
  const meta = provider.parseMetadata(stdout, 100);
  assert.equal(meta.turns, 5);
  assert.equal(meta.cost, '$0.03');
  assert.equal(meta.latencyMs, 100);
});

test('BridgeProvider.parseMetadata - handles missing turns/cost gracefully', () => {
  const config: BridgeConfig = { name: 'gemini', type: 'bridge', bin: 'gemini', template: '' };
  const provider = new BridgeProvider(config);
  const meta = provider.parseMetadata('no metadata here', 50);
  assert.equal(meta.turns, undefined);
  assert.equal(meta.cost, undefined);
  assert.equal(meta.latencyMs, 50);
});
