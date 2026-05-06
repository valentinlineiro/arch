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
      .replace(/\{prompt\}/g, `$(cat "${promptFile}")`)
      .replace(/\{prompt_file\}/g, promptFile);

    if (model) {
      if (this.config.template.includes('{model}')) {
        cmd = cmd.replace(/\{model\}/g, model);
      } else if (['claude', 'claude-code', 'gemini'].includes(this.config.name)) {
        cmd += ` --model "${model}"`;
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
    const promptFile = join(tmpdir(), `arch-prompt-${randomBytes(8).toString('hex')}.md`);

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
