import { otp_tokens } from '@app/generated/prisma/client';

export interface IOtpTokensRepository {
  findByUserId(userId: string): Promise<otp_tokens | null>;
  upsertToken(userId: string, token: string): Promise<otp_tokens>;
  deleteExpired(): Promise<number>;
  revokeToken(userId: string, token: string): Promise<void>;
}
