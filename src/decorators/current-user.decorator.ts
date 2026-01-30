import { accounts } from '@app/generated/prisma/client';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// JwtStrategy attach user to request through passport validation
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: accounts }>();

    return request.user;
  },
);
