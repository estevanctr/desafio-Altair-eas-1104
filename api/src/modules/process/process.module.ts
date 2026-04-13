import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ListProcessCommunicationsController } from './controllers/list-process-communications.controller';
import { ListProcessesController } from './controllers/list-processes.controller';
import { ProcessRepository } from './repository/process-repository';
import { ListProcessCommunicationsUseCase } from './use-cases/list-process-communications-usecase';
import { ListProcessesUseCase } from './use-cases/list-processes-usecase';

@Module({
  imports: [AuthModule],
  controllers: [ListProcessesController, ListProcessCommunicationsController],
  providers: [
    PrismaService,
    ListProcessesUseCase,
    ListProcessCommunicationsUseCase,
    { provide: 'IProcessRepository', useClass: ProcessRepository },
  ],
  exports: ['IProcessRepository'],
})
export class ProcessModule {}
