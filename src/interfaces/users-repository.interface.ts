import { accounts } from '@app/generated/prisma/client';
import { IBaseRepository } from './repository.interface';

export interface IUsersRepository extends IBaseRepository<
  Omit<accounts, 'password_hash'>
> {
  findByEmail(email: string): Promise<accounts | null>;
  findByPhone(phone: string): Promise<accounts | null>;
  findByEmailOrPhone(identifier: string): Promise<accounts | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  updatePassword(id: string, hashedPassword: string): Promise<accounts>;
  verifyAccount(id: string): Promise<accounts>;
  findAccount(id: string): Promise<accounts | null>;
}
