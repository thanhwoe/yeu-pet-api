import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OtpModule } from './modules/otp/otp.module';
import { ThrottlerModule, minutes, seconds } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './guards/throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // anti-spam
          name: 'burst',
          ttl: seconds(1),
          limit: 10,
        },
        {
          // anti-abuse
          name: 'sustained',
          ttl: minutes(1),
          limit: 100,
        },
      ],
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
