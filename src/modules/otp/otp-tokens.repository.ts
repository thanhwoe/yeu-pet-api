import { PrismaService } from '@app/database/prisma/prisma.service';
import { otp_tokens } from '@app/generated/prisma/client';
import { IOtpTokensRepository } from '@app/interfaces/otp-tokens-repository.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';

@Injectable()
export class OtpTokensRepository implements IOtpTokensRepository {
  private readonly otpExpirationMinutes: number;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.otpExpirationMinutes = this.configService.getOrThrow<number>(
      'OTP_EXPIRATION_MINUTES',
    );
  }

  async findByUserId(account_id: string) {
    return this.prisma.otp_tokens.findUnique({
      where: { account_id },
    });
  }

  async upsertToken(account_id: string, token: string): Promise<otp_tokens> {
    const expiresAt = dayjs().add(this.otpExpirationMinutes, 'm').toDate();
    return this.prisma.otp_tokens.upsert({
      where: { account_id },
      create: {
        account_id,
        token,
        expires_at: expiresAt,
      },
      update: {
        token,
        expires_at: expiresAt,
      },
    });
  }
  async revokeToken(account_id: string, token: string): Promise<void> {
    await this.prisma.otp_tokens.delete({
      where: {
        account_id,
        token,
      },
    });
  }

  async deleteExpired() {
    const result = await this.prisma.otp_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
