import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { IHashDriver } from '../../../drivers/hash/contracts/hash-driver';
import type { IUserRepository } from '../../user/repository/contracts/user-repository';
import { AuthResponseDto } from '../dtos/auth-response-dto';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthenticateUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashDriver')
    private readonly hashDriver: IHashDriver,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.hashDriver.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return AuthResponseDto.toResponseDto(user, accessToken);
  }
}
