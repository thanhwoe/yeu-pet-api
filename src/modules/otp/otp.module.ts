import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpTokensRepository } from './otp-tokens.repository';
import { CleanupTokensTask } from './tasks/cleanup-tokens.task';

@Module({
  providers: [OtpService, OtpTokensRepository, CleanupTokensTask],
  exports: [OtpService, OtpTokensRepository],
})
export class OtpModule {}
