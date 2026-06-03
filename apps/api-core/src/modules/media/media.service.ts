import { Injectable, BadRequestException } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { UploadMediaDto } from './dto/media.dto';

@Injectable()
export class MediaService {
  constructor(private readonly tenantService: TenantService) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async uploadFile(file: any, dto: UploadMediaDto) {
    const shopId = this.getShopId();
    // Implementation placeholder for AWS S3 upload and BlurHash generation
    // e.g. const blurHash = await generateBlurHash(file.buffer);
    return {
      url: `https://cdn.example.com/${shopId}/${file.originalname}`,
      blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', // Mock blurhash
      entityType: dto.entityType,
    };
  }
}

