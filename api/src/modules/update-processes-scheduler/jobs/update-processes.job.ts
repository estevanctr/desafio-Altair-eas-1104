import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CronRunStatus } from "../../../../generated/prisma/client";
import type {
  CronRunRecord,
  ICronRunRepository,
} from "../cron-logs/contracts/cron-run-repository";
import type { UpdateProcessesSummary } from "../use-cases/update-processes-usecase";
import { UpdateProcessesUseCase } from "../use-cases/update-processes-usecase";

const JOB_NAME = "update-processes-daily";

@Injectable()
export class UpdateProcessesJob {
  private readonly logger = new Logger(UpdateProcessesJob.name);

  constructor(
    private readonly updateProcessesUseCase: UpdateProcessesUseCase,
    @Inject("ICronRunRepository")
    private readonly cronRunRepository: ICronRunRepository,
  ) {}

  @Cron("0 1 * * *", { name: JOB_NAME })
  async handleCron(): Promise<void> {
    const startedAt = new Date();
    this.logger.log("[update-processes] cron started");

    let summary: UpdateProcessesSummary | null = null;
    let executionError: Error | null = null;

    try {
      summary = await this.updateProcessesUseCase.execute();
    } catch (error) {
      executionError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[update-processes] cron failed: ${executionError.message}`,
      );
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    if (summary) {
      this.logger.log(
        `[update-processes] cron finished in ${durationMs}ms — fetched=${summary.totalFetched} created=${summary.totalCreated} skipped=${summary.totalSkipped} failed=${summary.totalFailed}`,
      );
    }

    await this.persistRunLog(
      startedAt,
      finishedAt,
      durationMs,
      summary,
      executionError,
    );
  }

  private async persistRunLog(
    startedAt: Date,
    finishedAt: Date,
    durationMs: number,
    summary: UpdateProcessesSummary | null,
    executionError: Error | null,
  ): Promise<void> {
    try {
      const record: CronRunRecord = summary
        ? {
            jobName: JOB_NAME,
            referenceDate: summary.referenceDate,
            startedAt,
            finishedAt,
            durationMs,
            status: this.resolveStatus(summary),
            fetched: summary.totalFetched,
            created: summary.totalCreated,
            skipped: summary.totalSkipped,
            failed: summary.totalFailed,
            errorMessage: null,
            organs: summary.perOrgan.map((organ) => ({
              label: organ.label,
              courtAcronym: organ.siglaTribunal,
              organId: organ.orgaoId,
              fetched: organ.fetched,
              created: organ.created,
              skipped: organ.skipped,
              failed: organ.failed,
              errorMessage: organ.error ?? null,
            })),
          }
        : {
            jobName: JOB_NAME,
            referenceDate: new Date(startedAt.getTime() - 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
            startedAt,
            finishedAt,
            durationMs,
            status: CronRunStatus.FAILED,
            fetched: 0,
            created: 0,
            skipped: 0,
            failed: 0,
            errorMessage: executionError?.message ?? "unknown error",
            organs: [],
          };

      await this.cronRunRepository.recordRun(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[update-processes] failed to persist cron run log: ${message}`,
      );
    }
  }

  private resolveStatus(summary: UpdateProcessesSummary): CronRunStatus {
    const anyOrganError = summary.perOrgan.some(
      (organ) => organ.error !== undefined,
    );
    if (anyOrganError || summary.totalFailed > 0) {
      return CronRunStatus.PARTIAL_FAILURE;
    }
    return CronRunStatus.SUCCESS;
  }
}
