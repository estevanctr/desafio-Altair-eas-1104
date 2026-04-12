import { ProcessApiItem } from '../types/process-api-item.type';
import { ProcessSyncInput } from '../types/process-sync-input.type';

export class ProcessCommunicationAdapter {
  static toSyncInput(item: ProcessApiItem): ProcessSyncInput {
    const content = item.texto ?? '';
    const hasFinalJudgment = content
      .toLowerCase()
      .includes('transitou em julgado');

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
        source: item.meio ?? null,
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
}
