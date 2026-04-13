import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './database/prisma/prisma.service';
import { validateEnv } from './env';
import { AuthModule } from './modules/auth/auth.module';
import { ProcessModule } from './modules/process/process.module';
import { UpdateProcessesSchedulerModule } from './modules/update-processes-scheduler/update-processes-scheduler.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    UpdateProcessesSchedulerModule,
    UserModule,
    AuthModule,
    ProcessModule,
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
