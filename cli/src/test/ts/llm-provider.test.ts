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
  assert.ok(cmd.includes('$(cat "/tmp/test.md")'), `cmd: ${cmd}`);
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
  assert.ok(cmd.includes('--model "claude-3-5-sonnet-20240620"'), `cmd: ${cmd}`);
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

import { NativeProvider, NativeConfig } from '../../main/ts/domain/services/native-provider.js';

test('NativeProvider.buildRequestBody - formats messages correctly', () => {
  const config: NativeConfig = {
    name: 'ollama',
    type: 'native',
    endpoint: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
  };
  const provider = new NativeProvider(config);
  const body = provider.buildRequestBody({
    model: 'llama3.2',
    messages: [{ role: 'user', content: 'hello' }],
  });
  const parsed = JSON.parse(body);
  assert.equal(parsed.model, 'llama3.2');
  assert.equal(parsed.messages[0].role, 'user');
  assert.equal(parsed.messages[0].content, 'hello');
});

test('NativeProvider.resolveApiKey - prefers apiKeyEnv over apiKey', () => {
  process.env['TEST_API_KEY'] = 'env-key';
  const config: NativeConfig = {
    name: 'openrouter',
    type: 'native',
    endpoint: 'https://openrouter.ai/api/v1',
    apiKey: 'fallback',
    apiKeyEnv: 'TEST_API_KEY',
  };
  const provider = new NativeProvider(config);
  assert.equal(provider.resolveApiKey(), 'env-key');
  delete process.env['TEST_API_KEY'];
});

test('NativeProvider.resolveApiKey - falls back to apiKey when env unset', () => {
  const config: NativeConfig = {
    name: 'ollama',
    type: 'native',
    endpoint: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
  };
  const provider = new NativeProvider(config);
  assert.equal(provider.resolveApiKey(), 'ollama');
});

test('NativeProvider.parseResponse - extracts content and usage', () => {
  const config: NativeConfig = { name: 'ollama', type: 'native', endpoint: '', apiKey: '' };
  const provider = new NativeProvider(config);
  const apiResp = {
    choices: [{ message: { role: 'assistant', content: 'hello back' } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };
  const result = provider.parseResponse(apiResp, 200);
  assert.equal(result.content, 'hello back');
  assert.equal(result.usage.promptTokens, 10);
  assert.equal(result.usage.completionTokens, 5);
  assert.equal(result.usage.latencyMs, 200);
});

test('NativeProvider.complete - returns ChatResponse on success', async () => {
  const config: NativeConfig = {
    name: 'ollama',
    type: 'native',
    endpoint: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
  };
  const provider = new NativeProvider(config);

  const mockResponse = {
    choices: [{ message: { role: 'assistant', content: 'test response' } }],
    usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => mockResponse,
    text: async () => JSON.stringify(mockResponse),
  } as any);

  try {
    const result = await provider.complete({
      model: 'llama3.2',
      messages: [{ role: 'user', content: 'hello' }],
    });
    assert.equal(result.content, 'test response');
    assert.equal(result.usage.promptTokens, 5);
    assert.equal(result.usage.completionTokens, 3);
    assert.ok(result.usage.latencyMs >= 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('NativeProvider.complete - throws on network error', async () => {
  const config: NativeConfig = {
    name: 'ollama',
    type: 'native',
    endpoint: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
  };
  const provider = new NativeProvider(config);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };

  try {
    await assert.rejects(
      () => provider.complete({ model: 'llama3.2', messages: [{ role: 'user', content: 'hello' }] }),
      /network error/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import { ProviderRegistry } from '../../main/ts/domain/services/provider-registry.js';

const REGISTRY_CONFIG = {
  strategies: {
    '2-code-generation': {
      M: [
        { provider: 'claude-code', model: 'claude-3-5-sonnet-20240620' },
        { provider: 'gemini', model: 'gemini-1.5-pro' }
      ]
    },
    '4-code-repetitive': {
      default: [
        { provider: 'ollama', model: 'qwen2.5-coder:7b' }
      ]
    },
    default: {
      XS: [
        { provider: 'ollama', model: 'qwen2.5-coder:1.5b' }
      ]
    }
  },
  providers: [
    { name: 'claude-code', type: 'bridge', bin: 'claude', template: 'claude -p "{prompt}" --dangerously-skip-permissions' },
    { name: 'gemini',      type: 'bridge', bin: 'gemini', template: 'gemini -p "{prompt}" -y' },
    { name: 'ollama',      type: 'native', endpoint: 'http://127.0.0.1:11434/v1', apiKey: 'ollama' },
  ],
};

test('ProviderRegistry.resolve - returns provider based on strategy', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  const { provider, name, model } = registry.resolve('2-code-generation', 'M', () => true);
  assert.ok(provider !== null);
  assert.equal(name, 'claude-code');
  assert.equal(model, 'claude-3-5-sonnet-20240620');
});

test('ProviderRegistry.resolveAll - handles class-default size fallback', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  const candidates = registry.resolveAll('4-code-repetitive', 'XS', () => true);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].name, 'ollama');
  assert.equal(candidates[0].model, 'qwen2.5-coder:7b');
});

test('ProviderRegistry.resolveAll - handles global default-class fallback', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  // '5-research' is not defined, should use default.XS
  const candidates = registry.resolveAll('5-research', 'XS', () => true);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].name, 'ollama');
  assert.equal(candidates[0].model, 'qwen2.5-coder:1.5b');
});

test('ProviderRegistry.resolveAll - returns empty for unmapped context', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  const candidates = registry.resolveAll('5-research', 'L', () => true);
  assert.equal(candidates.length, 0);
});

test('ProviderRegistry.resolve - skips unavailable bridge bin in strategy chain', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  // claude-code bin unavailable; next in strategy is gemini
  const { provider, name } = registry.resolve('2-code-generation', 'M', bin => bin !== 'claude');
  assert.ok(provider !== null);
  assert.equal(name, 'gemini');
});

test('ProviderRegistry.resolve - supports local strategy', () => {
  const localConfig = {
    strategies: {
      default: { default: [{ provider: 'local', model: 'none' }] }
    }
  };
  const registry = new ProviderRegistry(localConfig);
  const { name, provider } = registry.resolve('any', 'any');
  assert.equal(name, 'local');
  assert.equal(provider, null);
});

test('ProviderRegistry.resolveAll - backward compatibility for legacy config', () => {
  const legacyConfig = {
    routing: { '2-code-generation': 'claude-code' },
    governance: { modelTiers: { M: 'legacy-model' } },
    providers: REGISTRY_CONFIG.providers
  };
  const registry = new ProviderRegistry(legacyConfig);
  const candidates = registry.resolveAll('2-code-generation', 'M', () => true);
  assert.equal(candidates[0].name, 'claude-code');
  assert.equal(candidates[0].model, 'legacy-model');
});

test('ProviderRegistry.resolveModelLegacy - returns model tier for given size and provider', () => {
  const registry = new ProviderRegistry({
     governance: {
       modelTiers: { XS: { ollama: 'qwen' } }
     },
     providers: [{ name: 'ollama', type: 'native', endpoint: '...' }]
  });
  const candidates = registry.resolveAll('any', 'XS', () => true);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].model, 'qwen');
});

test('ProviderRegistry.resolve - falls back to clis when providers absent', () => {
  const legacyConfig = {
    strategies: { default: { default: [{ provider: 'claude', model: 'sonnet' }] } },
    clis: [
      { name: 'claude', bin: 'claude', template: 'claude -p "{prompt}"' },
    ],
  };
  const registry = new ProviderRegistry(legacyConfig);
  const { provider } = registry.resolve('any', 'any', () => true);
  assert.ok(provider !== null);
  assert.equal(provider!.constructor.name, 'BridgeProvider');
});
