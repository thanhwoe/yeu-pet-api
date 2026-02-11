import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { BULLMQ_QUEUES } from '../bullmq/bullmq.queue';
import {
  IFileUploadService,
  UploadJobData,
  UploadResult,
} from '@app/interfaces/file-upload.interface';
import Stream from 'stream';
import { UsersRepository } from '@app/modules/users/users.repository';
import { FILE_UPLOAD_JOBS } from './file-upload.jobs';

@Processor(BULLMQ_QUEUES.FILE_UPLOAD, { concurrency: 3 })
export class FileUploadProcessor extends WorkerHost {
  constructor(
    @Inject(IFileUploadService)
    private readonly fileUploadService: IFileUploadService,
    private readonly usersRepository: UsersRepository,
  ) {
    super();
  }

  async process(
    job: Job<UploadJobData, any, keyof typeof FILE_UPLOAD_JOBS>,
  ): Promise<any> {
    const { file, options } = job.data;

    // Convert buffer back to Multer file format
    const multerFile: Express.Multer.File = {
      buffer: Buffer.from(file.buffer),
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: 'file',
      encoding: '7bit',
      size: file.buffer.length,
      stream: null as unknown as Stream.Readable,
      destination: '',
      filename: '',
      path: '',
    };

    // Update progress
    await job.updateProgress(30);

    // Upload to Cloudinary
    const result = await this.fileUploadService.updateImage(
      multerFile,
      options?.oldFileId,
      options?.folder,
    );

    await job.updateProgress(70);

    // Handle specific logic by job name
    switch (job.name) {
      case FILE_UPLOAD_JOBS.USER_AVATAR:
        await this.updateUserAvatar(result, options?.userId);
        break;

      default:
        break;
    }

    await job.updateProgress(100);

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  private async updateUserAvatar(data: UploadResult, userId?: string) {
    if (!userId) {
      return null;
    }
    return this.usersRepository.update(userId, {
      avatar_id: data.publicId,
      avatar_url: data.url,
    });
  }
}
