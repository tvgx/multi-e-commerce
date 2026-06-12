import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { TenantService } from '../../common/services/tenant.service';
import { CreateMasterTemplateDto, UpdateTenantLayoutDto } from './dto/layout.dto';

// Page types that the shop owner can customise in the builder. Kept in sync
// with EDITABLE_PAGES in @ecommerce/ui-registry's builder-store.
export const EDITABLE_PAGE_TYPES = ['home', 'product_listing', 'product_detail'] as const;

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
    const layout = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1 })
      .lean()
      .exec();
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
    // lean + projection: endpoint nóng nhất của storefront, chỉ cần publishedData
    const globalLayout = await this.globalLayoutModel
      .findOne({ shopId }, { publishedData: 1 })
      .lean()
      .exec();
    if (!globalLayout) {
      const created = await this.globalLayoutModel.create({
        shopId,
        publishedData: {},
        draftData: {},
      });
      return created.publishedData;
    }
    return globalLayout.publishedData;
  }

  // ─── Builder draft endpoints ────────────────────────────────────────────

  async getBuilderGlobal(shopId: string) {
    let doc = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1, publishedData: 1 })
      .lean()
      .exec();
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
    const doc = await this.pageLayoutModel
      .findOne(query, { draftData: 1, publishedData: 1 })
      .lean()
      .exec();
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

    const pageLayout = await this.pageLayoutModel
      .findOne(query, { publishedData: 1 })
      .lean()
      .exec();
    return pageLayout ? pageLayout.publishedData : null;
  }

  // ─── Publish by shopId (copies draftData → publishedData) ──────────────

  async publishLayoutByShopId(shopId: string) {
    // Publish global layout
    const globalDoc = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1 })
      .lean()
      .exec();
    if (globalDoc?.draftData && Object.keys(globalDoc.draftData).length > 0) {
      await this.globalLayoutModel.findOneAndUpdate(
        { shopId },
        { $set: { publishedData: globalDoc.draftData } },
        { new: true },
      ).exec();
    }

    // Publish all page layouts for this shop in one round-trip
    // (chỉ cần pageType + draftData, không kéo publishedData về)
    const pageLayouts = await this.pageLayoutModel
      .find({ shopId }, { pageType: 1, draftData: 1 })
      .lean()
      .exec();
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

  // ─── Seeding default layouts on shop creation ───────────────────────────
  // A brand-new shop gets a working storefront immediately (header/footer +
  // a starter Home, Product listing and Product detail page) so a non-technical
  // owner never lands on a blank or "Layout not found" page. Only pages that
  // have no content yet are touched, so re-running this never clobbers edits.

  private hasContent(data: any): boolean {
    return !!data && typeof data === 'object' && Object.keys(data).length > 0;
  }

  private buildDefaultGlobal(shopName: string) {
    const block = (componentId: string, props: Record<string, any>, order: number) => ({
      id: randomUUID(), componentId, type: 'block', props, order,
    });
    return {
      theme: { shopName },
      globalComponents: [
        {
          id: 'global-header',
          componentId: 'Header',
          type: 'section',
          props: { shopName, logoPosition: 'left' },
          blocks: [
            block('HeaderMenuItem', { label: 'Trang chủ', link: '/' }, 0),
            block('HeaderMenuItem', { label: 'Sản phẩm', link: '/all-products' }, 1),
            block('HeaderLanguageSwitcher', {}, 2),
            block('HeaderCartTrigger', {}, 3),
          ],
        },
        {
          id: 'global-footer',
          componentId: 'Footer',
          type: 'section',
          props: { shopName, copyrightText: `© ${new Date().getFullYear()} ${shopName}` },
          blocks: [
            block('FooterColumn', { title: 'Về chúng tôi', links: 'Giới thiệu,/about\nLiên hệ,/contact' }, 0),
            block('FooterColumn', { title: 'Hỗ trợ', links: 'Chính sách,/policy\nĐổi trả,/returns' }, 1),
          ],
        },
      ],
    };
  }

  private buildDefaultPage(pageType: string): { components: any[] } {
    const section = (componentId: string, props: Record<string, any>, order: number) => ({
      id: randomUUID(), componentId, type: 'section', props, order,
    });
    switch (pageType) {
      case 'home':
        return {
          components: [
            section('Hero', {
              title: 'Chào mừng đến với cửa hàng',
              subtitle: 'Khám phá những sản phẩm mới nhất của chúng tôi',
              ctaText: 'Mua ngay',
              ctaLink: '/all-products',
            }, 0),
            section('FeaturedProducts', { title: 'Sản phẩm nổi bật' }, 1),
          ],
        };
      case 'product_listing':
        return {
          components: [
            section('StandardCategoryPage', {
              title: 'Tất cả sản phẩm',
              description: 'Khám phá toàn bộ bộ sưu tập của chúng tôi.',
            }, 0),
          ],
        };
      case 'product_detail':
        return {
          components: [section('StandardProductDetail', {}, 0)],
        };
      default:
        return { components: [] };
    }
  }

  async seedDefaultLayouts(shopId: string, opts: { shopName?: string } = {}) {
    if (!shopId) throw new BadRequestException('shopId is required');
    const shopName = opts.shopName?.trim() || 'STOREFRONT';
    const seeded: { global: boolean; pages: string[] } = { global: false, pages: [] };

    // Global header/footer + theme
    const existingGlobal = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1, publishedData: 1 })
      .lean()
      .exec();
    if (!existingGlobal || (!this.hasContent(existingGlobal.publishedData) && !this.hasContent(existingGlobal.draftData))) {
      const data = this.buildDefaultGlobal(shopName);
      await this.globalLayoutModel.findOneAndUpdate(
        { shopId },
        { $set: { draftData: data, publishedData: data } },
        { upsert: true, new: true },
      ).exec();
      seeded.global = true;
    }

    // One starter layout per editable page
    for (const pageType of EDITABLE_PAGE_TYPES) {
      const existingPage = await this.pageLayoutModel
        .findOne({ shopId, pageType }, { draftData: 1, publishedData: 1 })
        .lean()
        .exec();
      if (existingPage && (this.hasContent(existingPage.publishedData) || this.hasContent(existingPage.draftData))) {
        continue;
      }
      const data = this.buildDefaultPage(pageType);
      await this.pageLayoutModel.findOneAndUpdate(
        { shopId, pageType },
        { $set: { draftData: data, publishedData: data } },
        { upsert: true, new: true },
      ).exec();
      seeded.pages.push(pageType);
    }

    return { status: 'seeded', shopId, seeded };
  }
}
