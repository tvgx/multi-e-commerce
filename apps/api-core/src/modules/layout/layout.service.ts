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

  // ─── Builder draft endpoints ────────────────────────────────────────────

  async getBuilderGlobal(shopId: string) {
    let doc = await this.globalLayoutModel.findOne({ shopId }).exec();
    if (!doc) {
      doc = await this.globalLayoutModel.create({ shopId, publishedData: {}, draftData: {} });
    }
    // Return draftData if it has content, otherwise fall back to publishedData
    const data = (doc.draftData && Object.keys(doc.draftData).length > 0)
      ? doc.draftData
      : doc.publishedData;
    return data;
  }

  async getBuilderPage(shopId: string, pageType: string) {
    const query: any = { shopId, pageType };
    const doc = await this.pageLayoutModel.findOne(query).exec();
    if (!doc) return null;
    return (doc.draftData && Object.keys(doc.draftData).length > 0)
      ? doc.draftData
      : doc.publishedData;
  }

  async saveBuilderGlobal(shopId: string, globalComponents: any[], theme: Record<string, any>) {
    const draftData = { globalComponents: globalComponents || [], theme: theme || {} };
    const doc = await this.globalLayoutModel.findOneAndUpdate(
      { shopId },
      { $set: { draftData } },
      { upsert: true, new: true },
    ).exec();
    return doc;
  }

  async saveBuilderPage(shopId: string, pageType: string, components: any[]) {
    const draftData = { components: components || [] };
    const doc = await this.pageLayoutModel.findOneAndUpdate(
      { shopId, pageType },
      { $set: { draftData } },
      { upsert: true, new: true },
    ).exec();
    return doc;
  }

  async getPageLayout(shopId: string, pageType: string, slug?: string) {
    const query: any = { shopId, pageType };
    if (slug) query.slug = slug;

    const pageLayout = await this.pageLayoutModel.findOne(query).exec();
    return pageLayout ? pageLayout.publishedData : null;
  }

  // ─── Publish by shopId (copies draftData → publishedData) ──────────────

  async publishLayoutByShopId(shopId: string) {
    // Publish global layout
    const globalDoc = await this.globalLayoutModel.findOne({ shopId }).exec();
    if (globalDoc?.draftData && Object.keys(globalDoc.draftData).length > 0) {
      await this.globalLayoutModel.findOneAndUpdate(
        { shopId },
        { $set: { publishedData: globalDoc.draftData } },
        { new: true },
      ).exec();
    }

    // Publish all page layouts for this shop in one round-trip
    const pageLayouts = await this.pageLayoutModel.find({ shopId }).exec();
    const ops = pageLayouts
      .filter((page) => page.draftData && Object.keys(page.draftData).length > 0)
      .map((page) => ({
        updateOne: {
          filter: { shopId, pageType: page.pageType },
          update: { $set: { publishedData: page.draftData } },
        },
      }));
    if (ops.length > 0) {
      await this.pageLayoutModel.bulkWrite(ops);
    }

    return { status: 'published', shopId };
  }

  // ─── Builder Component Schemas ──────────────────────────────────────────

  async getComponentSchemas() {
    const schemas = await this.uiComponentCatalogModel.find().lean().exec();
    return schemas;
  }
}
