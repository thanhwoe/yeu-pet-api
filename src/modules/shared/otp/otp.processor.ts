import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BULLMQ_QUEUES } from '../bullmq/bullmq.queue';
import { OTP_JOBS } from './otp.job';
import { MailerService } from './mailer/mailer.service';
import { TwilioService } from './twilio/twilio.service';
import { OtpJobData } from '@app/interfaces/otp.interface';

@Processor(BULLMQ_QUEUES.SEND_OTP, { concurrency: 2 })
export class OtpProcessor extends WorkerHost {
  constructor(
    private readonly mailerService: MailerService,
    private readonly twilioService: TwilioService,
  ) {
    super();
  }

  async process(
    job: Job<OtpJobData, any, keyof typeof OTP_JOBS>,
  ): Promise<any> {
    const { token, email, phone, userName } = job.data;

    // Update progress
    await job.updateProgress(10);

    // Handle specific logic by job name
    switch (job.name) {
      case OTP_JOBS.SEND_OTP_PHONE:
        if (phone) {
          await this.twilioService.sendOtp(phone, token);
        }
        break;
      case OTP_JOBS.SEND_OTP_EMAIL:
        if (email && userName) {
          await this.mailerService.sendOtp(email, token, userName);
        }
        break;
      default:
        break;
    }

    await job.updateProgress(100);

    return {
      success: true,
    };
  }
}
