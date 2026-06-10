import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private cdnBaseUrl: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'shop-images');
    const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');
    const endpointUrl = `http://${endpoint}:${port}`;

    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL', endpointUrl);

    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      maxAttempts: 3,
    });

    this.logger.log(`MinioService initialized: ${endpointUrl}, bucket: ${this.bucketName}`);
  }

  async onModuleInit() {
    try {
      await this.ensureBucketExists();
    } catch (error) {
      this.logger.warn(
        `MinIO not reachable on startup — uploads will fail until MinIO is available. Error: ${error.message}`,
      );
    }
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`Bucket "${this.bucketName}" exists`);
    } catch (error: any) {
      const status = error.$metadata?.httpStatusCode;
      if (status === 404 || error.name === 'NoSuchBucket' || error.name === 'NotFound') {
        this.logger.log(`Bucket "${this.bucketName}" not found — creating...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucketName,
            Policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: '*',
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${this.bucketName}/*`],
                },
              ],
            }),
          }),
        );
        this.logger.log(`Bucket "${this.bucketName}" created with public-read policy`);
      } else {
        throw error;
      }
    }
  }

  getBucketName(): string {
    return this.bucketName;
  }

  async uploadFile(fileBuffer: Buffer, originalFilename: string, mimetype: string): Promise<string> {
    const extension = path.extname(originalFilename);
    const fileName = `${uuidv4()}${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: fileBuffer,
          ContentType: mimetype,
        }),
      );

      const publicUrl = `${this.cdnBaseUrl}/${this.bucketName}/${fileName}`;
      this.logger.log(`File uploaded: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}
