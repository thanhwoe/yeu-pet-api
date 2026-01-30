import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IJwtPayload } from '@app/types/jwt';
import { IS_PUBLIC_KEY } from '@app/decorators/public.decorator';
import { REQUIRED_ROLE_KEY } from '@app/decorators/admin.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if the route has a required role
    const requiredRole = this.reflector.getAllAndOverride<string>(
      REQUIRED_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    let user: IJwtPayload;
    try {
      const payload = await this.jwtService.verifyAsync<IJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      user = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const result = await super.canActivate(context);

    if (result instanceof Promise) {
      return result;
    }

    if (typeof result === 'object' && 'subscribe' in result) {
      return await firstValueFrom(result);
    }

    return result;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
