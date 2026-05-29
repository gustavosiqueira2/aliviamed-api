import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtUser } from 'src/modules/auth/strategies/jwt-user.interface';

type AuthenticatedRequest = Request & {
  user: JwtUser;
};

export const CurrentUser = createParamDecorator(
  <K extends keyof JwtUser>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): JwtUser[K] | JwtUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    return data ? user[data] : user;
  },
);
