import { Module } from '@nestjs/common';
import { HashDriver } from './hash-driver';

@Module({
  providers: [{ provide: 'IHashDriver', useClass: HashDriver }],
  exports: ['IHashDriver'],
})
export class HashModule {}
