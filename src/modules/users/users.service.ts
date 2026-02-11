import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { accounts } from '@app/generated/prisma/client';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { UpdatePasswordDto } from './dto/update-password.dto';
import {
  RequestResetPasswordDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileUploadService } from '../shared/file-upload/file-upload.service';
import { FILE_UPLOAD_JOBS } from '../shared/file-upload/file-upload.jobs';
import { OtpService } from '../shared/otp/otp.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly otpService: OtpService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) return null;

    return user;
  }

  async findByEmailOrPhone(identifier: string): Promise<accounts | null> {
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

  async updateAccount(id: string, data: Partial<accounts>) {
    await this.getUser({ id });

    return this.usersRepository.update(id, data);
  }

  async verifyAccount(userId: string, token: string) {
    const user = await this.getUser({ id: userId });

    if (user.is_verified) {
      throw new BadRequestException('Account already verified');
    }

    const otpRecord = await this.otpService.findByUserId(userId);

    if (!otpRecord || !otpRecord.token) {
      throw new BadRequestException(
        'No OTP code found. Please request a new one.',
      );
    }

    if (dayjs().isAfter(otpRecord.expires_at)) {
      throw new BadRequestException('OTP code has expired');
    }

    if (token !== otpRecord.token) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.usersRepository.update(userId, {
      is_verified: true,
    });
    await this.otpService.revokeToken(userId, token);

    return { message: 'User verified successfully' };
  }

  async resendVerificationCode(account_id: string) {
    await this.sendVerificationCode(account_id);

    return { message: 'Verification code resent successfully' };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.getUser({ id: userId });

    const isPasswordValid = await this.validatePassword(
      updatePasswordDto.currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await this.validatePassword(
      updatePasswordDto.newPassword,
      user.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }
    const hashedPassword = await this.hashPassword(
      updatePasswordDto.newPassword,
    );

    return this.usersRepository.update(userId, {
      password_hash: hashedPassword,
    });
  }

  async requestPasswordReset(dto: RequestResetPasswordDto) {
    const user = await this.getUser({ phone: dto.phone });

    await this.sendVerificationCode(user.id);

    return { message: 'Password reset code sent successfully' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.getUser({ phone: dto.phone });

    const otpRecord = await this.otpService.findByUserId(user.id);
    if (!otpRecord || otpRecord.token !== dto.code) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    const hashedPassword = await this.hashPassword(dto.newPassword);

    await this.usersRepository.update(user.id, {
      password_hash: hashedPassword,
    });

    await this.otpService.revokeToken(user.id, dto.code);

    return { message: 'Password reset successfully' };
  }

  async deactivateAccount(userId: string, password: string) {
    const user = await this.getUser({ id: userId });

    if (!user.is_active) {
      throw new BadRequestException('User is already deactivated');
    }

    const isPasswordValid = await this.validatePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.usersRepository.delete(userId);
  }

  async completeOnboarding(id: string) {
    const user = await this.getUser({ id });

    if (user.onboarding_completed) {
      throw new BadRequestException('User is already complete onboarding');
    }

    return this.usersRepository.update(id, {
      onboarding_completed: true,
    });
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ) {
    const user = await this.getUser({ id: userId });

    // Check email existed
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const emailExists = await this.usersRepository.existsByEmail(
        updateProfileDto.email,
      );
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Handle avatar upload
    if (avatarFile) {
      await this.fileUploadService.addUploadJob({
        jobName: FILE_UPLOAD_JOBS.USER_AVATAR,
        file: avatarFile,
        options: {
          userId,
          folder: `users/${userId}`,
          oldFileId: user.avatar_id || undefined,
        },
      });
    }

    // Update user information
    return this.usersRepository.update(userId, {
      first_name: updateProfileDto.firstName,
      last_name: updateProfileDto.lastName,
      email: updateProfileDto.email,
    });
  }

  private async getUser({
    email,
    id,
    phone,
  }: {
    id?: string;
    phone?: string;
    email?: string;
  }) {
    let user: accounts | null = null;

    if (id) {
      user = await this.usersRepository.findAccount(id);
    }

    if (email) {
      user = await this.usersRepository.findByEmail(email);
    }

    if (phone) {
      user = await this.usersRepository.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async sendVerificationCode(userId: string): Promise<void> {
    const user = await this.getUser({ id: userId });

    const otpRecord = await this.otpService.findByUserId(user.id);

    if (otpRecord && dayjs().isBefore(otpRecord.expires_at)) {
      const wait = dayjs(otpRecord.expires_at).diff(dayjs(), 'second');

      throw new BadRequestException(
        `Please wait ${wait} seconds before requesting a new code`,
      );
    }

    // const otp = await this.otpService.sendOtpToEmail(
    //   user.email ?? 'thanhwoe@gmail.com',
    //   user.first_name ?? 'test',
    // );

    const otp = await this.otpService.sendOtpToMobile(user.phone);

    await this.otpService.upsertToken(userId, otp);
  }

  private async hashPassword(value: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(value, salt);
  }

  private async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
