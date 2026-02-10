import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { accounts } from '@app/generated/prisma/client';
import { RefreshTokenDto } from './dto/refresh-tokens.dto';
import { LogoutDto } from './dto/logout.dto';
import { Public } from '@app/decorators/public.decorator';
import { CurrentUser } from '@app/decorators/current-user.decorator';
import { AdminOnly } from '@app/decorators/admin.decorator';
import { LocalAuthGuard } from '@app/guards/local-auth.guard';
import { seconds, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Throttle({ burst: { limit: 3, ttl: seconds(1) } })
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: accounts }) {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: accounts, @Body() logoutDto: LogoutDto) {
    await this.authService.logout(user.id, logoutDto.refreshToken);

    return { message: 'Logged out successfully' };
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @CurrentUser() user: accounts,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(
      user.id,
      refreshTokenDto.refreshToken,
    );
  }

  @Get('health')
  @AdminOnly()
  healthCheck() {
    return { status: 'ok' };
  }
}
