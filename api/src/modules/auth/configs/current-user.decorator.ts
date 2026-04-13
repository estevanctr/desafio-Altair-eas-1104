import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TokenSchema } from './jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_: never, context: ExecutionContext): TokenSchema => {
    const request = context.switchToHttp().getRequest<{ user: TokenSchema }>();
    return request.user;
  },
);
