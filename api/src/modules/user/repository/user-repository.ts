import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import type { UserType } from '../types/user-type';
import type { CreateUserData, IUserRepository } from './contracts/user-repository';
import { UserMapper } from './mappers/user-mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<UserType> {
    const created = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });
    return UserMapper.toDomain(created);
  }

  async findById(id: string): Promise<UserType | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<UserType | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<UserType> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return UserMapper.toDomain(updated);
  }
}
