/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      log: ['warn', 'error'],
    });
  }

  onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.$connect();
  }

  onModuleDestroy() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.$disconnect();
  }
}
