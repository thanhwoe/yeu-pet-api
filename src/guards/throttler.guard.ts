/* eslint-disable @typescript-eslint/require-await */
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { user_role } from '@app/generated/prisma/enums';
import { Request } from 'express';
import { accounts } from '@app/generated/prisma/client';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(
    req: Request & { user: accounts },
  ): Promise<string> {
    // Track by authenticated user ID
    if (req.user?.id) {
      return `user-${req.user.id}`;
    }

    // Track by API key
    const apiKey = req.headers['x-api-key']?.toString();
    if (apiKey) {
      return `apikey-${apiKey}`;
    }

    // Anonymous: track by IP + User-Agent
    const ip = req.ips.length
      ? req.ips[0]
      : req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'];

    return `anon-${ip.toString()}-${userAgent}`;
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: accounts }>();

    // Skip for admin users
    if (request.user?.role === user_role.admin) {
      return true;
    }

    // Skip for internal services
    if (request.headers['x-internal-service'] === 'true') {
      return true;
    }

    return false;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
