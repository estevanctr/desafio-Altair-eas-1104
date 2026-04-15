import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CronRunRepository } from './cron-logs/cron-run-repository';
import { ProcessCommunicationsGateway } from './gateways/process-communications-gateway';
import { UpdateProcessesJob } from './jobs/update-processes.job';
import { ProcessSyncRepository } from './repository/process-sync-repository';
import { UpdateProcessesUseCase } from './use-cases/update-processes-usecase';

@Module({
  providers: [
    PrismaService,
    UpdateProcessesJob,
    UpdateProcessesUseCase,
    {
      provide: 'IProcessCommunicationsGateway',
      useClass: ProcessCommunicationsGateway,
    },
    { provide: 'IProcessSyncRepository', useClass: ProcessSyncRepository },
    { provide: 'ICronRunRepository', useClass: CronRunRepository },
  ],
})
export class UpdateProcessesSchedulerModule {}
