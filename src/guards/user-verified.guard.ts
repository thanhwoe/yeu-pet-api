import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '@app/modules/users/users.service';
import { accounts } from '@app/generated/prisma/client';

@Injectable()
export class UserVerifiedGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: accounts }>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.usersService.getProfile(userId);

    if (!user?.is_verified) {
      throw new ForbiddenException(
        'Account not verified. Please verify your phone number.',
      );
    }

    return true;
  }
}
