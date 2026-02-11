import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { getBullMQConfig } from './bullmq.config';
import { BULLMQ_QUEUES } from './bullmq.queue';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: getBullMQConfig,
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: BULLMQ_QUEUES.FILE_UPLOAD,
    }),
  ],
  exports: [BullModule],
})
export class BullMQModule {}
