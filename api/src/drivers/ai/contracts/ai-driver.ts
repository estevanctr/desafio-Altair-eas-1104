export interface AICompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AICompletionMessage[];
}

export interface IAIDriver {
  generateCompletion(request: AICompletionRequest): Promise<string>;
}
