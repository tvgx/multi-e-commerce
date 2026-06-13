import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID, createHash } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../database/prisma.service';
import {
  MinioService,
  LAYOUT_BUCKET,
} from '../../common/services/minio.service';
import {
  CreateMasterTemplateDto,
  UpdateTenantLayoutDto,
} from './dto/layout.dto';

// Prop chứa ảnh trong layout JSON (khớp các field type:'image' của ui-registry).
// Mọi giá trị của các key này sẽ được đưa về bucket shop-layouts/<shopId>/ khi
// xuất bản. Giữ allowlist tại đây vì api-core không phụ thuộc @ecommerce/ui-registry.
const IMAGE_PROP_KEYS = new Set([
  'backgroundImageUrl',
  'logoUrl',
  'imageUrl',
  'mainImage',
  'imageBefore',
  'imageAfter',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

// Page types that the shop owner can customise in the builder. Kept in sync
// with EDITABLE_PAGES in @ecommerce/ui-registry's builder-store.
export const EDITABLE_PAGE_TYPES = [
  'home',
  'product_listing',
  'product_detail',
] as const;

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
  private readonly logger = new Logger(LayoutService.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
    @InjectModel('GlobalLayout')
    private globalLayoutModel: Model<GlobalLayoutDocument>,
    @InjectModel('PageLayout')
    private pageLayoutModel: Model<PageLayoutDocument>,
    @InjectModel('UIComponentCatalog')
    private uiComponentCatalogModel: Model<any>,
  ) {}

  // Xuất bản giao diện = đưa shop lên sóng: chuyển DRAFT → PUBLISHED và đánh dấu
  // bước "thiết kế" (step 5) hoàn tất. Idempotent, không hạ cấp shop đã publish.
  // Public: worker /scripts/shop-builder gọi qua Nest context.
  async markShopPublished(shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { onboardingStep: true, onboardingStatus: true },
    });
    if (!shop) return;
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        status: 'PUBLISHED',
        onboardingStep: Math.max(shop.onboardingStep ?? 1, 5),
        onboardingStatus: {
          ...((shop.onboardingStatus as Record<string, any>) || {}),
          step5: 'COMPLETED',
        },
      },
    });
  }

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
        draftData: {},
      });
    }

    return { data: globalLayout };
  }

  async updateTenantLayout(dto: UpdateTenantLayoutDto) {
    const shopId = this.getShopId();

    // Save overrides to Mongoose using upsert
    const updated = await this.globalLayoutModel
      .findOneAndUpdate(
        { shopId },
        { $set: { draftData: dto.overrides } },
        { upsert: true, new: true },
      )
      .exec();

    return { status: 'updated', data: updated };
  }

  async publishLayout() {
    const shopId = this.getShopId();
    const layout = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1 })
      .lean()
      .exec();
    if (!layout) throw new BadRequestException('No layout draft found');

    const publishedData = await this.materializeLayoutImages(
      shopId,
      layout.draftData,
      new Map(),
    );
    const published = await this.globalLayoutModel
      .findOneAndUpdate(
        { shopId },
        { $set: { publishedData } },
        { new: true },
      )
      .exec();

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
      doc = await this.globalLayoutModel.create({
        shopId,
        publishedData: {},
        draftData: {},
      });
    }
    // Return draftData if it has content, otherwise fall back to publishedData
    const data =
      doc.draftData && Object.keys(doc.draftData).length > 0
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
    return doc.draftData && Object.keys(doc.draftData).length > 0
      ? doc.draftData
      : doc.publishedData;
  }

  async saveBuilderGlobal(
    shopId: string,
    globalComponents: any[],
    theme: Record<string, any>,
  ) {
    const draftData = {
      globalComponents: globalComponents || [],
      theme: theme || {},
    };
    const doc = await this.globalLayoutModel
      .findOneAndUpdate(
        { shopId },
        { $set: { draftData } },
        { upsert: true, new: true },
      )
      .exec();
    return doc;
  }

  async saveBuilderPage(shopId: string, pageType: string, components: any[]) {
    const draftData = { components: components || [] };
    const doc = await this.pageLayoutModel
      .findOneAndUpdate(
        { shopId, pageType },
        { $set: { draftData } },
        { upsert: true, new: true },
      )
      .exec();
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
    // Giữ API cũ (POST /layouts/:shopId/publish) — chạy đồng bộ, không báo tiến độ.
    await this.buildAndPublish(shopId);
    return { status: 'published', shopId };
  }

  // ─── Build pipeline (tái dùng bởi worker /scripts/shop-builder) ──────────
  // publishLayoutByShopId cũ được tách thành các stage hạt mịn để worker nền
  // gọi và báo % tiến độ. Hành vi materialize ảnh KHÔNG đổi (vẫn idempotent,
  // hash-key pub-<sha1> trong shop-layouts/<shopId>/).

  // 01 — Kéo toàn bộ draft (global + các page có nội dung).
  async extractDraft(shopId: string): Promise<{
    globalDraft: Record<string, any> | null;
    pageDrafts: { pageType: string; draftData: Record<string, any> }[];
  }> {
    const globalDoc = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1 })
      .lean()
      .exec();
    const pages = await this.pageLayoutModel
      .find({ shopId }, { pageType: 1, draftData: 1 })
      .lean()
      .exec();

    const globalDraft =
      globalDoc?.draftData && Object.keys(globalDoc.draftData).length > 0
        ? globalDoc.draftData
        : null;
    const pageDrafts = pages
      .filter((p) => p.draftData && Object.keys(p.draftData).length > 0)
      .map((p) => ({ pageType: p.pageType, draftData: p.draftData }));

    if (!globalDraft && pageDrafts.length === 0) {
      // Không chặn publish (giữ hành vi cũ) — chỉ cảnh báo shop rỗng.
      this.logger.warn(`Build shop ${shopId}: không có draft nào để build`);
    }
    return { globalDraft, pageDrafts };
  }

  // 02 — Assemble: validate cấu trúc + đảm bảo có Header/Footer. Link điều hướng
  // đã là URL cụ thể (do NavigationEditor ghi sẵn vào prop nút), nên đây là
  // pass-through có kiểm tra; KHÔNG merge vật lý vì storefront đọc global + page riêng.
  assembleLayout(input: {
    globalDraft: Record<string, any> | null;
    pageDrafts: { pageType: string; draftData: Record<string, any> }[];
  }) {
    if (input.globalDraft) {
      const comps = (input.globalDraft.globalComponents as any[]) || [];
      const hasHeader = comps.some((c) => c?.componentId === 'Header');
      const hasFooter = comps.some((c) => c?.componentId === 'Footer');
      if (!hasHeader || !hasFooter) {
        this.logger.warn(
          `Assemble: global layout thiếu ${!hasHeader ? 'Header ' : ''}${!hasFooter ? 'Footer' : ''}`.trim(),
        );
      }
    }
    return input;
  }

  // 03 — Compile: materialize toàn bộ ảnh (global + từng page) dùng chung 1 cache.
  async compilePublished(
    shopId: string,
    assembled: {
      globalDraft: Record<string, any> | null;
      pageDrafts: { pageType: string; draftData: Record<string, any> }[];
    },
    cache: Map<string, string> = new Map(),
  ): Promise<{
    compiledGlobal: Record<string, any> | null;
    compiledPages: { pageType: string; publishedData: Record<string, any> }[];
  }> {
    const compiledGlobal = assembled.globalDraft
      ? await this.materializeLayoutImages(shopId, assembled.globalDraft, cache)
      : null;
    const compiledPages: { pageType: string; publishedData: Record<string, any> }[] = [];
    for (const p of assembled.pageDrafts) {
      compiledPages.push({
        pageType: p.pageType,
        publishedData: await this.materializeLayoutImages(shopId, p.draftData, cache),
      });
    }
    return { compiledGlobal, compiledPages };
  }

  // 04a — Ghi publishedData về Mongo (global + bulk pages).
  async persistPublished(
    shopId: string,
    compiledGlobal: Record<string, any> | null,
    compiledPages: { pageType: string; publishedData: Record<string, any> }[],
  ): Promise<void> {
    if (compiledGlobal) {
      await this.globalLayoutModel
        .findOneAndUpdate({ shopId }, { $set: { publishedData: compiledGlobal } }, { new: true })
        .exec();
    }
    if (compiledPages.length > 0) {
      await this.pageLayoutModel.bulkWrite(
        compiledPages.map((p) => ({
          updateOne: {
            filter: { shopId, pageType: p.pageType },
            update: { $set: { publishedData: p.publishedData } },
          },
        })),
      );
    }
  }

  // URL storefront chính thức (server là source-of-truth). Theo định dạng hiện tại
  // <identifier>.<host> — dùng domain nếu có, fallback shopId.
  async buildStorefrontUrl(shopId: string): Promise<string> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { domain: true },
    });
    const identifier = shop?.domain || shopId;
    const protocol =
      process.env.STOREFRONT_PROTOCOL || process.env.NEXT_PUBLIC_STOREFRONT_PROTOCOL || 'http';
    const host =
      process.env.STOREFRONT_HOST || process.env.NEXT_PUBLIC_STOREFRONT_HOST || 'localhost:3002';
    return `${protocol}://${identifier}.${host}`;
  }

  // Orchestrator: chạy 4 stage, báo % qua onProgress (10/30/60/80/90/95/100).
  async buildAndPublish(
    shopId: string,
    onProgress: (percent: number, stage: string) => Promise<void> | void = () => {},
  ): Promise<{ storefrontUrl: string }> {
    const cache = new Map<string, string>();

    await onProgress(10, 'extract');
    const extracted = await this.extractDraft(shopId);
    await onProgress(30, 'parse');

    await onProgress(40, 'assemble');
    const assembled = this.assembleLayout(extracted);
    await onProgress(60, 'assemble');

    await onProgress(70, 'compile');
    const { compiledGlobal, compiledPages } = await this.compilePublished(shopId, assembled, cache);
    await onProgress(80, 'compile');

    await onProgress(90, 'db-save');
    await this.persistPublished(shopId, compiledGlobal, compiledPages);
    await onProgress(95, 'minio');
    await this.markShopPublished(shopId);
    const storefrontUrl = await this.buildStorefrontUrl(shopId);
    await onProgress(100, 'published');

    return { storefrontUrl };
  }

  // Publish a single page: copy its draftData → publishedData. Used by the guided
  // wizard so each finished page goes live independently as the owner moves on.
  async publishPage(shopId: string, pageType: string) {
    const doc = await this.pageLayoutModel
      .findOne({ shopId, pageType }, { draftData: 1 })
      .lean()
      .exec();
    if (!doc?.draftData || Object.keys(doc.draftData).length === 0) {
      return { status: 'skipped', shopId, pageType };
    }
    const publishedData = await this.materializeLayoutImages(
      shopId,
      doc.draftData,
      new Map(),
    );
    await this.pageLayoutModel
      .findOneAndUpdate(
        { shopId, pageType },
        { $set: { publishedData } },
        { new: true },
      )
      .exec();
    return { status: 'published', shopId, pageType };
  }

  // ─── Publish-time media materialization ─────────────────────────────────
  // Yêu cầu: mọi ảnh ĐANG ĐƯỢC DÙNG trong giao diện shop phải nằm tại
  // shop-layouts/<shopId>/. Khi xuất bản, ta duyệt layout JSON, tìm mọi prop
  // ảnh có URL chưa thuộc bucket này (ảnh dán tay, ảnh mặc định/seed, dữ liệu
  // cũ...), tải về rồi upload lại vào shop-layouts/<shopId>/ và viết lại URL.
  // Chỉ tác động lên dữ liệu PUBLISH — draftData giữ nguyên trạng.

  private async materializeLayoutImages(
    shopId: string,
    data: Record<string, any>,
    cache: Map<string, string>,
  ): Promise<Record<string, any>> {
    // Clone để không đụng tới object draftData gốc (chỉ publishedData mới đổi).
    const clone = structuredClone(data);
    await this.walkAndMaterialize(shopId, clone, cache);
    return clone;
  }

  private async walkAndMaterialize(
    shopId: string,
    node: any,
    cache: Map<string, string>,
  ): Promise<void> {
    if (Array.isArray(node)) {
      for (const item of node) {
        await this.walkAndMaterialize(shopId, item, cache);
      }
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (IMAGE_PROP_KEYS.has(key) && typeof value === 'string' && value.trim()) {
        node[key] = await this.materializeUrl(shopId, value, cache);
      } else if (value && typeof value === 'object') {
        await this.walkAndMaterialize(shopId, value, cache);
      }
    }
  }

  private async materializeUrl(
    shopId: string,
    sourceUrl: string,
    cache: Map<string, string>,
  ): Promise<string> {
    const cached = cache.get(sourceUrl);
    if (cached) return cached;

    // Đã nằm đúng shop-layouts/<shopId>/ rồi → giữ nguyên (idempotent).
    if (sourceUrl.includes(`/${LAYOUT_BUCKET}/${shopId}/`)) {
      cache.set(sourceUrl, sourceUrl);
      return sourceUrl;
    }

    try {
      // Key đích suy ra từ hash URL nguồn ⇒ publish lại không tạo bản sao.
      const hash = createHash('sha1')
        .update(sourceUrl)
        .digest('hex')
        .slice(0, 32);
      const prefix = `${shopId}/pub-${hash}`;

      // Đã materialize ở lần publish trước → tái dùng, khỏi tải lại.
      const existing = await this.minioService.listKeys(prefix, LAYOUT_BUCKET);
      if (existing.length > 0) {
        const url = this.minioService.buildPublicUrl(existing[0], LAYOUT_BUCKET);
        cache.set(sourceUrl, url);
        return url;
      }

      const buffer = await this.fetchImageBytes(sourceUrl);
      if (!buffer) {
        cache.set(sourceUrl, sourceUrl);
        return sourceUrl;
      }
      const typeInfo = await fileTypeFromBuffer(buffer);
      if (!typeInfo || !typeInfo.mime.startsWith('image/')) {
        this.logger.warn(
          `Skip non-image layout asset: ${sourceUrl.slice(0, 80)}`,
        );
        cache.set(sourceUrl, sourceUrl);
        return sourceUrl;
      }
      const key = `${prefix}.${typeInfo.ext}`;
      const url = await this.minioService.uploadFile(
        buffer,
        key,
        typeInfo.mime,
        LAYOUT_BUCKET,
      );
      cache.set(sourceUrl, url);
      return url;
    } catch (err: any) {
      // Một ảnh lỗi không được làm hỏng cả lần publish — giữ URL cũ + cảnh báo.
      this.logger.warn(
        `Could not materialize ${sourceUrl.slice(0, 80)}: ${err?.message}`,
      );
      cache.set(sourceUrl, sourceUrl);
      return sourceUrl;
    }
  }

  private async fetchImageBytes(sourceUrl: string): Promise<Buffer | null> {
    // data:<mime>;base64,<payload>
    if (sourceUrl.startsWith('data:')) {
      const comma = sourceUrl.indexOf(',');
      if (comma === -1) return null;
      const meta = sourceUrl.slice(5, comma);
      const payload = sourceUrl.slice(comma + 1);
      const buf = meta.includes('base64')
        ? Buffer.from(payload, 'base64')
        : Buffer.from(decodeURIComponent(payload));
      return buf.length > 0 && buf.length <= MAX_IMAGE_BYTES ? buf : null;
    }
    if (!/^https?:\/\//i.test(sourceUrl)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(sourceUrl, { signal: controller.signal });
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength > MAX_IMAGE_BYTES) return null;
      return Buffer.from(arrayBuf);
    } finally {
      clearTimeout(timer);
    }
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
    const block = (
      componentId: string,
      props: Record<string, any>,
      order: number,
    ) => ({
      id: randomUUID(),
      componentId,
      type: 'block',
      props,
      order,
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
            block(
              'HeaderMenuItem',
              { label: 'Sản phẩm', link: '/all-products' },
              1,
            ),
            block('HeaderLanguageSwitcher', {}, 2),
            block('HeaderCartTrigger', {}, 3),
          ],
        },
        {
          id: 'global-footer',
          componentId: 'Footer',
          type: 'section',
          props: {
            shopName,
            copyrightText: `© ${new Date().getFullYear()} ${shopName}`,
          },
          blocks: [
            block(
              'FooterColumn',
              {
                title: 'Về chúng tôi',
                links: 'Giới thiệu,/about\nLiên hệ,/contact',
              },
              0,
            ),
            block(
              'FooterColumn',
              {
                title: 'Hỗ trợ',
                links: 'Chính sách,/policy\nĐổi trả,/returns',
              },
              1,
            ),
          ],
        },
      ],
    };
  }

  private buildDefaultPage(pageType: string): { components: any[] } {
    const section = (
      componentId: string,
      props: Record<string, any>,
      order: number,
    ) => ({
      id: randomUUID(),
      componentId,
      type: 'section',
      props,
      order,
    });
    switch (pageType) {
      case 'home':
        return {
          components: [
            section(
              'Hero',
              {
                title: 'Chào mừng đến với cửa hàng',
                subtitle: 'Khám phá những sản phẩm mới nhất của chúng tôi',
                ctaText: 'Mua ngay',
                ctaLink: '/all-products',
              },
              0,
            ),
            section('FeaturedProducts', { title: 'Sản phẩm nổi bật' }, 1),
          ],
        };
      case 'product_listing':
        return {
          components: [
            section(
              'StandardCategoryPage',
              {
                title: 'Tất cả sản phẩm',
                description: 'Khám phá toàn bộ bộ sưu tập của chúng tôi.',
              },
              0,
            ),
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
    const seeded: { global: boolean; pages: string[] } = {
      global: false,
      pages: [],
    };

    // Global header/footer + theme
    const existingGlobal = await this.globalLayoutModel
      .findOne({ shopId }, { draftData: 1, publishedData: 1 })
      .lean()
      .exec();
    if (
      !existingGlobal ||
      (!this.hasContent(existingGlobal.publishedData) &&
        !this.hasContent(existingGlobal.draftData))
    ) {
      const data = this.buildDefaultGlobal(shopName);
      await this.globalLayoutModel
        .findOneAndUpdate(
          { shopId },
          { $set: { draftData: data, publishedData: data } },
          { upsert: true, new: true },
        )
        .exec();
      seeded.global = true;
    }

    // One starter layout per editable page
    for (const pageType of EDITABLE_PAGE_TYPES) {
      const existingPage = await this.pageLayoutModel
        .findOne({ shopId, pageType }, { draftData: 1, publishedData: 1 })
        .lean()
        .exec();
      if (
        existingPage &&
        (this.hasContent(existingPage.publishedData) ||
          this.hasContent(existingPage.draftData))
      ) {
        continue;
      }
      const data = this.buildDefaultPage(pageType);
      await this.pageLayoutModel
        .findOneAndUpdate(
          { shopId, pageType },
          { $set: { draftData: data, publishedData: data } },
          { upsert: true, new: true },
        )
        .exec();
      seeded.pages.push(pageType);
    }

    return { status: 'seeded', shopId, seeded };
  }
}
