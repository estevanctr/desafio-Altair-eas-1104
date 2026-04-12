import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Env } from '../../env';
import { IHashDriver } from './contracts/hash-driver';

@Injectable()
export class HashDriver implements IHashDriver {
  private readonly saltRounds: number;

  constructor(configService: ConfigService<Env, true>) {
    this.saltRounds = configService.get('HASH_SALT_ROUNDS', { infer: true });
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
