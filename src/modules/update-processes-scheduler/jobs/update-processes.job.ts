import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UpdateProcessesUseCase } from '../use-cases/update-processes-usecase';

@Injectable()
export class UpdateProcessesJob {
  private readonly logger = new Logger(UpdateProcessesJob.name);

  constructor(
    private readonly updateProcessesUseCase: UpdateProcessesUseCase,
  ) {}

  @Cron('0 1 * * *', { name: 'update-processes-daily' })
  async handleCron(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('[update-processes] cron started');

    try {
      const summary = await this.updateProcessesUseCase.execute();
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `[update-processes] cron finished in ${durationMs}ms — fetched=${summary.totalFetched} created=${summary.totalCreated} skipped=${summary.totalSkipped} failed=${summary.totalFailed}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[update-processes] cron failed: ${message}`);
    }
  }
}
