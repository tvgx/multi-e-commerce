import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/media.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';

@UseGuards(RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: any, @Body() dto: UploadMediaDto) {
    return this.mediaService.uploadFile(file, dto);
  }
}

