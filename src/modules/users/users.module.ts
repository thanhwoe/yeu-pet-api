import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { VerificationRepository } from './verification.repository';
import { OtpService } from '../otp/otp.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    VerificationRepository,
    OtpService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
