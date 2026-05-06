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
