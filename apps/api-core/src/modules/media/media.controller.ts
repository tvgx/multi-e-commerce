import { Controller, Post, Delete, Param, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/media.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any, @Body() dto: UploadMediaDto) {
    const media = await this.mediaService.uploadFile(file, dto);
    return BaseResponseDto.success(media);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    const result = await this.mediaService.deleteMedia(id);
    return BaseResponseDto.success(result);
  }
}

