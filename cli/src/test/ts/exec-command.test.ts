import { test } from 'node:test';
import assert from 'node:assert';
import { ExecCommand } from '../../main/ts/application/commands/exec-command.js';
import { ProviderRegistry } from '../../main/ts/domain/services/provider-registry.js';

const BASE_CONFIG = {
  version: '0.6.0',
  routing: {
    '1-code-reasoning': 'claude-code',
    '2-code-generation': 'claude-code',
    '6-writing': 'claude',
    '7-operations': 'ollama',
  },
  governance: {
    modelTiers: {
      XS: 'qwen2.5-coder:7b',
      S: 'qwen3:8b',
      M: 'claude-3-5-sonnet-20240620',
    },
  },
  clis: [
    { name: 'claude-code', bin: 'claude', template: 'claude -p "{prompt}" --dangerously-skip-permissions' },
    { name: 'claude',      bin: 'claude', template: 'claude -p "{prompt}" --dangerously-skip-permissions' },
    { name: 'ollama',      bin: 'curl',   template: 'jq -Rs \'{model: "{model}", prompt: .}\' {prompt_file} | curl -s http://127.0.0.1:11434/api/generate -d @-' },
  ],
};

const allAvailable = () => true;
const noneAvailable = () => false;
const onlyOllama = (bin: string) => bin === 'curl';

// ── Routing: preferred CLI first ──────────────────────────────────────────────

test('resolveAgentCommand - uses preferred CLI when available', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '6-writing', 'S', 'docs/agents/DO.md', '', allAvailable
  );
  assert.ok(result !== 'local' && result !== null);
  assert.equal(result.name, 'claude');
});

test('resolveAgentCommand - falls back to next CLI when preferred is unavailable', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '6-writing', 'S', 'docs/agents/DO.md', '',
    bin => bin !== 'claude'
  );
  // claude is unavailable, ollama (curl) is next
  assert.ok(result !== 'local' && result !== null);
  assert.equal(result.name, 'ollama');
});

test('resolveAgentCommand - returns null when no CLI is available', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '2-code-generation', 'M', 'docs/agents/DO.md', '', noneAvailable
  );
  assert.equal(result, null);
});

// ── Local routing ─────────────────────────────────────────────────────────────

test('resolveAgentCommand - returns local for local-routed task class', () => {
  const config = {
    ...BASE_CONFIG,
    routing: { ...BASE_CONFIG.routing, '7-operations': 'local' },
  };
  const result = ExecCommand.resolveAgentCommand(
    config, '7-operations', 'XS', 'docs/agents/DO.md', '', allAvailable
  );
  assert.equal(result, 'local');
});

// ── Model tier injection ───────────────────────────────────────────────────────

test('resolveAgentCommand - appends --model for claude CLI when model tier is set', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '6-writing', 'M', 'docs/agents/DO.md', '', allAvailable
  );
  assert.ok(result !== 'local' && result !== null);
  assert.ok(result.cmd.includes('--model "claude-3-5-sonnet-20240620"'), `cmd was: ${result.cmd}`);
});

test('resolveAgentCommand - replaces {model} placeholder for ollama CLI', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '7-operations', 'XS', 'docs/agents/DO.md', '', onlyOllama
  );
  assert.ok(result !== 'local' && result !== null);
  assert.ok(result.cmd.includes('qwen2.5-coder:7b'), `cmd was: ${result.cmd}`);
  assert.ok(!result.cmd.includes('{model}'), 'placeholder should be replaced');
});

test('resolveAgentCommand - no model injection when task size has no tier', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '6-writing', '', 'docs/agents/DO.md', '', allAvailable
  );
  assert.ok(result !== 'local' && result !== null);
  assert.ok(!result.cmd.includes('--model'), `cmd was: ${result.cmd}`);
});

// ── Prompt file substitution ──────────────────────────────────────────────────

test('resolveAgentCommand - substitutes {prompt} with $(cat <file>)', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '6-writing', '', 'docs/agents/DO.md', '', allAvailable
  );
  assert.ok(result !== 'local' && result !== null);
  assert.ok(result.cmd.includes('$(cat "docs/agents/DO.md")'), `cmd was: ${result.cmd}`);
});

test('resolveAgentCommand - substitutes {prompt_file} for ollama template', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '7-operations', 'S', 'docs/agents/DO.md', '', onlyOllama
  );
  assert.ok(result !== 'local' && result !== null);
  assert.ok(result.cmd.includes('docs/agents/DO.md'), `cmd was: ${result.cmd}`);
  assert.ok(!result.cmd.includes('{prompt_file}'), 'placeholder should be replaced');
});

// ── Extra flags ───────────────────────────────────────────────────────────────

test('resolveAgentCommand - appends extra flags to command', () => {
  const result = ExecCommand.resolveAgentCommand(
    BASE_CONFIG, '6-writing', '', 'docs/agents/DO.md', '--verbose', allAvailable
  );
  assert.ok(result !== 'local' && result !== null);
  assert.ok(result.cmd.endsWith('--verbose'), `cmd was: ${result.cmd}`);
});

// ── Fallback order: preferred first ──────────────────────────────────────────

test('resolveAgentCommand - uses first available CLI when no routing preference', () => {
  const config = { ...BASE_CONFIG, routing: {} };
  const result = ExecCommand.resolveAgentCommand(
    config, '', '', 'docs/agents/DO.md', '', allAvailable
  );
  assert.ok(result !== 'local' && result !== null);
  assert.equal(result.name, 'claude-code');
});

// ── ProviderRegistry integration via ExecCommand config ──────────────────────

const PROVIDER_CONFIG = {
  strategies: {
    '2-code-generation': {
      M: [
        { provider: 'claude-code', model: 'claude-3-5-sonnet-20240620' },
        { provider: 'claude',      model: 'claude-3-5-sonnet-20240620' },
      ]
    },
    default: {
      XS: [{ provider: 'ollama', model: 'qwen2.5-coder:7b' }]
    }
  },
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

test('ProviderRegistry via ExecCommand config - resolves native for ollama via default strategy', () => {
  const registry = new ProviderRegistry(PROVIDER_CONFIG);
  const { provider, name } = registry.resolve('7-operations', 'XS', () => true);
  assert.ok(provider !== null);
  assert.equal(name, 'ollama');
});
