import type { UserType } from '../types/user-type';

export interface CreateUserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const CreateUserResponseDto = {
  toResponseDto(user: UserType): CreateUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
};
