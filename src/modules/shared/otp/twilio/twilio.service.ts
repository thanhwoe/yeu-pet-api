import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly twilioClient: twilio.Twilio;
  constructor(private readonly configService: ConfigService) {
    this.twilioClient = twilio(
      this.configService.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.configService.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<string> {
    // const expirationTime = this.configService.getOrThrow<number>(
    //   'OTP_EXPIRATION_MINUTES',
    // );
    try {
      // Send OTP via SMS using Twilio
      //   await this.twilioClient.messages.create({
      //     body: `Your YEUPET OTP is ${otp}. This OTP is valid for ${expirationTime} minutes.`,
      //     from: this.configService.getOrThrow<string>('TWILIO_PHONE_NUMBER'),
      //     to: `whatsapp:${phoneNumber}`,
      //   });
      await this.twilioClient.messages.create({
        from: this.configService.getOrThrow<string>('TWILIO_PHONE_NUMBER'),
        contentSid: 'HX229f5a04fd0510ce1b071852155d3e75',
        contentVariables: `{"1":"${otp}"}`,
        to: `whatsapp:${phoneNumber}`,
      });

      return otp;
    } catch {
      throw new Error('Failed to send OTP via SMS');
    }
  }
}
