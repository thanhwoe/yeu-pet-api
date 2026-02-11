export interface IFileUploadService {
  uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult>;
  deleteImage(publicId: string): Promise<boolean>;
  updateImage(
    file: Express.Multer.File,
    oldPublicId?: string,
    folder?: string,
  ): Promise<UploadResult>;
}

export const IFileUploadService = Symbol('IFileUploadService');

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface DestroyResult {
  result: string;
}

interface UploadJobOptions {
  userId?: string;
  oldFileId?: string;
  folder?: string;
}

export interface UploadJobData {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
  options?: UploadJobOptions;
}

export interface UploadJobParams {
  jobName: string;
  file: Express.Multer.File;
  options?: UploadJobOptions;
}
