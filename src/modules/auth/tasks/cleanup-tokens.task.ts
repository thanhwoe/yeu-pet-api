import { Injectable } from '@nestjs/common';
import { RefreshTokensRepository } from '../refresh-tokens.repository';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupTokensTask {
  constructor(private refreshTokensRepository: RefreshTokensRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    await this.refreshTokensRepository.deleteExpired();
  }
}
