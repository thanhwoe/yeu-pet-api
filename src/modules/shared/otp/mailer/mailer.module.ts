import { Module } from '@nestjs/common';
import { MailerModule as MailerModuleOrg } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    MailerModuleOrg.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow<string>('SMTP_HOST'),
          port: config.getOrThrow<number>('SMTP_PORT'),
          secure: false,
          auth: {
            user: config.getOrThrow<string>('SMTP_USER'),
            pass: config.getOrThrow<string>('SMTP_PASS'),
          },
        },

        defaults: {
          from: '"yeu-pet" <noreply@yeupet.com>',
        },
        template: {
          dir: join(
            process.cwd(),
            'dist',
            'modules',
            'shared',
            'otp',
            'mailer',
            'templates',
          ),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
