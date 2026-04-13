import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HashModule } from '../../drivers/hash/hash.module';
import type { Env } from '../../env';
import { UserModule } from '../user/user.module';
import { AuthenticateController } from './controllers/authenticate.controller';
import { JwtAuthGuard } from './configs/jwt-auth.guard';
import { JwtStrategy } from './configs/jwt.strategy';
import { TokenService } from './services/token.service';
import { AuthenticateUseCase } from './use-cases/authenticate-usecase';

@Module({
  imports: [
    PassportModule,
    UserModule,
    HashModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory(configService: ConfigService<Env, true>) {
        const privateKey = configService.get('JWT_PRIVATE_KEY', {
          infer: true,
        });
        const publicKey = configService.get('JWT_PUBLIC_KEY', { infer: true });

        return {
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
          signOptions: {
            algorithm: 'RS256',
          },
        };
      },
    }),
  ],
  controllers: [AuthenticateController],
  providers: [JwtStrategy, JwtAuthGuard, TokenService, AuthenticateUseCase],
  exports: [JwtAuthGuard, TokenService],
})
export class AuthModule {}
