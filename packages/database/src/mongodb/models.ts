import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// MongoDB Collections for E-commerce Platform
// ==========================================

// ------------------------------------------
// 1. Layouts (Zero-File Architecture)
// ------------------------------------------

export interface IGlobalLayout extends Document {
    shopId: string; // Foreign key linking to PostgreSQL Shop.id
    publishedData: Record<string, unknown>;
    draftData: Record<string, unknown>;
}

export const GlobalLayoutSchema: Schema = new Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    publishedData: { type: Schema.Types.Mixed, default: {} },
    draftData: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export interface IPageLayout extends Document {
    shopId: string;
    pageType: string;
    slug?: string;
    publishedData: Record<string, unknown>;
    draftData: Record<string, unknown>;
}

export const PageLayoutSchema: Schema = new Schema({
    shopId: { type: String, required: true },
    pageType: { type: String, required: true },
    slug: { type: String },
    publishedData: { type: Schema.Types.Mixed, default: {} },
    draftData: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

PageLayoutSchema.index({ shopId: 1, pageType: 1, slug: 1 }, { unique: true });

// ------------------------------------------
// 2. ProductLayout (Consolidated Storefront Product Data)
// ------------------------------------------

export interface IProductLayout extends Document {
    productId: string; // Linking to PostgreSQL Product.id
    shopId: string;
    descriptionHtml: string;
    imageUrls: string[];
    videoUrls: string[];
    attributes: Record<string, unknown>;
    variantsData: Array<{
        sku: string;
        attributes: Record<string, unknown>;
        image: string;
    }>;
    seoData: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
    };
    customLandingPageLayout: Record<string, unknown> | null;
}

export const ProductLayoutSchema: Schema = new Schema({
    productId: { type: String, required: true },
    shopId: { type: String, required: true, index: true },
    descriptionHtml: { type: String, default: '' },
    imageUrls: [{ type: String }],
    videoUrls: [{ type: String }],
    attributes: { type: Schema.Types.Mixed, default: {} },
    variantsData: [{
        sku: { type: String, required: true },
        attributes: { type: Schema.Types.Mixed, default: {} },
        image: { type: String },
        _id: false
    }],
    seoData: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String }],
    },
    customLandingPageLayout: { type: Schema.Types.Mixed, default: null }
}, { timestamps: true, collection: 'product_layouts' });

ProductLayoutSchema.index({ productId: 1 }, { unique: true });

// ------------------------------------------
// 3. Master Template Catalog (Metadata for UI)
// ------------------------------------------

export interface IMasterTemplateCatalog extends Document {
    templateKey: string;
    templateType: string;
    industry: string;
    displayName: string;
    description: string;
    icon: string;
    isCustom: boolean;
    // layout JSON for custom templates (LAY-1). NOT named `schema` — that clashes
    // with Mongoose Document's built-in `.schema`.
    layoutSchema?: Record<string, unknown>;
}

export const MasterTemplateCatalogSchema: Schema = new Schema({
    templateKey: { type: String, required: true, unique: true, index: true },
    templateType: { type: String, required: true },
    industry: { type: String, required: true },
    displayName: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
    // Custom templates created via POST /layouts/master carry their layout JSON
    // here. Built-in templates leave it unset (UI reads them by templateKey).
    layoutSchema: { type: Schema.Types.Mixed },
}, { timestamps: true, collection: 'master_template_catalog' });

// ------------------------------------------
// 4. UI Component Catalog
// ------------------------------------------

export interface IUIComponentCatalog extends Document {
    componentId: string;
    name: string;
    category: string;
    type: string; // 'section' or 'block'
    mediaUrl?: string; // For blocks/sections containing media from MinIO
    settings: Record<string, unknown>[];
    allowedBlocks?: string[];
}

export const UIComponentCatalogSchema: Schema = new Schema({
    componentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true },
    mediaUrl: { type: String },
    settings: { type: [Schema.Types.Mixed], default: [] },
    allowedBlocks: [{ type: String }],
}, { timestamps: true, collection: 'ui_component_catalog' });

// ------------------------------------------
// 5. Theme Market (curated, ready-to-apply themes)
// ------------------------------------------

/**
 * A reusable, multi-page theme browsable in the admin "Theme Market" and
 * applied to a shop's draft layout in one click. Curated by admins from
 * design-agent Figma extractions (the `source` traces the origin).
 *
 * Storage note: images are NEVER stored here — only MinIO URLs inside
 * `global`/`pages` props and `previewImageUrl`. The document is small JSON
 * (well under Atlas's 16MB/doc limit). `global`/`pages` are already in the
 * builder's editor shape so applying a theme is a direct copy into
 * GlobalLayout.draftData / PageLayout.draftData.
 */
export interface IThemeTemplate extends Document {
    themeId: string; // unique slug, e.g. "minimal-fashion"
    title: string;
    description?: string;
    category?: string; // industry/category label
    status: 'draft' | 'pending' | 'published'; // pending = awaiting admin review
    previewImageUrl?: string;
    thumbnails: string[];
    source?: { figmaFileKey?: string; figmaNodeIds: string[] };
    global: Record<string, unknown>; // { theme, globalComponents }
    pages: Record<string, unknown>; // { home: [...], product_listing: [...], ... }
    assetKeys: string[]; // MinIO object keys for cleanup on delete
    tenantId: string | null; // null = shared market theme
    ownerUserId: string | null; // creator; null = admin/platform-owned
    ownerShopId: string | null; // shop a "save as theme" was captured from
    // Commerce fields — reserved; everything is free for now (no payment wired).
    pricing: { isPaid: boolean; priceCents: number; currency: string };
    // Review workflow metadata.
    review: {
        submittedAt?: Date;
        reviewedAt?: Date;
        reviewedBy?: string; // admin userId
        rejectionReason?: string;
    };
    version: number;
}

export const ThemeTemplateSchema: Schema = new Schema({
    themeId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, index: true },
    status: { type: String, enum: ['draft', 'pending', 'published'], default: 'draft', index: true },
    previewImageUrl: { type: String },
    thumbnails: [{ type: String }],
    source: {
        figmaFileKey: { type: String },
        figmaNodeIds: [{ type: String }],
    },
    global: { type: Schema.Types.Mixed, default: {} },
    pages: { type: Schema.Types.Mixed, default: {} },
    assetKeys: [{ type: String }],
    tenantId: { type: String, default: null, index: true },
    ownerUserId: { type: String, default: null, index: true },
    ownerShopId: { type: String, default: null },
    pricing: {
        isPaid: { type: Boolean, default: false },
        priceCents: { type: Number, default: 0 },
        currency: { type: String, default: 'VND' },
    },
    review: {
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
        reviewedBy: { type: String },
        rejectionReason: { type: String },
    },
    version: { type: Number, default: 1 },
}, { timestamps: true, collection: 'theme_templates' });

// Exports
export const GlobalLayout = mongoose.models.GlobalLayout || mongoose.model<IGlobalLayout>('GlobalLayout', GlobalLayoutSchema);
export const PageLayout = mongoose.models.PageLayout || mongoose.model<IPageLayout>('PageLayout', PageLayoutSchema);
export const ProductLayout = mongoose.models.ProductLayout || mongoose.model<IProductLayout>('ProductLayout', ProductLayoutSchema);
export const MasterTemplateCatalog = mongoose.models.MasterTemplateCatalog || mongoose.model<IMasterTemplateCatalog>('MasterTemplateCatalog', MasterTemplateCatalogSchema);
export const UIComponentCatalog = mongoose.models.UIComponentCatalog || mongoose.model<IUIComponentCatalog>('UIComponentCatalog', UIComponentCatalogSchema);
export const ThemeTemplate = mongoose.models.ThemeTemplate || mongoose.model<IThemeTemplate>('ThemeTemplate', ThemeTemplateSchema);

/**
 * @deprecated Use ProductLayout instead. Kept for backward compatibility during migration.
 */
export const MongoProduct = ProductLayout;
