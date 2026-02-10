import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { VerifyUserDto } from './dto/verify-user.dto';
import { CurrentUser } from '@app/decorators/current-user.decorator';
import type { accounts } from '@app/generated/prisma/client';
import { UpdatePasswordDto } from './dto/update-password.dto';
import {
  RequestResetPasswordDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { Public } from '@app/decorators/public.decorator';
import { DeleteUserDto } from './dto/delete-user.dto';
import { minutes, Throttle } from '@nestjs/throttler';

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
  @Throttle({ burst: { limit: 3, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  async resendOtp(@CurrentUser() user: accounts) {
    return this.usersService.resendVerificationCode(user.id);
  }

  @Post('password/update')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @CurrentUser() user: accounts,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.id, updatePasswordDto);
  }

  @Post('password/request')
  @Public()
  @Throttle({ burst: { limit: 3, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() requestResetPasswordDto: RequestResetPasswordDto,
  ) {
    return this.usersService.requestPasswordReset(requestResetPasswordDto);
  }

  @Post('password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(
    @CurrentUser() user: accounts,
    @Body() deleteUserDto: DeleteUserDto,
  ) {
    return this.usersService.deactivateAccount(user.id, deleteUserDto.password);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: accounts) {
    return this.usersService.findById(user.id);
  }

  @Post('complete-onboarding')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@CurrentUser() user: accounts) {
    return this.usersService.completeOnboarding(user.id);
  }
}
