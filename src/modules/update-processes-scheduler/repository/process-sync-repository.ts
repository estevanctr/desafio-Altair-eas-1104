import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ProcessSyncInput } from '../../../modules/update-processes-scheduler/types/process-sync-input.type';
import {
  IProcessSyncRepository,
  PersistResult,
} from './contracts/process-sync-repository';

@Injectable()
export class ProcessSyncRepository implements IProcessSyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  async persistCommunication(input: ProcessSyncInput): Promise<PersistResult> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.communication.findUnique({
        where: { externalId: input.communication.externalId },
        select: { id: true },
      });

      if (existing) {
        return { created: false };
      }

      const process = await tx.process.upsert({
        where: { processNumber: input.process.processNumber },
        update: {},
        create: {
          processNumber: input.process.processNumber,
          courtAcronym: input.process.courtAcronym,
          organName: input.process.organName,
          hasFinalJudgment: input.process.hasFinalJudgment,
        },
        select: { id: true },
      });

      await tx.communication.create({
        data: {
          externalId: input.communication.externalId,
          publicationDate: input.communication.publicationDate,
          communicationType: input.communication.communicationType,
          content: input.communication.content,
          source: input.communication.source,
          processId: process.id,
          recipients: {
            create: input.recipients.map((recipient) => ({
              name: recipient.name,
              role: recipient.role,
              oabNumber: recipient.oabNumber,
              oabState: recipient.oabState,
              isLawyer: recipient.isLawyer,
            })),
          },
        },
      });

      return { created: true };
    });
  }
}
