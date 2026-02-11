import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { OtpTokensRepository } from './otp-tokens.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { BULLMQ_QUEUES } from '../bullmq/bullmq.queue';
import { Queue } from 'bullmq';
import { SendOtpJobParams } from '@app/interfaces/otp.interface';
import { OTP_JOBS } from './otp.job';

@Injectable()
export class OtpService {
  constructor(
    private readonly otpTokensRepository: OtpTokensRepository,
    @InjectQueue(BULLMQ_QUEUES.SEND_OTP) private readonly otpQueue: Queue,
  ) {}

  private generateOtp(): string {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  private async addSendOtpJob({ jobName, ...jobData }: SendOtpJobParams) {
    const job = await this.otpQueue.add(jobName, jobData);

    return {
      jobId: job.id,
      message: 'Send OTP queued successfully',
    };
  }

  async sendOtpToMobile(phone: string): Promise<string> {
    const otp = this.generateOtp();

    await this.addSendOtpJob({
      jobName: OTP_JOBS.SEND_OTP_PHONE,
      token: otp,
      phone,
    });

    return otp;
  }

  async sendOtpToEmail(email: string, userName: string): Promise<string> {
    const otp = this.generateOtp();

    await this.addSendOtpJob({
      jobName: OTP_JOBS.SEND_OTP_EMAIL,
      token: otp,
      email,
      userName,
    });

    return otp;
  }

  async findByUserId(userId: string) {
    return this.otpTokensRepository.findByUserId(userId);
  }
  async revokeToken(userId: string, token: string) {
    return this.otpTokensRepository.revokeToken(userId, token);
  }

  async upsertToken(userId: string, token: string) {
    return this.otpTokensRepository.upsertToken(userId, token);
  }

  async deleteExpired() {
    return this.otpTokensRepository.deleteExpired();
  }
}
