import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantService } from '../../common/services/tenant.service';
import { CreateMasterTemplateDto, UpdateTenantLayoutDto } from './dto/layout.dto';

// Define minimal interfaces for type-safety since we're using raw Mongoose schemas
export interface GlobalLayoutDocument {
  shopId: string;
  publishedData: Record<string, any>;
  draftData: Record<string, any>;
}

export interface PageLayoutDocument {
  shopId: string;
  pageType: string;
  slug?: string;
  publishedData: Record<string, any>;
  draftData: Record<string, any>;
}

@Injectable()
export class LayoutService {
  constructor(
    private readonly tenantService: TenantService,
    @InjectModel('GlobalLayout') private globalLayoutModel: Model<GlobalLayoutDocument>,
    @InjectModel('PageLayout') private pageLayoutModel: Model<PageLayoutDocument>,
    @InjectModel('UIComponentCatalog') private uiComponentCatalogModel: Model<any>
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async createMasterTemplate(dto: CreateMasterTemplateDto) {
    // Usually master templates are globally defined without a shop context
    // This is a placeholder since the master template uses MasterTemplateCatalog
    return { status: 'created', industry: dto.industry };
  }

  async getTenantLayout() {
    const shopId = this.getShopId();
    
    // Retrieve merged JSON layout from Mongoose
    let globalLayout = await this.globalLayoutModel.findOne({ shopId }).exec();
    
    // Auto-initialize if doesn't exist
    if (!globalLayout) {
      globalLayout = await this.globalLayoutModel.create({
        shopId,
        publishedData: {},
        draftData: {}
      });
    }
    
    return { data: globalLayout };
  }

  async updateTenantLayout(dto: UpdateTenantLayoutDto) {
    const shopId = this.getShopId();
    
    // Save overrides to Mongoose using upsert
    const updated = await this.globalLayoutModel.findOneAndUpdate(
      { shopId },
      { $set: { draftData: dto.overrides } },
      { upsert: true, new: true }
    ).exec();

    return { status: 'updated', data: updated };
  }

  async publishLayout() {
    const shopId = this.getShopId();
    const layout = await this.globalLayoutModel.findOne({ shopId }).exec();
    if (!layout) throw new BadRequestException('No layout draft found');
    
    const published = await this.globalLayoutModel.findOneAndUpdate(
      { shopId },
      { $set: { publishedData: layout.draftData } },
      { new: true }
    ).exec();

    return { status: 'published', data: published };
  }

  // ─── Public storefront endpoints (by shopId directly) ─────────────────

  async getGlobalLayout(shopId: string) {
    let globalLayout = await this.globalLayoutModel.findOne({ shopId }).exec();
    if (!globalLayout) {
      globalLayout = await this.globalLayoutModel.create({
        shopId,
        publishedData: {},
        draftData: {},
      });
    }
    return globalLayout.publishedData;
  }

  async getPageLayout(shopId: string, pageType: string, slug?: string) {
    const query: any = { shopId, pageType };
    if (slug) query.slug = slug;

    const pageLayout = await this.pageLayoutModel.findOne(query).exec();
    return pageLayout ? pageLayout.publishedData : null;
  }

  // ─── Builder Component Schemas ──────────────────────────────────────────

  async getComponentSchemas() {
    const schemas = await this.uiComponentCatalogModel.find().lean().exec();
    return schemas;
  }
}
