import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IProcessCommunicationsGateway } from '../gateways/contracts/process-communications-gateway';
import type { IProcessSyncRepository } from '../repository/contracts/process-sync-repository';
import type { ProcessSyncInput } from '../types/process-sync-input.type';
import {
  SCHEDULED_ORGAN_QUERIES,
  ScheduledOrganQuery,
} from '../types/scheduled-organ-query.type';

export type UpdateProcessesSummary = {
  referenceDate: string;
  totalFetched: number;
  totalCreated: number;
  totalSkipped: number;
  totalFailed: number;
  perOrgan: Array<{
    label: string;
    siglaTribunal: string;
    orgaoId: number;
    fetched: number;
    created: number;
    skipped: number;
    failed: number;
    error?: string;
  }>;
};

@Injectable()
export class UpdateProcessesUseCase {
  private readonly logger = new Logger(UpdateProcessesUseCase.name);

  constructor(
    @Inject('IProcessCommunicationsGateway')
    private readonly processCommunicationsGateway: IProcessCommunicationsGateway,
    @Inject('IProcessSyncRepository')
    private readonly processSyncRepository: IProcessSyncRepository,
  ) {}

  async execute(): Promise<UpdateProcessesSummary> {
    const referenceDate = this.getYesterdayIsoDate();

    const summary: UpdateProcessesSummary = {
      referenceDate,
      totalFetched: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalFailed: 0,
      perOrgan: [],
    };

    for (const query of SCHEDULED_ORGAN_QUERIES) {
      const organSummary = await this.processOrgan(query, referenceDate);
      summary.perOrgan.push(organSummary);
      summary.totalFetched += organSummary.fetched;
      summary.totalCreated += organSummary.created;
      summary.totalSkipped += organSummary.skipped;
      summary.totalFailed += organSummary.failed;
    }

    this.logger.log(
      `[update-processes] date=${referenceDate} fetched=${summary.totalFetched} created=${summary.totalCreated} skipped=${summary.totalSkipped} failed=${summary.totalFailed}`,
    );

    return summary;
  }

  private async processOrgan(
    query: ScheduledOrganQuery,
    referenceDate: string,
  ): Promise<UpdateProcessesSummary['perOrgan'][number]> {
    let fetched = 0;
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let organError: string | undefined;

    try {
      const batches = this.processCommunicationsGateway.streamCommunications({
        siglaTribunal: query.siglaTribunal,
        orgaoId: query.orgaoId,
        dataDisponibilizacaoInicio: referenceDate,
        dataDisponibilizacaoFim: referenceDate,
      });

      for await (const batch of batches) {
        const batchInfos = await this.persistBatch(batch, query);
        fetched += batch.length;
        created += batchInfos.created;
        skipped += batchInfos.skipped;
        failed += batchInfos.failed;
      }
    } catch (error) {
      organError = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[update-processes] failed for ${query.siglaTribunal}/${query.orgaoId}: ${organError}`,
      );
    }

    this.logger.log(
      `[update-processes] ${query.label} (${query.siglaTribunal}/${query.orgaoId}) fetched=${fetched} created=${created} skipped=${skipped} failed=${failed}`,
    );

    return {
      label: query.label,
      siglaTribunal: query.siglaTribunal,
      orgaoId: query.orgaoId,
      fetched,
      created,
      skipped,
      failed,
      ...(organError !== undefined && { error: organError }),
    };
  }

  private async persistBatch(
    batch: ProcessSyncInput[],
    query: ScheduledOrganQuery,
  ): Promise<{ created: number; skipped: number; failed: number }> {
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of batch) {
      try {
        const result =
          await this.processSyncRepository.persistCommunication(item);
        if (result.created) created += 1;
        else skipped += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[update-processes] failed to persist externalId=${item.communication.externalId} for ${query.siglaTribunal}/${query.orgaoId}: ${message}`,
        );
      }
    }

    return { created, skipped, failed };
  }

  private getYesterdayIsoDate(): string {
    const now = new Date();
    const yesterday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
    );
    return yesterday.toISOString().slice(0, 10);
  }
}
