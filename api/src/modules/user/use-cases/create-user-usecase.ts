import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { IHashDriver } from '../../../drivers/hash/contracts/hash-driver';
import { CreateUserResponseDto } from '../dtos/create-user-response-dto';
import type { IUserRepository } from '../repository/contracts/user-repository';
import type { CreateUserRequest } from '../types/create-user-request-type';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashDriver')
    private readonly hashDriver: IHashDriver,
  ) {}

  async execute(data: CreateUserRequest): Promise<CreateUserResponseDto> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('E-mail already in use');
    }

    const hashedPassword = await this.hashDriver.hash(data.password);

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    return CreateUserResponseDto.toResponseDto(user);
  }
}
