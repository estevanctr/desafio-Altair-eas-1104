import { describe, expect, it } from 'vitest';
import { CommunicationSource } from '../../../../../generated/prisma/client';
import { ProcessCommunicationAdapter } from '../../adapters/process-communication.adapter';
import type { ProcessApiItem } from '../../types/process-api-item.type';

function makeApiItem(overrides: Partial<ProcessApiItem> = {}): ProcessApiItem {
  return {
    id: 1001,
    numero_processo: '0000001-00.2026.5.10.0018',
    siglaTribunal: 'TRT10',
    nomeOrgao: '18ª Vara do Trabalho de Brasília',
    data_disponibilizacao: '2026-04-10',
    tipoComunicacao: 'Intimação',
    texto: 'Conteúdo da comunicação processual.',
    meio: 'D',
    destinatarios: [],
    destinatarioadvogados: [],
    ...overrides,
  };
}

describe('ProcessCommunicationAdapter', () => {
  describe('toSyncInput', () => {
    it('maps basic process fields correctly', () => {
      const item = makeApiItem();
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.process).toEqual({
        processNumber: '0000001-00.2026.5.10.0018',
        courtAcronym: 'TRT10',
        organName: '18ª Vara do Trabalho de Brasília',
        hasFinalJudgment: false,
      });
    });

    it('maps communication fields correctly', () => {
      const item = makeApiItem();
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.communication).toEqual({
        externalId: 1001,
        publicationDate: new Date('2026-04-10'),
        communicationType: 'Intimação',
        content: 'Conteúdo da comunicação processual.',
        source: CommunicationSource.DIARIO,
      });
    });

    it('maps meio="E" to CommunicationSource.EDITAL', () => {
      const item = makeApiItem({ meio: 'E' });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.communication.source).toBe(CommunicationSource.EDITAL);
    });

    it('is case-insensitive when normalizing meio', () => {
      const item = makeApiItem({ meio: 'd' });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.communication.source).toBe(CommunicationSource.DIARIO);
    });

    it('returns null when meio is an unknown value', () => {
      const item = makeApiItem({ meio: 'XYZ' });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.communication.source).toBeNull();
    });

    // --- hasFinalJudgment detection ---

    it('sets hasFinalJudgment to true when texto contains "transitou em julgado"', () => {
      const item = makeApiItem({
        texto: 'O processo transitou em julgado em 01/04/2026.',
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.process.hasFinalJudgment).toBe(true);
    });

    it('detects "transitou em julgado" case-insensitively', () => {
      const item = makeApiItem({
        texto: 'TRANSITOU EM JULGADO conforme certidão.',
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.process.hasFinalJudgment).toBe(true);
    });

    it('sets hasFinalJudgment to false when texto does not contain the phrase', () => {
      const item = makeApiItem({
        texto: 'Audiência designada para 15/05/2026.',
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.process.hasFinalJudgment).toBe(false);
    });

    // --- Recipients mapping ---

    it('maps regular recipients with isLawyer=false and null OAB fields', () => {
      const item = makeApiItem({
        destinatarios: [
          { nome: 'João Silva', polo: 'Autor' },
          { nome: 'Maria Santos', polo: 'Réu' },
        ],
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.recipients).toEqual([
        {
          name: 'João Silva',
          role: 'Autor',
          oabNumber: null,
          oabState: null,
          isLawyer: false,
        },
        {
          name: 'Maria Santos',
          role: 'Réu',
          oabNumber: null,
          oabState: null,
          isLawyer: false,
        },
      ]);
    });

    it('maps lawyer recipients with isLawyer=true and OAB information', () => {
      const item = makeApiItem({
        destinatarioadvogados: [
          {
            advogado: {
              nome: 'Dr. Pedro',
              numero_oab: '12345',
              uf_oab: 'DF',
            },
          },
        ],
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.recipients).toEqual([
        {
          name: 'Dr. Pedro',
          role: null,
          oabNumber: '12345',
          oabState: 'DF',
          isLawyer: true,
        },
      ]);
    });

    it('merges regular recipients and lawyers into a single array', () => {
      const item = makeApiItem({
        destinatarios: [{ nome: 'Carlos', polo: 'Autor' }],
        destinatarioadvogados: [
          {
            advogado: {
              nome: 'Dra. Ana',
              numero_oab: '67890',
              uf_oab: 'SP',
            },
          },
        ],
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.recipients).toHaveLength(2);
      expect(result.recipients[0].isLawyer).toBe(false);
      expect(result.recipients[0].name).toBe('Carlos');
      expect(result.recipients[1].isLawyer).toBe(true);
      expect(result.recipients[1].name).toBe('Dra. Ana');
    });

    // --- Null / undefined safety for optional fields ---

    it('defaults content to empty string when texto is null', () => {
      const item = makeApiItem({ texto: null as unknown as string });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.communication.content).toBe('');
      expect(result.process.hasFinalJudgment).toBe(false);
    });

    it('sets source to null when meio is null', () => {
      const item = makeApiItem({ meio: null as unknown as string });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.communication.source).toBeNull();
    });

    it('produces empty recipients when both arrays are null/undefined', () => {
      const item = makeApiItem({
        destinatarios: null as unknown as [],
        destinatarioadvogados: null as unknown as [],
      });
      const result = ProcessCommunicationAdapter.toSyncInput(item);

      expect(result.recipients).toEqual([]);
    });
  });
});
