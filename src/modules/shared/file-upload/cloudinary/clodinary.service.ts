import type {
  DestroyResult,
  IFileUploadService,
  UploadResult,
} from '@app/interfaces/file-upload.interface';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements IFileUploadService {
  private readonly folder: string;

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>('CLOUDINARY_NAME'),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });

    this.folder = this.configService.getOrThrow<string>(
      'CLOUDINARY_UPLOAD_FOLDER',
    );
  }

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    try {
      // Validate file type
      this.validateImageFile(file);

      const result = await new Promise<UploadApiResponse | undefined>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folder || this.folder,
              resource_type: 'image',
              transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) return reject(error as Error);
              resolve(result);
            },
          );

          uploadStream.end(file.buffer);
        },
      );

      if (!result) {
        throw new BadRequestException('Failed to upload image');
      }

      return {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = (await cloudinary.uploader.destroy(
        publicId,
      )) as DestroyResult;

      if (result.result === 'ok' || result.result === 'not found') {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async updateImage(
    file: Express.Multer.File,
    oldPublicId?: string,
    folder?: string,
  ): Promise<UploadResult> {
    const uploadResult = await this.uploadImage(file, folder);

    if (oldPublicId) {
      await this.deleteImage(oldPublicId);
    }

    return uploadResult;
  }

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    const maxSize = parseInt(
      this.configService.get<string>('MAX_FILE_SIZE') || '5242880',
    );

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, JPG, and WebP are allowed',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
      );
    }
  }
}
