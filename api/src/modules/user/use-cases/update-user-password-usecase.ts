import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { IHashDriver } from '../../../drivers/hash/contracts/hash-driver';
import { UpdateUserPasswordResponseDto } from '../dtos/update-user-password-response-dto';
import type { IUserRepository } from '../repository/contracts/user-repository';
import type { UpdateUserPasswordRequest } from '../types/update-user-password-request-type';

@Injectable()
export class UpdateUserPasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashDriver')
    private readonly hashDriver: IHashDriver,
  ) {}

  async execute(data: UpdateUserPasswordRequest): Promise<UpdateUserPasswordResponseDto> {
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await this.hashDriver.compare(data.currentPassword, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is invalid');
    }

    const hashedPassword = await this.hashDriver.hash(data.newPassword);
    const updated = await this.userRepository.updatePassword(user.id, hashedPassword);

    return UpdateUserPasswordResponseDto.toResponseDto({
      id: updated.id,
      updatedAt: new Date(),
    });
  }
}
