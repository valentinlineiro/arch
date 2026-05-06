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
