import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHashDriver } from './contracts/hash-driver';

@Injectable()
export class HashDriver implements IHashDriver {
  private readonly SALT_ROUNDS = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
