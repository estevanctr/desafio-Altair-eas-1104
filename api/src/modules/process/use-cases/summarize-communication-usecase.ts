import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IAIDriver } from '../../../drivers/ai/contracts/ai-driver';
import { SummarizeCommunicationResponseDto } from '../dtos/summarize-communication-response-dto';
import type { IProcessRepository } from '../repository/contracts/process-repository';
import type { CommunicationType } from '../types/communication-type';
import { SUMMARIZE_COMMUNICATION_SYSTEM_PROMPT } from '../utils/summarize-communication-prompt';

@Injectable()
export class SummarizeCommunicationUseCase {
  constructor(
    @Inject('IProcessRepository')
    private readonly processRepository: IProcessRepository,
    @Inject('IAIDriver')
    private readonly aiDriver: IAIDriver,
  ) {}

  async execute(communicationId: string): Promise<SummarizeCommunicationResponseDto> {
    const existing = await this.processRepository.findCommunicationById(communicationId);
    if (!existing) {
      throw new NotFoundException('Communication not found');
    }

    if (existing.aiSummary) {
      return SummarizeCommunicationResponseDto.toResponseDto(existing.id, existing.aiSummary, true);
    }

    const userContent = this.buildUserPrompt(existing);

    const aiSummary = await this.aiDriver.generateCompletion({
      messages: [
        { role: 'system', content: SUMMARIZE_COMMUNICATION_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    const updated = await this.processRepository.updateCommunicationAiSummary(communicationId, aiSummary);

    return SummarizeCommunicationResponseDto.toResponseDto(updated.id, updated.aiSummary ?? aiSummary, false);
  }

  private buildUserPrompt(communication: CommunicationType): string {
    const recipients =
      communication.recipients && communication.recipients.length > 0
        ? communication.recipients
            .map((recipient) => {
              const oab =
                recipient.oabNumber && recipient.oabState ? ` (OAB ${recipient.oabNumber}/${recipient.oabState})` : '';
              const role = recipient.role ? ` — ${recipient.role}` : '';
              return `- ${recipient.name}${role}${oab}`;
            })
            .join('\n')
        : '- (sem destinatários cadastrados)';

    return [
      `Tipo da movimentação: ${communication.communicationType}`,
      `Data de publicação: ${communication.publicationDate.toISOString()}`,
      `Fonte: ${communication.source ?? 'não informada'}`,
      'Destinatários:',
      recipients,
      '',
      'Aqui está a movimentação:',
      communication.content,
    ].join('\n');
  }
}
