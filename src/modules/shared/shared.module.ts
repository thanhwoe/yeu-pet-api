import { Module } from '@nestjs/common';
import { BullMQModule } from './bullmq/bullmq.module';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [BullMQModule, FileUploadModule],

  exports: [BullMQModule, FileUploadModule],
})
export class SharedModule {}
