import type { UserType } from '../../types/user-type';

type PrismaUserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
};

export class UserMapper {
  static toDomain(record: PrismaUserRecord): UserType {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      createdAt: record.createdAt,
    };
  }
}
