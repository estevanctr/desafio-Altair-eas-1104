import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { HashModule } from '../../drivers/hash/hash.module';
import { CreateUserController } from './controllers/create-user.controller';
import { UpdateUserPasswordController } from './controllers/update-user-password.controller';
import { UserRepository } from './repository/user-repository';
import { CreateUserUseCase } from './use-cases/create-user-usecase';
import { UpdateUserPasswordUseCase } from './use-cases/update-user-password-usecase';

@Module({
  imports: [HashModule],
  controllers: [CreateUserController, UpdateUserPasswordController],
  providers: [
    PrismaService,
    CreateUserUseCase,
    UpdateUserPasswordUseCase,
    { provide: 'IUserRepository', useClass: UserRepository },
  ],
  exports: [CreateUserUseCase, UpdateUserPasswordUseCase, 'IUserRepository'],
})
export class UserModule {}
