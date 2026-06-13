import { Controller, Get, Param } from '@nestjs/common';
import { GeoService } from './geo.service';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

// Public reference data — dùng cho dropdown địa chỉ kho hàng (trang Billing & Shipping).
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('provinces')
  async provinces() {
    return BaseResponseDto.success(await this.geoService.listProvinces());
  }

  @Get('provinces/:code/wards')
  async wards(@Param('code') code: string) {
    return BaseResponseDto.success(await this.geoService.listWards(code));
  }
}
