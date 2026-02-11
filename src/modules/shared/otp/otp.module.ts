import { Module } from '@nestjs/common';
import { MailerModule } from './mailer/mailer.module';
import { TwilioService } from './twilio/twilio.service';
import { OtpService } from './otp.service';
import { OtpTokensRepository } from './otp-tokens.repository';
import { CleanupTokensTask } from './tasks/cleanup-tokens.task';
import { OtpProcessor } from './otp.processor';

@Module({
  imports: [MailerModule],
  providers: [
    TwilioService,
    OtpService,
    OtpTokensRepository,
    OtpProcessor,
    CleanupTokensTask,
  ],
  exports: [OtpService],
})
export class OtpModule {}
