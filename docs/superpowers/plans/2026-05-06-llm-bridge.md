# Universal LLM Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc `clis` template system in `arch.config.json` with a typed `LLMProvider` interface that unifies CLI wrappers (`BridgeProvider`) and REST endpoints (`NativeProvider`) behind a single `complete()` call, capturing usage metadata (tokens, latency, cost) in a structured way.

**Architecture:** `LLMProvider` is a domain interface with two implementations — `BridgeProvider` spawns a local CLI subprocess and parses its stdout for metadata; `NativeProvider` calls any OpenAI-compatible `/v1/chat/completions` endpoint. A `ProviderRegistry` reads `arch.config.json`'s new `providers` array and hands the correct provider to `ExecCommand` and `LoopEngine`.

**Tech Stack:** TypeScript, Node.js built-in `node:test`, Node.js built-in `fetch` (v18+), `SubprocessRunner` (existing).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `cli/src/main/ts/domain/services/llm-provider.ts` | Types + `LLMProvider` interface |
| Create | `cli/src/main/ts/domain/services/bridge-provider.ts` | CLI subprocess wrapper |
| Create | `cli/src/main/ts/domain/services/native-provider.ts` | OpenAI REST pass-through |
| Create | `cli/src/main/ts/domain/services/provider-registry.ts` | Factory — reads config, returns `LLMProvider` |
| Create | `cli/src/test/ts/llm-provider.test.ts` | Tests for BridgeProvider + NativeProvider + ProviderRegistry |
| Modify | `cli/src/main/ts/application/commands/exec-command.ts` | Use `ProviderRegistry` instead of `resolveAgentCommand` |
| Modify | `cli/src/main/ts/application/use-cases/loop-engine.ts` | Inject `ProviderRegistry`; call provider directly instead of shelling to `arch exec` |
| Modify | `cli/src/test/ts/exec-command.test.ts` | Update to test new provider-based resolution |
| Modify | `arch.config.json` | Add `providers` array; keep `clis` for backward compat |

---

## Task 1: Define LLMProvider interface and types

**Files:**
- Create: `cli/src/main/ts/domain/services/llm-provider.ts`

- [ ] **Step 1: Write the failing test (interface shape)**

```typescript
// cli/src/test/ts/llm-provider.test.ts
import { test } from 'node:test';
import assert from 'node:assert';
import type { ChatRequest, ChatResponse, UsageMetadata, LLMProvider } from '../../main/ts/domain/services/llm-provider.js';

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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd cli && npm test 2>&1 | grep -A3 "llm-provider"
```

Expected: module not found or type errors.

- [ ] **Step 3: Implement the interface**

```typescript
// cli/src/main/ts/domain/services/llm-provider.ts
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
}

export interface UsageMetadata {
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  turns?: number;
  cost?: string;
}

export interface ChatResponse {
  content: string;
  usage: UsageMetadata;
}

export interface LLMProvider {
  complete(request: ChatRequest): Promise<ChatResponse>;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd cli && npm test 2>&1 | grep -E "llm-provider|pass|fail"
```

Expected: all 3 `llm-provider.test.ts` tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/services/llm-provider.ts cli/src/test/ts/llm-provider.test.ts
git commit -m "feat: [TASK-199] add LLMProvider interface and types"
```

---

## Task 2: Implement BridgeProvider

**Files:**
- Create: `cli/src/main/ts/domain/services/bridge-provider.ts`
- Modify: `cli/src/test/ts/llm-provider.test.ts` (add bridge tests)

The `BridgeProvider` wraps a local CLI (claude, gemini, codex, opencode). It builds a shell command from a template, runs it via `SubprocessRunner`, parses stdout for `Turns: N` and `Cost: $X.XX` patterns, and returns the result as a `ChatResponse`.

**Bridge config shape (from `providers` array in arch.config.json):**

```json
{
  "name": "claude-code",
  "type": "bridge",
  "bin": "claude",
  "template": "claude -p \"{prompt}\" --dangerously-skip-permissions"
}
```

Template substitutions:
- `{prompt}` → `$(cat /tmp/arch-prompt-XXXX.md)` (temp file with message content)
- `{model}` → model string (if present in template)

- [ ] **Step 1: Add BridgeProvider tests**

Append to `cli/src/test/ts/llm-provider.test.ts`:

```typescript
import { BridgeProvider, BridgeConfig } from '../../main/ts/domain/services/bridge-provider.js';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd cli && npm test 2>&1 | grep -E "BridgeProvider|fail|Error" | head -10
```

Expected: module not found for `bridge-provider.js`.

- [ ] **Step 3: Implement BridgeProvider**

```typescript
// cli/src/main/ts/domain/services/bridge-provider.ts
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import type { LLMProvider, ChatRequest, ChatResponse, UsageMetadata } from './llm-provider.js';

export interface BridgeConfig {
  name: string;
  type: 'bridge';
  bin: string;
  template: string;
}

export class BridgeProvider implements LLMProvider {
  constructor(private config: BridgeConfig) {}

  buildCommand(content: string, model: string, promptFile: string): string {
    let cmd = this.config.template
      .replace(/\{prompt\}/g, `$(cat ${promptFile})`)
      .replace(/\{prompt_file\}/g, promptFile);

    if (model) {
      if (this.config.template.includes('{model}')) {
        cmd = cmd.replace(/\{model\}/g, model);
      } else if (this.config.name === 'claude' || this.config.name === 'claude-code') {
        cmd += ` --model ${model}`;
      }
    }
    return cmd;
  }

  parseMetadata(stdout: string, latencyMs: number): UsageMetadata {
    const turnMatch = stdout.match(/Turns: (\d+)/);
    const costMatch = stdout.match(/Cost: (\$[\d.]+)/);
    const promptTokenMatch = stdout.match(/Input tokens: (\d+)/);
    const completionTokenMatch = stdout.match(/Output tokens: (\d+)/);

    return {
      latencyMs,
      turns: turnMatch ? parseInt(turnMatch[1], 10) : undefined,
      cost: costMatch ? costMatch[1] : undefined,
      promptTokens: promptTokenMatch ? parseInt(promptTokenMatch[1], 10) : undefined,
      completionTokens: completionTokenMatch ? parseInt(completionTokenMatch[1], 10) : undefined,
    };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const userMessage = request.messages.find(m => m.role === 'user')?.content ?? '';
    const promptFile = join(tmpdir(), `arch-prompt-${randomBytes(4).toString('hex')}.md`);

    try {
      writeFileSync(promptFile, userMessage);
      const cmd = this.buildCommand(userMessage, request.model, promptFile);

      const start = Date.now();
      const result = spawnSync('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
      const latencyMs = Date.now() - start;

      const stdout = result.stdout ?? '';
      const stderr = result.stderr ?? '';
      const content = stdout + (stderr ? `\nSTDERR: ${stderr}` : '');

      return {
        content,
        usage: this.parseMetadata(stdout, latencyMs),
      };
    } finally {
      try { unlinkSync(promptFile); } catch {}
    }
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd cli && npm test 2>&1 | grep -E "BridgeProvider|llm-provider" | head -15
```

Expected: all BridgeProvider tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/services/bridge-provider.ts cli/src/test/ts/llm-provider.test.ts
git commit -m "feat: [TASK-199] implement BridgeProvider for CLI subprocess wrapping"
```

---

## Task 3: Implement NativeProvider

**Files:**
- Create: `cli/src/main/ts/domain/services/native-provider.ts`
- Modify: `cli/src/test/ts/llm-provider.test.ts` (add native tests)

`NativeProvider` calls any OpenAI-compatible `/v1/chat/completions` endpoint (Ollama at `http://127.0.0.1:11434/v1`, OpenRouter at `https://openrouter.ai/api/v1`, etc.) using Node's built-in `fetch`.

**Native config shape:**
```json
{
  "name": "ollama",
  "type": "native",
  "endpoint": "http://127.0.0.1:11434/v1",
  "apiKey": "ollama"
}
```

`apiKeyEnv` (optional) — environment variable name holding the API key. Takes precedence over `apiKey`.

- [ ] **Step 1: Add NativeProvider tests**

Append to `cli/src/test/ts/llm-provider.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd cli && npm test 2>&1 | grep -E "NativeProvider|Error" | head -10
```

Expected: module not found for `native-provider.js`.

- [ ] **Step 3: Implement NativeProvider**

```typescript
// cli/src/main/ts/domain/services/native-provider.ts
import type { LLMProvider, ChatRequest, ChatResponse, UsageMetadata } from './llm-provider.js';

export interface NativeConfig {
  name: string;
  type: 'native';
  endpoint: string;
  apiKey?: string;
  apiKeyEnv?: string;
}

export class NativeProvider implements LLMProvider {
  constructor(private config: NativeConfig) {}

  resolveApiKey(): string {
    if (this.config.apiKeyEnv) {
      const val = process.env[this.config.apiKeyEnv];
      if (val) return val;
    }
    return this.config.apiKey ?? '';
  }

  buildRequestBody(request: ChatRequest): string {
    return JSON.stringify({
      model: request.model,
      messages: request.messages,
    });
  }

  parseResponse(apiResp: any, latencyMs: number): ChatResponse {
    const content = apiResp?.choices?.[0]?.message?.content ?? '';
    const usage = apiResp?.usage ?? {};
    const meta: UsageMetadata = {
      latencyMs,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    };
    return { content, usage: meta };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const url = `${this.config.endpoint.replace(/\/$/, '')}/chat/completions`;
    const apiKey = this.resolveApiKey();

    const start = Date.now();
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: this.buildRequestBody(request),
    });
    const latencyMs = Date.now() - start;

    if (!resp.ok) {
      throw new Error(`NativeProvider ${this.config.name} HTTP ${resp.status}: ${await resp.text()}`);
    }

    const apiResp = await resp.json();
    return this.parseResponse(apiResp, latencyMs);
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd cli && npm test 2>&1 | grep -E "NativeProvider|llm-provider" | head -15
```

Expected: all NativeProvider tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/services/native-provider.ts cli/src/test/ts/llm-provider.test.ts
git commit -m "feat: [TASK-199] implement NativeProvider for OpenAI-compatible REST endpoints"
```

---

## Task 4: Implement ProviderRegistry

**Files:**
- Create: `cli/src/main/ts/domain/services/provider-registry.ts`
- Modify: `cli/src/test/ts/llm-provider.test.ts` (add registry tests)

`ProviderRegistry` reads the `providers` array from config, maps routing names to providers, and creates the right implementation. Falls back to the legacy `clis` array if `providers` is absent (backward compatibility).

- [ ] **Step 1: Add ProviderRegistry tests**

Append to `cli/src/test/ts/llm-provider.test.ts`:

```typescript
import { ProviderRegistry } from '../../main/ts/domain/services/provider-registry.js';

const REGISTRY_CONFIG = {
  routing: {
    '2-code-generation': 'claude-code',
    '4-code-repetitive': 'ollama',
    '5-research': 'gemini',
  },
  governance: {
    modelTiers: { XS: 'qwen2.5-coder:7b', M: 'claude-3-5-sonnet-20240620' },
  },
  providers: [
    { name: 'claude-code', type: 'bridge', bin: 'claude', template: 'claude -p "{prompt}" --dangerously-skip-permissions' },
    { name: 'gemini',      type: 'bridge', bin: 'gemini', template: 'gemini -p "{prompt}" -y' },
    { name: 'ollama',      type: 'native', endpoint: 'http://127.0.0.1:11434/v1', apiKey: 'ollama' },
  ],
};

test('ProviderRegistry.resolve - returns BridgeProvider for bridge type', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  const { provider } = registry.resolve('2-code-generation', 'M', () => true);
  assert.ok(provider !== null);
  assert.equal(provider!.constructor.name, 'BridgeProvider');
});

test('ProviderRegistry.resolve - returns NativeProvider for native type', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  const { provider } = registry.resolve('4-code-repetitive', 'XS', () => true);
  assert.ok(provider !== null);
  assert.equal(provider!.constructor.name, 'NativeProvider');
});

test('ProviderRegistry.resolve - skips unavailable bridge bin, falls back to next', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  // claude-code bin unavailable; next in fallback order is gemini
  const { provider } = registry.resolve('2-code-generation', 'M', bin => bin !== 'claude');
  assert.ok(provider !== null);
  assert.equal(provider!.constructor.name, 'BridgeProvider');
});

test('ProviderRegistry.resolve - returns null when no provider available', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  const { provider } = registry.resolve('2-code-generation', 'M', () => false);
  assert.equal(provider, null);
});

test('ProviderRegistry.resolveModel - returns model tier for given size', () => {
  const registry = new ProviderRegistry(REGISTRY_CONFIG);
  assert.equal(registry.resolveModel('M'), 'claude-3-5-sonnet-20240620');
  assert.equal(registry.resolveModel('XS'), 'qwen2.5-coder:7b');
  assert.equal(registry.resolveModel('L'), '');
});

test('ProviderRegistry.resolve - falls back to clis when providers absent', () => {
  const legacyConfig = {
    routing: { '6-writing': 'claude' },
    governance: { modelTiers: {} },
    clis: [
      { name: 'claude', bin: 'claude', template: 'claude -p "{prompt}"' },
    ],
  };
  const registry = new ProviderRegistry(legacyConfig);
  const { provider } = registry.resolve('6-writing', '', () => true);
  assert.ok(provider !== null);
  assert.equal(provider!.constructor.name, 'BridgeProvider');
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd cli && npm test 2>&1 | grep -E "ProviderRegistry|Error" | head -10
```

Expected: module not found for `provider-registry.js`.

- [ ] **Step 3: Implement ProviderRegistry**

```typescript
// cli/src/main/ts/domain/services/provider-registry.ts
import { BridgeProvider, BridgeConfig } from './bridge-provider.js';
import { NativeProvider, NativeConfig } from './native-provider.js';
import type { LLMProvider } from './llm-provider.js';
import { spawnSync } from 'node:child_process';

export interface ResolveResult {
  provider: LLMProvider | null;
  name: string | null;
  model: string;
}

export class ProviderRegistry {
  constructor(private config: any) {}

  resolveModel(size: string): string {
    return this.config.governance?.modelTiers?.[size] ?? '';
  }

  private isBinAvailable(bin: string): boolean {
    return spawnSync('which', [bin]).status === 0;
  }

  resolve(
    taskClass: string,
    taskSize: string,
    isBinAvailable: (bin: string) => boolean = (bin) => this.isBinAvailable(bin)
  ): ResolveResult {
    const model = this.resolveModel(taskSize);
    const preferredName: string | null = this.config.routing?.[taskClass] ?? null;

    if (preferredName === 'local') {
      return { provider: null, name: 'local', model };
    }

    const providerConfigs: any[] = this.config.providers ?? this.buildLegacyProviders();

    const preferred = providerConfigs.find(p => p.name === preferredName);
    const ordered = preferred
      ? [preferred, ...providerConfigs.filter(p => p.name !== preferredName)]
      : providerConfigs;

    for (const pc of ordered) {
      if (pc.type === 'bridge') {
        if (!isBinAvailable(pc.bin)) continue;
        return { provider: new BridgeProvider(pc as BridgeConfig), name: pc.name, model };
      }
      if (pc.type === 'native') {
        return { provider: new NativeProvider(pc as NativeConfig), name: pc.name, model };
      }
    }

    return { provider: null, name: null, model };
  }

  private buildLegacyProviders(): any[] {
    return (this.config.clis ?? []).map((c: any) => ({
      ...c,
      type: 'bridge',
    }));
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd cli && npm test 2>&1 | grep -E "ProviderRegistry|llm-provider" | head -20
```

Expected: all ProviderRegistry tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/services/provider-registry.ts cli/src/test/ts/llm-provider.test.ts
git commit -m "feat: [TASK-199] implement ProviderRegistry — routes task class to LLMProvider"
```

---

## Task 5: Update arch.config.json with providers registry

**Files:**
- Modify: `arch.config.json`

Add a `providers` array that replaces the `clis` array. Keep `clis` in place for backward compatibility (the registry uses it as a fallback). The `providers` array has typed `type` fields (`"bridge"` or `"native"`).

- [ ] **Step 1: Update arch.config.json**

In `arch.config.json`, add a `providers` array after the `clis` array:

```json
"providers": [
  {
    "name": "claude-code",
    "type": "bridge",
    "bin": "claude",
    "template": "claude -p \"{prompt}\" --dangerously-skip-permissions"
  },
  {
    "name": "gemini",
    "type": "bridge",
    "bin": "gemini",
    "template": "gemini -p \"{prompt}\" -y"
  },
  {
    "name": "codex",
    "type": "bridge",
    "bin": "codex",
    "template": "codex \"{prompt}\""
  },
  {
    "name": "opencode",
    "type": "bridge",
    "bin": "opencode",
    "template": "opencode \"{prompt}\""
  },
  {
    "name": "claude",
    "type": "bridge",
    "bin": "claude",
    "template": "claude -p \"{prompt}\" --dangerously-skip-permissions"
  },
  {
    "name": "ollama",
    "type": "native",
    "endpoint": "http://127.0.0.1:11434/v1",
    "apiKey": "ollama"
  },
  {
    "name": "openrouter",
    "type": "native",
    "endpoint": "https://openrouter.ai/api/v1",
    "apiKeyEnv": "OPENROUTER_API_KEY"
  }
]
```

Place it after the existing `clis` block, before the closing `}`.

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('arch.config.json', 'utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add arch.config.json
git commit -m "chore: [TASK-199] add providers registry to arch.config.json"
```

---

## Task 6: Update ExecCommand to use ProviderRegistry

**Files:**
- Modify: `cli/src/main/ts/application/commands/exec-command.ts`
- Modify: `cli/src/test/ts/exec-command.test.ts`

Replace `resolveAgentCommand` + `spawnSync('sh', ['-c', cmd])` with `ProviderRegistry.resolve()` + `provider.complete()`. Keep `resolveAgentCommand` as a deprecated static for the existing tests (or update the tests).

The key behavioral change: instead of building a shell string and passing it to `sh -c`, `ExecCommand` now asks the registry for a provider and calls `provider.complete()` with the DO.md content as the user message.

- [ ] **Step 1: Update exec-command.test.ts to cover new provider-based path**

Replace the existing test file content with the following (the old `resolveAgentCommand` tests become legacy and can be kept or replaced — here we keep the static method tests since backward compat matters, and add new provider tests):

At the end of `cli/src/test/ts/exec-command.test.ts`, add:

```typescript
import { ProviderRegistry } from '../../main/ts/domain/services/provider-registry.js';

const PROVIDER_CONFIG = {
  routing: { '2-code-generation': 'claude-code', '6-writing': 'claude', '7-operations': 'ollama' },
  governance: { modelTiers: { XS: 'qwen2.5-coder:7b', M: 'claude-3-5-sonnet-20240620' } },
  providers: [
    { name: 'claude-code', type: 'bridge', bin: 'claude', template: 'claude -p "{prompt}"' },
    { name: 'claude',      type: 'bridge', bin: 'claude', template: 'claude -p "{prompt}"' },
    { name: 'ollama',      type: 'native', endpoint: 'http://127.0.0.1:11434/v1', apiKey: 'ollama' },
  ],
};

test('ProviderRegistry via ExecCommand config - resolves claude-code for code-generation', () => {
  const registry = new ProviderRegistry(PROVIDER_CONFIG);
  const { provider, name } = registry.resolve('2-code-generation', 'M', () => true);
  assert.ok(provider !== null);
  assert.equal(name, 'claude-code');
});

test('ProviderRegistry via ExecCommand config - resolves native for ollama routing', () => {
  const registry = new ProviderRegistry(PROVIDER_CONFIG);
  const { provider, name } = registry.resolve('7-operations', 'XS', () => false);
  assert.ok(provider !== null);
  assert.equal(name, 'ollama');
});
```

- [ ] **Step 2: Run to confirm new tests pass before modifying ExecCommand**

```bash
cd cli && npm test 2>&1 | grep -E "ProviderRegistry via ExecCommand|pass|fail" | head -10
```

Expected: both new tests pass.

- [ ] **Step 3: Update ExecCommand**

Replace `cli/src/main/ts/application/commands/exec-command.ts` with:

```typescript
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus } from '../../domain/models/task.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { BatchSystem } from '../use-cases/batch-system.js';
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { BridgeProvider } from '../../domain/services/bridge-provider.js';

const DO_PROMPT_FILE = 'docs/agents/DO.md';

export class ExecCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  /**
   * Resolves which CLI and command string to use for agent invocation.
   * @deprecated Use ProviderRegistry.resolve() instead. Kept for unit-test backward compatibility.
   */
  static resolveAgentCommand(
    config: any,
    taskClass: string,
    taskSize: string,
    promptFile: string,
    extraFlags: string,
    isBinAvailable: (bin: string) => boolean
  ): { name: string; cmd: string } | 'local' | null {
    const registry = new ProviderRegistry(config);
    const { provider, name, model } = registry.resolve(taskClass, taskSize, isBinAvailable);

    if (name === 'local') return 'local';
    if (!provider || !name) return null;

    if (provider instanceof BridgeProvider) {
      const cmd = provider.buildCommand('', model, promptFile) + (extraFlags ? ` ${extraFlags}` : '');
      return { name, cmd };
    }

    return null;
  }

  async execute(args: string[]): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);

    const activeTasks = await this.taskRepository.getActive();
    const focusedTask = activeTasks.find(t => t.focus && t.status !== TaskStatus.DONE);

    const taskClass = focusedTask?.class ?? '';
    const taskSize = focusedTask?.size ?? '';
    const taskId = focusedTask?.id ?? '';

    if (
      config.governance?.batchWritingTasks === true &&
      taskClass === '6-writing' &&
      taskSize === 'XS' &&
      taskId
    ) {
      console.log(`  \x1b[33mBATCH\x1b[0m — queuing ${taskId} for Anthropic Batch API`);
      const batchSystem = new BatchSystem(this.fileSystem);
      await batchSystem.add(taskId, DO_PROMPT_FILE);
      return;
    }

    console.log('  \x1b[32mARCH\x1b[0m — invoking EXEC (DO) mode');

    const registry = new ProviderRegistry(config);
    const { provider, name, model } = registry.resolve(
      taskClass,
      taskSize,
      bin => spawnSync('which', [bin]).status === 0
    );

    if (name === 'local') {
      console.log('  Routing: local (no AI invocation)');
      console.log('');
      process.stdout.write(fs.readFileSync(DO_PROMPT_FILE, 'utf8'));
      process.exit(0);
    }

    if (!provider) {
      console.log('  Note: No AI provider detected. Showing protocol:');
      console.log(fs.readFileSync(DO_PROMPT_FILE, 'utf8'));
      process.exit(1);
    }

    console.log(`  Provider: ${name} | Model: ${model || 'default'}`);

    const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
    const extraFlags = args.join(' ');

    if (provider instanceof BridgeProvider) {
      // Bridge providers run the CLI directly (stdio inherit for interactive output)
      const cmd = provider.buildCommand(promptContent, model, DO_PROMPT_FILE) +
        (extraFlags ? ` ${extraFlags}` : '');
      const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
      process.exit(result.status ?? 0);
    }

    // NativeProvider: call REST endpoint
    try {
      const response = await provider.complete({
        model,
        messages: [{ role: 'user', content: promptContent }],
      });
      console.log(response.content);
      if (response.usage.turns) console.log(`Turns: ${response.usage.turns}`);
      if (response.usage.cost) console.log(`Cost: ${response.usage.cost}`);
      if (response.usage.latencyMs) console.log(`Latency: ${response.usage.latencyMs}ms`);
    } catch (err: any) {
      console.error(`Provider error: ${err.message}`);
      process.exit(1);
    }
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
cd cli && npm test 2>&1 | tail -20
```

Expected: all tests pass (the existing `resolveAgentCommand` tests still pass via the backward-compat shim).

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/commands/exec-command.ts cli/src/test/ts/exec-command.test.ts
git commit -m "feat: [TASK-199] update ExecCommand to use ProviderRegistry"
```

---

## Task 7: Update LoopEngine to use ProviderRegistry

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/loop-engine.ts`

LoopEngine currently shells out to `arch.sh exec` as a subprocess. Update it to inject a `ProviderRegistry` and call the provider directly, eliminating the subprocess hop. Usage metadata (turns, cost) comes from `ChatResponse.usage` instead of stdout regex parsing.

- [ ] **Step 1: Update LoopEngine constructor and imports**

In `cli/src/main/ts/application/use-cases/loop-engine.ts`, add the import:

```typescript
import { ProviderRegistry } from '../../domain/services/provider-registry.js';
import { BridgeProvider } from '../../domain/services/bridge-provider.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
```

And add `providerRegistry?: ProviderRegistry` as an optional constructor parameter:

```typescript
constructor(
  private taskRepository: TaskRepository,
  private gitRepository: GitRepository,
  private fileSystem: FileSystem,
  private reviewer: Reviewer,
  private driftChecker?: DriftChecker,
  private providerRegistry?: ProviderRegistry
) {
```

- [ ] **Step 2: Replace the EXEC phase in LoopEngine.execute()**

Replace this block in `execute()`:

```typescript
// 3. EXEC — delegate to arch exec (arch.sh invokes the AI CLI with DO.md)
this.log(`[LOOP] Phase: EXEC (${task.id})`);

const { code: execCode, stdout, stderr } = await SubprocessRunner.runWithOutput(ARCH_SH, ['exec'], {
  stream: true,
  timeoutMs: EXEC_TIMEOUT_MS
});

if (execCode !== 0) {
  const reason = execCode === 124 ? `EXEC timeout exceeded (${timeoutMinutes}m)` : `arch exec exited with code ${execCode}`;
  await this.appendInbox(task.id, 'ANDON_HALT', reason);
  console.error(`[LOOP] Exec failed for ${task.id}. ${reason}. INBOX updated. Halting.`);
  process.exit(1);
}

// Capture summary from stdout (e.g., "Turns: 5", "Cost: $0.05")
const turnMatch = stdout.match(/Turns: (\d+)/);
const costMatch = stdout.match(/Cost: (\$\d+\.\d+)/);
if (turnMatch || costMatch) {
  const summary = [
    turnMatch ? `${turnMatch[1]} turns` : '',
    costMatch ? `cost ${costMatch[1]}` : ''
  ].filter(Boolean).join(', ');
  this.log(`[LOOP] Agent activity: ${summary}`);
}
```

With:

```typescript
// 3. EXEC — use provider directly if registry available, else fall back to arch.sh subprocess
this.log(`[LOOP] Phase: EXEC (${task.id})`);

if (this.providerRegistry) {
  const { provider, name, model } = this.providerRegistry.resolve(
    task.class ?? '',
    task.size ?? '',
    bin => spawnSync('which', [bin]).status === 0
  );

  if (!provider || name === 'local') {
    const reason = 'No provider resolved for task — halting';
    await this.appendInbox(task.id, 'ANDON_HALT', reason);
    console.error(`[LOOP] ${reason}`);
    process.exit(1);
  }

  this.log(`[LOOP] Provider: ${name} | Model: ${model || 'default'}`);

  let turns: number | undefined;
  let cost: string | undefined;

  if (provider instanceof BridgeProvider) {
    // Bridge: run CLI with inherited stdio (interactive), then parse metadata from a separate capture
    const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
    const cmd = provider.buildCommand(promptContent, model, DO_PROMPT_FILE);
    const start = Date.now();
    const result = spawnSync('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', timeout: EXEC_TIMEOUT_MS });
    if (result.status !== 0) {
      const reason = result.signal === 'SIGTERM' ? `EXEC timeout exceeded (${timeoutMinutes}m)` : `provider exited with code ${result.status}`;
      await this.appendInbox(task.id, 'ANDON_HALT', reason);
      console.error(`[LOOP] Exec failed for ${task.id}. ${reason}. INBOX updated. Halting.`);
      process.exit(1);
    }
    const meta = provider.parseMetadata(result.stdout ?? '', Date.now() - start);
    turns = meta.turns;
    cost = meta.cost;
  } else {
    // NativeProvider: async completion
    try {
      const promptContent = fs.readFileSync(DO_PROMPT_FILE, 'utf8');
      const response = await provider.complete({
        model,
        messages: [{ role: 'user', content: promptContent }],
      });
      console.log(response.content);
      turns = response.usage.turns;
      cost = response.usage.cost;
    } catch (err: any) {
      await this.appendInbox(task.id, 'ANDON_HALT', `Provider error: ${err.message}`);
      console.error(`[LOOP] Provider error for ${task.id}: ${err.message}. Halting.`);
      process.exit(1);
    }
  }

  if (turns || cost) {
    const summary = [turns ? `${turns} turns` : '', cost ? `cost ${cost}` : ''].filter(Boolean).join(', ');
    this.log(`[LOOP] Agent activity: ${summary}`);
  }
} else {
  // Legacy path: shell out to arch.sh exec
  const { code: execCode, stdout } = await SubprocessRunner.runWithOutput(ARCH_SH, ['exec'], {
    stream: true,
    timeoutMs: EXEC_TIMEOUT_MS,
  });

  if (execCode !== 0) {
    const reason = execCode === 124 ? `EXEC timeout exceeded (${timeoutMinutes}m)` : `arch exec exited with code ${execCode}`;
    await this.appendInbox(task.id, 'ANDON_HALT', reason);
    console.error(`[LOOP] Exec failed for ${task.id}. ${reason}. INBOX updated. Halting.`);
    process.exit(1);
  }

  const turnMatch = stdout.match(/Turns: (\d+)/);
  const costMatch = stdout.match(/Cost: (\$\d+\.\d+)/);
  if (turnMatch || costMatch) {
    const summary = [turnMatch ? `${turnMatch[1]} turns` : '', costMatch ? `cost ${costMatch[1]}` : ''].filter(Boolean).join(', ');
    this.log(`[LOOP] Agent activity: ${summary}`);
  }
}
```

- [ ] **Step 3: Remove the now-unused `ARCH_SH` constant if the legacy path is the only remaining user**

The `ARCH_SH` constant and `SubprocessRunner` import should remain since they're used in the legacy path.

- [ ] **Step 4: Build to check for type errors**

```bash
cd cli && npx tsup src/main/ts/index.ts --format esm --clean 2>&1 | tail -20
```

Expected: build completes with no type errors.

- [ ] **Step 5: Run all tests**

```bash
cd cli && npm test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/application/use-cases/loop-engine.ts
git commit -m "feat: [TASK-199] update LoopEngine to use ProviderRegistry directly"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run arch review**

```bash
arch review
```

Expected: all checks pass (zero violations).

- [ ] **Step 2: Run npm test**

```bash
cd cli && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Verify arch.config.json is valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('arch.config.json', 'utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 4: Commit task completion marker**

```bash
git add .
git commit -m "chore: [TASK-199] verify all ACs — LLM bridge implementation complete"
```

---

## Spec Coverage Self-Review

| AC | Task |
|----|------|
| LLMProvider interface in `domain/services/llm-provider.ts` | Task 1 |
| BridgeProvider wraps Claude, Gemini, Codex, Opencode | Task 2 |
| Usage metadata capture (tokens, latency) in bridge parsers | Task 2 (`parseMetadata`) |
| NativeProvider for Ollama and direct provider keys | Task 3 |
| `arch.config.json` updated with `providers` registry | Task 5 |
| ExecCommand uses unified provider interface | Task 6 |
| LoopEngine uses unified provider interface | Task 7 |
| OpenRouter and legacy `clis` subsumed into provider registry | Task 5 + `buildLegacyProviders()` fallback in Task 4 |
| `arch review` passes | Task 8 |
| `npm test` passes | Task 8 |
