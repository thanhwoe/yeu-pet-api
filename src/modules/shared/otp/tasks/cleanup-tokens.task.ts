import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OtpTokensRepository } from '../otp-tokens.repository';

@Injectable()
export class CleanupTokensTask {
  constructor(private otpTokensRepository: OtpTokensRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    await this.otpTokensRepository.deleteExpired();
  }
}
