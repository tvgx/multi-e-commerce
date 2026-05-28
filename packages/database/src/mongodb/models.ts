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

const GlobalLayoutSchema: Schema = new Schema({
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

const PageLayoutSchema: Schema = new Schema({
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
    attributes: Record<string, any>;
    variantsData: Array<{
        sku: string;
        attributes: Record<string, any>;
        image: string;
    }>;
    seoData: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
    };
    customLandingPageLayout: Record<string, any> | null;
}

const ProductLayoutSchema: Schema = new Schema({
    productId: { type: String, required: true, index: true },
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
}

const MasterTemplateCatalogSchema: Schema = new Schema({
    templateKey: { type: String, required: true, unique: true, index: true },
    templateType: { type: String, required: true },
    industry: { type: String, required: true },
    displayName: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
}, { timestamps: true, collection: 'master_template_catalog' });

// Exports
export const GlobalLayout = mongoose.models.GlobalLayout || mongoose.model<IGlobalLayout>('GlobalLayout', GlobalLayoutSchema);
export const PageLayout = mongoose.models.PageLayout || mongoose.model<IPageLayout>('PageLayout', PageLayoutSchema);
export const ProductLayout = mongoose.models.ProductLayout || mongoose.model<IProductLayout>('ProductLayout', ProductLayoutSchema);
export const MasterTemplateCatalog = mongoose.models.MasterTemplateCatalog || mongoose.model<IMasterTemplateCatalog>('MasterTemplateCatalog', MasterTemplateCatalogSchema);

/**
 * @deprecated Use ProductLayout instead. Kept for backward compatibility during migration.
 */
export const MongoProduct = ProductLayout;
