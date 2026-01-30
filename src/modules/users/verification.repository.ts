import { PrismaService } from '@app/database/prisma/prisma.service';
import { account_verifications } from '@app/generated/prisma/client';
import { IVerificationRepository } from '@app/interfaces/verification-repository.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';

@Injectable()
export class VerificationRepository implements IVerificationRepository {
  private readonly otpExpirationMinutes: number;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.otpExpirationMinutes = this.configService.getOrThrow<number>(
      'OTP_EXPIRATION_MINUTES',
    );
  }

  async findByUserId(
    account_id: string,
  ): Promise<account_verifications | null> {
    return this.prisma.account_verifications.findUnique({
      where: { account_id },
    });
  }

  async saveToken(
    account_id: string,
    token: string,
  ): Promise<account_verifications> {
    const expiresAt = dayjs().add(this.otpExpirationMinutes, 'm').toDate();
    return this.prisma.account_verifications.upsert({
      where: { account_id },
      create: {
        account_id,
        token,
        expires_at: expiresAt,
        is_verified: false,
      },
      update: {
        token,
        expires_at: expiresAt,
        is_verified: false,
      },
    });
  }

  async verifyAccount(account_id: string): Promise<account_verifications> {
    return this.prisma.account_verifications.update({
      where: { account_id },
      data: {
        is_verified: true,
        token: null,
        expires_at: null,
      },
    });
  }
}
