import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { OtpModule } from '../otp/otp.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  imports: [OtpModule],
  exports: [UsersService],
})
export class UsersModule {}
