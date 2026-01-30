import { account_verifications } from '@app/generated/prisma/client';

export interface IVerificationRepository {
  findByUserId(userId: string): Promise<account_verifications | null>;
  saveToken(userId: string, token: string): Promise<account_verifications>;
  verifyAccount(userId: string): Promise<account_verifications>;
}
