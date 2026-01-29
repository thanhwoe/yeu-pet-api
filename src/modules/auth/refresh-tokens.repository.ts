import { PrismaService } from '@app/database/prisma/prisma.service';
import { IRefreshTokensRepository } from '@app/interfaces/refresh-tokens-repository.interface';
import { Injectable } from '@nestjs/common';
import { refresh_tokens } from '@app/generated/prisma/client';

@Injectable()
export class RefreshTokensRepository implements IRefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Pick<refresh_tokens, 'account_id' | 'expires_at' | 'token_hash'>,
  ) {
    return this.prisma.refresh_tokens.create({
      data,
    });
  }

  async delete(account_id: string) {
    await this.prisma.refresh_tokens.deleteMany({
      where: { account_id },
    });
  }

  async findByUserId(account_id: string) {
    return this.prisma.refresh_tokens.findUnique({
      where: { account_id },
    });
  }

  async revokeByUserId(account_id: string) {
    await this.prisma.refresh_tokens.updateMany({
      where: {
        account_id,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }

  async revokeByTokenHash(token_hash: string): Promise<void> {
    await this.prisma.refresh_tokens.updateMany({
      where: {
        token_hash,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }

  async deleteExpired() {
    const result = await this.prisma.refresh_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async findByTokenHash(account_id: string, token_hash: string) {
    return this.prisma.refresh_tokens.findUnique({
      where: { account_id, token_hash },
    });
  }

  async deleteByUserId(account_id: string) {
    await this.prisma.refresh_tokens.deleteMany({
      where: { account_id },
    });
  }
}
