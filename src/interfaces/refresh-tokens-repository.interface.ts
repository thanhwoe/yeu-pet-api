import { refresh_tokens } from '@app/generated/prisma/client';

export interface IRefreshTokensRepository {
  revokeByUserId(userId: string): Promise<void>;
  delete(userId: string): Promise<void>;
  create(data: any): Promise<refresh_tokens>;
  revokeByTokenHash(token: string): Promise<void>;
  deleteExpired(): Promise<number>;
  findByTokenHash(
    userId: string,
    tokenHash: string,
  ): Promise<refresh_tokens | null>;
  deleteByUserId(userId: string): Promise<void>;
}
