import type { CommunicationType } from './communication-type';

export type ProcessType = {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  hasFinalJudgment: boolean;
  createdAt: Date;
  updatedAt: Date;
  communications?: CommunicationType[];
};
