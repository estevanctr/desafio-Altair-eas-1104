import type { ProcessType } from '../../types/process-type';

type PrismaProcessRecord = {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  hasFinalJudgment: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class ProcessMapper {
  static toDomain(record: PrismaProcessRecord): ProcessType {
    return {
      id: record.id,
      processNumber: record.processNumber,
      courtAcronym: record.courtAcronym,
      organName: record.organName,
      hasFinalJudgment: record.hasFinalJudgment,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
