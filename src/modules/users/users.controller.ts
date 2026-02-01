import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { VerifyUserDto } from './dto/verify-user.dto';
import { CurrentUser } from '@app/decorators/current-user.decorator';
import type { accounts } from '@app/generated/prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyUser(
    @CurrentUser() user: accounts,
    @Body() verifyUserDto: VerifyUserDto,
  ) {
    return this.usersService.verifyAccount(user.id, verifyUserDto.code);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@CurrentUser() user: accounts) {
    return this.usersService.resendVerificationCode(user.id);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: accounts) {
    return this.usersService.findById(user.id);
  }
}
