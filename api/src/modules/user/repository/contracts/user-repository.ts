import type { UserType } from '../../types/user-type';

export type CreateUserData = {
  name: string;
  email: string;
  password: string;
};

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserType>;
  findById(id: string): Promise<UserType | null>;
  findByEmail(email: string): Promise<UserType | null>;
  updatePassword(id: string, hashedPassword: string): Promise<UserType>;
}
