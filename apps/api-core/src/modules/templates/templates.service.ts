import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { MasterTemplateCatalog } from '@ecommerce/database';

@Injectable()
export class TemplatesService {
  async getMasterTemplates(): Promise<BaseResponseDto<any>> {
    try {
      const templates = await MasterTemplateCatalog.find({}).sort({ isCustom: 1, templateKey: 1 }).lean();
      // map _id to id
      const mappedTemplates = templates.map((t: any) => ({
        id: t.templateKey, // send templateKey as id for backward compatibility in UI
        ...t,
        _id: undefined
      }));
      return BaseResponseDto.success(mappedTemplates);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch master templates');
    }
  }
}
