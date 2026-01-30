import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { accounts } from '@app/generated/prisma/client';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { VerificationRepository } from './verification.repository';
import { OtpService } from '../otp/otp.service';
import dayjs from 'dayjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly verificationRepository: VerificationRepository,
    private readonly otpService: OtpService,
  ) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) return null;

    return user;
  }

  async findByEmail(email: string): Promise<accounts | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<accounts | null> {
    return this.usersRepository.findByPhone(phone);
  }

  async findByEmailOrPhone(identifier: string): Promise<accounts | null> {
    this.logger.debug(`Finding user by identifier: ${identifier}`);
    return this.usersRepository.findByEmailOrPhone(identifier);
  }

  async create(data: CreateUserDto) {
    // Check duplicate phone
    const phoneExists = await this.usersRepository.existsByPhone(data.phone);
    if (phoneExists) {
      throw new ConflictException('Phone number already exists');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.usersRepository.create({
      password_hash: hashedPassword,
      phone: data.phone,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
    });

    await this.sendVerificationCode(user.id);

    return user;
  }

  async verifyAccount(account_id: string, token: string) {
    const verification =
      await this.verificationRepository.findByUserId(account_id);

    if (!verification || !verification.token) {
      throw new BadRequestException(
        'No verification code found. Please request a new one.',
      );
    }
    if (verification.is_verified) {
      throw new BadRequestException('Account already verified');
    }

    if (dayjs().isAfter(verification.expires_at)) {
      throw new BadRequestException('Verification code has expired');
    }

    if (token !== verification.token) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.verificationRepository.verifyAccount(account_id);

    return { message: 'User verified successfully' };
  }

  async resendVerificationCode(account_id: string) {
    const verification =
      await this.verificationRepository.findByUserId(account_id);

    if (dayjs().isBefore(verification?.expires_at)) {
      const wait = dayjs(verification?.expires_at).diff(dayjs(), 'second');

      throw new BadRequestException(
        `Please wait ${wait} seconds before requesting a new code`,
      );
    }

    // Send new code
    await this.sendVerificationCode(account_id);
  }

  async getProfile(userId: string) {
    return this.usersRepository.profile(userId);
  }

  private async sendVerificationCode(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = await this.otpService.sendOtpToMobile(user.phone);
    await this.verificationRepository.saveToken(userId, otp);
  }

  private async hashPassword(value: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(value, salt);
  }
}
