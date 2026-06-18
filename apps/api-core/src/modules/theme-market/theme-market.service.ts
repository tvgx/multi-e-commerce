import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { firstImageUrlInComponents, slugify } from '@ecommerce/schema';
import { PrismaService } from '../../database/prisma.service';

type ThemeStatus = 'draft' | 'pending' | 'published';

interface ThemeReview {
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface ThemeTemplateDocument {
  themeId: string;
  title: string;
  description?: string;
  category?: string;
  status: ThemeStatus;
  previewImageUrl?: string;
  thumbnails: string[];
  global: Record<string, any>;
  pages: Record<string, any[]>;
  tenantId: string | null;
  ownerUserId: string | null;
  ownerShopId: string | null;
  pricing?: Record<string, any>;
  review?: ThemeReview;
}

interface GlobalLayoutDocument {
  shopId: string;
  draftData: Record<string, any>;
  publishedData: Record<string, any>;
}

interface PageLayoutDocument {
  shopId: string;
  pageType: string;
  draftData: Record<string, any>;
  publishedData: Record<string, any>;
}

/** The authenticated user as attached by BetterAuthGuard (session.user). */
export interface AuthActor {
  id: string;
  role?: string;
}

// Fields returned for grids — never ship the full page trees in a list.
const LIST_PROJECTION = {
  themeId: 1,
  title: 1,
  description: 1,
  category: 1,
  status: 1,
  previewImageUrl: 1,
  thumbnails: 1,
};

// Owner's "my themes" grid also needs status detail + rejection feedback.
const MINE_PROJECTION = {
  ...LIST_PROJECTION,
  ownerShopId: 1,
  review: 1,
  updatedAt: 1,
};

/**
 * Theme Market + Theme Shop.
 *
 * Browse/apply curated themes, plus the web-based authoring flow: sellers
 * capture their current shop design as a theme ({@link createFromShop}) or
 * import a Figma file ({@link importFromFigma}), submit it for review, and an
 * admin publishes/rejects. Themes are produced either here or by the
 * design-agent `promote-theme` curation step; both write `theme_templates`.
 */
@Injectable()
export class ThemeMarketService {
  private readonly logger = new Logger(ThemeMarketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectModel('ThemeTemplate')
    private themeModel: Model<ThemeTemplateDocument>,
    @InjectModel('GlobalLayout')
    private globalLayoutModel: Model<GlobalLayoutDocument>,
    @InjectModel('PageLayout')
    private pageLayoutModel: Model<PageLayoutDocument>,
  ) {}

  /** List published themes for the public market grid. */
  async listThemes(status: ThemeStatus | 'all' = 'published') {
    const filter = status === 'all' ? {} : { status };
    return this.themeModel
      .find(filter, LIST_PROJECTION)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  /** Full theme document (includes the page trees) for preview. */
  async getTheme(themeId: string) {
    const theme = await this.themeModel.findOne({ themeId }).lean().exec();
    if (!theme) throw new NotFoundException(`Theme "${themeId}" not found`);
    return theme;
  }

  /** All themes created by a given user (any status), for "My themes". */
  async listMine(ownerUserId: string) {
    return this.themeModel
      .find({ ownerUserId }, MINE_PROJECTION)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  /** Admin review queue (pending by default). */
  async listForReview(actor: AuthActor, status: ThemeStatus = 'pending') {
    await this.assertAdmin(actor);
    return this.themeModel
      .find({ status }, MINE_PROJECTION)
      .sort({ updatedAt: 1 })
      .lean()
      .exec();
  }

  /**
   * Capture a shop's current DRAFT design as a new theme (the inverse of
   * {@link applyTheme}). Both sides share the editor format, so the global +
   * per-page draftData copy straight across into the theme document.
   */
  async createFromShop(
    shopId: string,
    owner: AuthActor,
    meta: { title?: string; description?: string; category?: string },
  ) {
    if (!meta.title?.trim()) throw new BadRequestException('title is required');
    await this.assertShopOwner(shopId, owner);

    const globalDoc = await this.globalLayoutModel
      .findOne({ shopId })
      .lean()
      .exec();
    const pageDocs = await this.pageLayoutModel
      .find({ shopId })
      .lean()
      .exec();

    const draftGlobal = globalDoc?.draftData ?? {};
    const global = {
      theme: draftGlobal.theme ?? {},
      globalComponents: draftGlobal.globalComponents ?? [],
    };
    const pages: Record<string, any[]> = {};
    for (const p of pageDocs) {
      pages[p.pageType] = p.draftData?.components ?? [];
    }

    if (
      global.globalComponents.length === 0 &&
      Object.values(pages).every((c) => c.length === 0)
    ) {
      throw new BadRequestException(
        'Shop has no draft design to save. Build a layout first.',
      );
    }

    // Preview = first image found across global + page components.
    const allComponents = [
      ...global.globalComponents,
      ...Object.values(pages).flat(),
    ];
    const previewImageUrl = firstImageUrlInComponents(allComponents as any);

    const themeId = `${slugify(meta.title)}-${this.shortId()}`;
    await this.themeModel.create({
      themeId,
      title: meta.title.trim(),
      description: meta.description ?? '',
      category: meta.category,
      status: 'draft',
      previewImageUrl,
      thumbnails: previewImageUrl ? [previewImageUrl] : [],
      global,
      pages,
      tenantId: null,
      ownerUserId: owner.id,
      ownerShopId: shopId,
    });

    this.logger.log(
      `Created theme "${themeId}" from shop ${shopId} (owner ${owner.id}).`,
    );
    return { themeId, status: 'draft', pages: Object.keys(pages) };
  }

  /** Seller submits their draft theme for admin review. */
  async submitForReview(themeId: string, actor: AuthActor) {
    const theme = await this.getOwnedThemeOrThrow(themeId, actor);
    if (theme.status === 'published') {
      throw new BadRequestException('Theme is already published.');
    }
    await this.themeModel
      .updateOne(
        { themeId },
        { $set: { status: 'pending', 'review.submittedAt': new Date() } },
      )
      .exec();
    return { themeId, status: 'pending' };
  }

  /** Admin curation: take a pending theme live in the market. */
  async publishTheme(themeId: string, actor: AuthActor) {
    await this.assertAdmin(actor);
    const theme = await this.themeModel
      .findOneAndUpdate(
        { themeId },
        {
          $set: {
            status: 'published',
            'review.reviewedAt': new Date(),
            'review.reviewedBy': actor.id,
            'review.rejectionReason': null,
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!theme) throw new NotFoundException(`Theme "${themeId}" not found`);
    return { status: 'published', themeId };
  }

  /** Admin rejection: send a pending theme back to its owner as a draft. */
  async rejectTheme(themeId: string, reason: string, actor: AuthActor) {
    await this.assertAdmin(actor);
    const theme = await this.themeModel
      .findOneAndUpdate(
        { themeId },
        {
          $set: {
            status: 'draft',
            'review.reviewedAt': new Date(),
            'review.reviewedBy': actor.id,
            'review.rejectionReason': reason || 'Không đạt yêu cầu.',
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!theme) throw new NotFoundException(`Theme "${themeId}" not found`);
    return { status: 'draft', themeId };
  }

  /** Delete a theme (owner or admin). */
  async deleteTheme(themeId: string, actor: AuthActor) {
    await this.getOwnedThemeOrThrow(themeId, actor);
    await this.themeModel.deleteOne({ themeId }).exec();
    return { deleted: true, themeId };
  }

  /**
   * Import a Figma file into a draft theme owned by the seller. Proxies to the
   * design-agent pipeline (server-to-server, internal key); design-agent runs
   * extraction + writes the draft `theme_templates` document.
   */
  async importFromFigma(
    shopId: string,
    owner: AuthActor,
    body: {
      fileKey?: string;
      title?: string;
      description?: string;
      category?: string;
      nodeIds?: string[];
    },
  ) {
    await this.assertShopOwner(shopId, owner);
    if (!body.fileKey?.trim())
      throw new BadRequestException('fileKey is required');
    if (!body.title?.trim()) throw new BadRequestException('title is required');

    const baseUrl =
      this.config.get<string>('DESIGN_AGENT_URL') ?? 'http://localhost:3100';
    const internalKey = this.config.get<string>('INTERNAL_API_KEY') ?? '';

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/design-agent/extract-theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify({
          fileKey: body.fileKey.trim(),
          title: body.title.trim(),
          description: body.description,
          category: body.category,
          nodeIds: body.nodeIds,
          tenantId: null,
          ownerUserId: owner.id,
          ownerShopId: shopId,
        }),
      });
    } catch (err) {
      throw new BadRequestException(
        `Không kết nối được design-agent (${baseUrl}). Đảm bảo nó đang chạy ở chế độ serve.`,
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new BadRequestException(
        `Import Figma thất bại (${res.status}): ${text.slice(0, 300)}`,
      );
    }
    return res.json();
  }

  /**
   * Apply a theme to a shop's DRAFT layout (never publishes). Overwrites the
   * shop's current draft global + per-page layouts so the owner lands in the
   * builder with the theme ready to tweak. Images stay as the theme's shared
   * MinIO URLs — publishing the shop later materialises them into the shop's
   * own bucket (LayoutService.buildAndPublish), so nothing to copy here.
   */
  async applyTheme(themeId: string, shopId: string, actor?: AuthActor) {
    if (!shopId) throw new BadRequestException('shopId is required');
    if (actor) await this.assertShopOwner(shopId, actor);
    const theme = await this.getTheme(themeId);

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true },
    });
    if (!shop) throw new NotFoundException(`Shop "${shopId}" not found`);

    // Stamp the real shop name onto the theme's global theme metadata.
    const globalData = {
      theme: { ...(theme.global?.theme ?? {}), shopName: shop.name },
      globalComponents: theme.global?.globalComponents ?? [],
    };

    await this.globalLayoutModel
      .findOneAndUpdate(
        { shopId },
        { $set: { draftData: globalData } },
        { upsert: true, new: true },
      )
      .exec();

    const appliedPages: string[] = [];
    for (const [pageType, components] of Object.entries(theme.pages ?? {})) {
      await this.pageLayoutModel
        .findOneAndUpdate(
          { shopId, pageType },
          { $set: { draftData: { components } } },
          { upsert: true, new: true },
        )
        .exec();
      appliedPages.push(pageType);
    }

    this.logger.log(
      `Applied theme "${themeId}" to shop ${shopId} (${appliedPages.length} page(s)).`,
    );
    return { status: 'applied', themeId, shopId, pages: appliedPages };
  }

  // ---- internal helpers -------------------------------------------------

  private shortId(): string {
    return Math.random().toString(36).slice(2, 8);
  }

  /** Throws unless the actor is an ADMIN (role resolved from the DB, not session). */
  private async assertAdmin(actor: AuthActor): Promise<void> {
    if (await this.isAdmin(actor)) return;
    throw new ForbiddenException('Admin only');
  }

  private async isAdmin(actor: AuthActor): Promise<boolean> {
    if (actor.role === 'ADMIN') return true;
    const user = await this.prisma.user.findUnique({
      where: { id: actor.id },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  }

  /** Throws unless the actor owns `shopId` (or is an admin). */
  private async assertShopOwner(shopId: string, actor: AuthActor): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });
    if (!shop) throw new NotFoundException(`Shop "${shopId}" not found`);
    if (shop.ownerId === actor.id) return;
    if (await this.isAdmin(actor)) return;
    throw new ForbiddenException('You do not own this shop');
  }

  /** Fetch a theme and assert the actor is its owner (or an admin). */
  private async getOwnedThemeOrThrow(
    themeId: string,
    actor: AuthActor,
  ): Promise<ThemeTemplateDocument> {
    const theme = await this.themeModel.findOne({ themeId }).lean().exec();
    if (!theme) throw new NotFoundException(`Theme "${themeId}" not found`);
    if (theme.ownerUserId === actor.id) return theme;
    if (await this.isAdmin(actor)) return theme;
    throw new ForbiddenException('You do not own this theme');
  }
}
