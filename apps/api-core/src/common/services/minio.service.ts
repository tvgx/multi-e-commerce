import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;
  private port: string;
  private cdnBaseUrl: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    this.port = this.configService.get<string>('MINIO_PORT', '9000');
    this.bucketName = this.configService.get<string>(
      'MINIO_BUCKET',
      'shop-images',
    );
    const accessKeyId = this.configService.get<string>(
      'MINIO_ACCESS_KEY',
      'minioadmin',
    );
    const secretAccessKey = this.configService.get<string>(
      'MINIO_SECRET_KEY',
      'minioadmin',
    );
    this.cdnBaseUrl = this.configService.get<string>(
      'CDN_BASE_URL',
      `http://${this.endpoint}:${this.port}`
    );

    const endpointUrl = `http://${this.endpoint}:${this.port}`;

    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: 'us-east-1', // MinIO requires a region, any string works
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.logger.log(
      `MinioService initialized with endpoint: ${endpointUrl}, bucket: ${this.bucketName}`,
    );
  }

  /**
   * Uploads a file buffer to MinIO and returns the public URL
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimetype: string,
  ): Promise<string> {
    const extension = path.extname(originalFilename);
    const fileName = `${uuidv4()}${extension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimetype,
      });

      await this.s3Client.send(command);

      // Return the public URL for the uploaded file using CDN_BASE_URL
      const publicUrl = `${this.cdnBaseUrl}/${this.bucketName}/${fileName}`;
      this.logger.log(`File uploaded successfully: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      this.logger.error(
        `Error uploading file to MinIO: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Checks if a file exists in the bucket
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
