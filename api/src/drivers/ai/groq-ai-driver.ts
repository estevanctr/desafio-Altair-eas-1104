import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Env } from '../../env';
import { AICompletionRequest, IAIDriver } from './contracts/ai-driver';

@Injectable()
export class GroqAIDriver implements IAIDriver {
  private readonly client: Groq;
  private readonly model: string;

  constructor(configService: ConfigService<Env, true>) {
    const apiKey = configService.get('GROQ_API_KEY', { infer: true });
    this.client = new Groq({ apiKey });
    this.model = configService.get('GROQ_MODEL', { infer: true });
  }

  async generateCompletion(request: AICompletionRequest): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: request.messages,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }
}
