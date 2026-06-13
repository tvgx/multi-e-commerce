import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

// Ảnh giao diện (builder/theme/logo) — object key luôn có prefix `<shopId>/`
export const LAYOUT_BUCKET = 'shop-layouts';
// Ảnh public của shop (sản phẩm, collection...) — object key luôn có prefix `<shopId>/`
export const PUBLIC_BUCKET = 'shop-public';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private cdnBaseUrl: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    const port = this.configService.get<string>('MINIO_PORT', '9000');
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
    const endpointUrl = `http://${endpoint}:${port}`;

    this.cdnBaseUrl = this.configService.get<string>(
      'CDN_BASE_URL',
      endpointUrl,
    );

    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      maxAttempts: 3,
    });

    this.logger.log(
      `MinioService initialized: ${endpointUrl}, bucket: ${this.bucketName}`,
    );
  }

  async onModuleInit() {
    try {
      for (const bucket of [this.bucketName, LAYOUT_BUCKET, PUBLIC_BUCKET]) {
        await this.ensureBucketExists(bucket);
      }
    } catch (error) {
      this.logger.warn(
        `MinIO not reachable on startup — uploads will fail until MinIO is available. Error: ${error.message}`,
      );
    }
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`Bucket "${bucket}" exists`);
    } catch (error: any) {
      const status = error.$metadata?.httpStatusCode;
      if (
        status === 404 ||
        error.name === 'NoSuchBucket' ||
        error.name === 'NotFound'
      ) {
        this.logger.log(`Bucket "${bucket}" not found — creating...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      } else {
        throw error;
      }
    }

    // Luôn áp policy public-read (idempotent) — bucket tạo tay ngoài app
    // thường thiếu policy, ảnh sẽ 403 trên storefront.
    await this.s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }),
      }),
    );
    this.logger.log(`Bucket "${bucket}" public-read policy ensured`);
  }

  getBucketName(): string {
    return this.bucketName;
  }

  // Dựng public URL cho một object key — khớp đúng URL mà uploadFile trả về,
  // dùng khi cần URL của object đã tồn tại (không upload lại).
  buildPublicUrl(key: string, bucket: string = this.bucketName): string {
    return `${this.cdnBaseUrl}/${bucket}/${key}`;
  }

  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    mimetype: string,
    bucket: string = this.bucketName,
  ): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimetype,
        }),
      );

      const publicUrl = `${this.cdnBaseUrl}/${bucket}/${key}`;
      this.logger.log(`File uploaded: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async listKeys(
    prefix: string,
    bucket: string = this.bucketName,
  ): Promise<string[]> {
    const res = await this.s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
    );
    return (res.Contents || [])
      .map((obj) => obj.Key)
      .filter((k): k is string => !!k);
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket || this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`File deleted: ${bucket || this.bucketName}/${key}`);
    } catch (error) {
      this.logger.error(
        `Delete failed for ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async fileExists(
    key: string,
    bucket: string = this.bucketName,
  ): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
