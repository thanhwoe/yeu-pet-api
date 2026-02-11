import { Module } from '@nestjs/common';
import { BullMQModule } from './bullmq/bullmq.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [BullMQModule, FileUploadModule, OtpModule],

  exports: [BullMQModule, FileUploadModule, OtpModule],
})
export class SharedModule {}
