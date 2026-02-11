import { MailerService as MailerServiceOrg } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: MailerServiceOrg) {}

  async sendOtp(email: string, otp: string, userName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        // from: '"Support Team" <support@example.com>', // override default from
        subject: 'Welcome to YeuPet App! OTP Email',
        template: './otp',
        context: {
          userName,
          otp,
        },
      });
      return otp;
    } catch {
      throw new Error('Failed to send OTP via EMAIl');
    }
  }
}
