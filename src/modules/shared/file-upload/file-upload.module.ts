import { Module } from '@nestjs/common';
import { FileUploadProcessor } from './file-upload.processor';
import { FileUploadService } from './file-upload.service';
import { IFileUploadService } from '@app/interfaces/file-upload.interface';
import { CloudinaryService } from './cloudinary/clodinary.service';
import { UsersRepository } from '@app/modules/users/users.repository';

@Module({
  providers: [
    FileUploadService,
    UsersRepository,
    FileUploadProcessor,
    {
      provide: IFileUploadService,
      useClass: CloudinaryService,
    },
  ],
  exports: [FileUploadService],
})
export class FileUploadModule {}
