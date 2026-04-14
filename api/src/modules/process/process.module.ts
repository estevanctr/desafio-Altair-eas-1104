import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AIModule } from '../../drivers/ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ListProcessCommunicationsController } from './controllers/list-process-communications.controller';
import { ListProcessesController } from './controllers/list-processes.controller';
import { SummarizeCommunicationController } from './controllers/summarize-communication.controller';
import { ProcessRepository } from './repository/process-repository';
import { ListProcessCommunicationsUseCase } from './use-cases/list-process-communications-usecase';
import { ListProcessesUseCase } from './use-cases/list-processes-usecase';
import { SummarizeCommunicationUseCase } from './use-cases/summarize-communication-usecase';

@Module({
  imports: [AuthModule, AIModule],
  controllers: [
    ListProcessesController,
    ListProcessCommunicationsController,
    SummarizeCommunicationController,
  ],
  providers: [
    PrismaService,
    ListProcessesUseCase,
    ListProcessCommunicationsUseCase,
    SummarizeCommunicationUseCase,
    { provide: 'IProcessRepository', useClass: ProcessRepository },
  ],
  exports: ['IProcessRepository'],
})
export class ProcessModule {}
