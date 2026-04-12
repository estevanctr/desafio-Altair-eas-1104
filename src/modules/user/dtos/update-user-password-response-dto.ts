export interface UpdateUserPasswordResponseDto {
  id: string;
  updatedAt: Date;
}

export const UpdateUserPasswordResponseDto = {
  toResponseDto(data: {
    id: string;
    updatedAt: Date;
  }): UpdateUserPasswordResponseDto {
    return {
      id: data.id,
      updatedAt: data.updatedAt,
    };
  },
};
