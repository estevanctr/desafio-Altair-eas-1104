import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import type { CronRunRecord, ICronRunRepository } from './contracts/cron-run-repository';

@Injectable()
export class CronRunRepository implements ICronRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recordRun(input: CronRunRecord): Promise<void> {
    await this.prisma.cronRun.create({
      data: {
        jobName: input.jobName,
        referenceDate: input.referenceDate,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        durationMs: input.durationMs,
        status: input.status,
        fetched: input.fetched,
        created: input.created,
        skipped: input.skipped,
        failed: input.failed,
        errorMessage: input.errorMessage ?? null,
        organs: {
          create: input.organs.map((organ) => ({
            label: organ.label,
            courtAcronym: organ.courtAcronym,
            organId: organ.organId,
            fetched: organ.fetched,
            created: organ.created,
            skipped: organ.skipped,
            failed: organ.failed,
            errorMessage: organ.errorMessage ?? null,
          })),
        },
      },
    });
  }
}
