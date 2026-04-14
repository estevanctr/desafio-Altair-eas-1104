import { Module } from '@nestjs/common';
import { GroqAIDriver } from './groq-ai-driver';

@Module({
  providers: [{ provide: 'IAIDriver', useClass: GroqAIDriver }],
  exports: ['IAIDriver'],
})
export class AIModule {}
