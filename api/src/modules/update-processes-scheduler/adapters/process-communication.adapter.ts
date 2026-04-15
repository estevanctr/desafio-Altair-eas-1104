import { Logger } from '@nestjs/common';
import { CommunicationSource } from '../../../../generated/prisma/client';
import { ProcessApiItem } from '../types/process-api-item.type';
import { ProcessSyncInput } from '../types/process-sync-input.type';

export class ProcessCommunicationAdapter {
  private static readonly logger = new Logger(ProcessCommunicationAdapter.name);

  static toSyncInput(item: ProcessApiItem): ProcessSyncInput {
    const content = item.texto ?? '';
    const hasFinalJudgment = content.toLowerCase().includes('transitou em julgado');

    return {
      process: {
        processNumber: item.numero_processo,
        courtAcronym: item.siglaTribunal,
        organName: item.nomeOrgao,
        hasFinalJudgment,
      },
      communication: {
        externalId: item.id,
        publicationDate: new Date(item.data_disponibilizacao),
        communicationType: item.tipoComunicacao,
        content,
        source: ProcessCommunicationAdapter.normalizeSource(item.meio, item.id),
      },
      recipients: [
        ...(item.destinatarios ?? []).map((d) => ({
          name: d.nome,
          role: d.polo ?? null,
          oabNumber: null,
          oabState: null,
          isLawyer: false,
        })),
        ...(item.destinatarioadvogados ?? []).map((da) => ({
          name: da.advogado.nome,
          role: null,
          oabNumber: da.advogado.numero_oab ?? null,
          oabState: da.advogado.uf_oab ?? null,
          isLawyer: true,
        })),
      ],
    };
  }

  private static normalizeSource(meio: string | null | undefined, externalId: number): CommunicationSource | null {
    if (meio == null) return null;

    const normalized = meio.trim().toUpperCase();
    if (normalized === 'D') return CommunicationSource.DIARIO;
    if (normalized === 'E') return CommunicationSource.EDITAL;

    ProcessCommunicationAdapter.logger.warn(
      `[process-communication-adapter] unknown meio="${meio}" for externalId=${externalId}; storing as null`,
    );
    return null;
  }
}
