import type { UserType } from '../../user/types/user-type';

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const AuthResponseDto = {
  toResponseDto(user: UserType, accessToken: string): AuthResponseDto {
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },
};
