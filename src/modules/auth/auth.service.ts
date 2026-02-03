import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { accounts } from '@app/generated/prisma/client';
import { IJwtPayload } from '@app/types/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { RegisterDto } from './dto/register.dto';
import dayjs from 'dayjs';
import crypto from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  // Validate user credentials for local strategy
  async validateUser(identifier: string, password: string) {
    const user = await this.usersService.findByEmailOrPhone(identifier);

    if (!user) {
      return null;
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: accounts) {
    const tokens = await this.generateTokens(user);

    await this.usersService.updateAccount(user.id, {
      last_sign_in_at: new Date(),
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }

  async register(data: RegisterDto) {
    const user = await this.usersService.create(data);

    // Auto login
    return this.login(user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.refreshTokensRepository.revokeByTokenHash(tokenHash);
    } else {
      await this.refreshTokensRepository.revokeByUserId(userId);
    }
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.refreshTokensRepository.findByTokenHash(
      userId,
      tokenHash,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check token revoked
    if (storedToken.revoked_at) {
      //   If a revoked token is still being used, treat it as a stolen token and revoke/delete all user tokens
      await this.refreshTokensRepository.deleteByUserId(userId);

      throw new ForbiddenException(
        'Token has been revoked. Please login again.',
      );
    }

    // Check token expired
    if (storedToken.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify JWT payload
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check existed user
    const user = await this.usersService.findById(userId);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // TOKEN ROTATION
    await this.refreshTokensRepository.revokeByTokenHash(tokenHash);

    const newTokens = await this.generateTokens(user);

    return newTokens;
  }

  private async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async generateTokens(user: accounts) {
    const payload: IJwtPayload = {
      email: user.email,
      phone: user.phone,
      sub: user.id,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<number>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });

    const hashedRefreshToken = this.hashToken(refreshToken);

    const expiresAt = dayjs()
      .add(
        this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN'),
        'ms',
      )
      .toDate();

    await this.refreshTokensRepository.create({
      account_id: user.id,
      token_hash: hashedRefreshToken,
      expires_at: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private hashToken(value: string): string {
    // same input -> same output
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
