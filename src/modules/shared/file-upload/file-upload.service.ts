import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BULLMQ_QUEUES } from '../bullmq/bullmq.queue';
import {
  UploadJobData,
  UploadJobParams,
} from '@app/interfaces/file-upload.interface';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectQueue(BULLMQ_QUEUES.FILE_UPLOAD) private readonly uploadQueue: Queue,
  ) {}

  async addUploadJob({ file, jobName, options }: UploadJobParams) {
    const jobData: UploadJobData = {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      options,
    };

    const job = await this.uploadQueue.add(jobName, jobData, {
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return {
      jobId: job.id,
      message: 'Upload queued successfully',
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.uploadQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      jobId: job.id,
      state,
      progress: job.progress,
      failedReason: job.failedReason,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      returnvalue: job.returnvalue,
    };
  }
}
